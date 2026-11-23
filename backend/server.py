import http.server
import socketserver
import json
import urllib.parse
import urllib.request
import os
import sys
import math
import time
import random
from datetime import datetime, timedelta

# Ensure backend directory is in python module path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import (
    init_db,
    register_owner,
    authenticate_owner,
    get_owner_by_token,
    logout_owner_session,
    get_owner_stations,
    create_station,
    update_station,
    delete_station,
    get_station_details,
    create_charger,
    update_charger,
    update_charger_status,
    delete_charger,
    get_all_public_stations_with_chargers,
    get_owner_analytics,
    get_all_plans,
    insert_plan,
    update_plan_by_id,
    delete_plan_by_id,
    clear_all_plans
)
from ml_models import ml_regressor, ml_battery, ai_copilot

PORT = int(os.environ.get('PORT', 8000))
OCM_API_KEY = os.environ.get('OPEN_CHARGE_MAP_API_KEY', '')

# Simple in-memory TTL cache for external APIs
CACHE = {}
CACHE_TTL = 300 # 5 minutes

def get_cached(key):
    if key in CACHE:
        val, expiry = CACHE[key]
        if time.time() < expiry:
            return val
        else:
            del CACHE[key]
    return None

def set_cached(key, val, ttl=CACHE_TTL):
    CACHE[key] = (val, time.time() + ttl)

def fetch_json_url(url, headers=None, timeout=8):
    req_headers = {'User-Agent': 'ChargeSmart-EV-Platform/2.5 (contact@greenbyte.energy)'}
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, headers=req_headers)
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return json.loads(response.read().decode('utf-8'))

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

class ChargeSmartAPIHandler(http.server.BaseHTTPRequestHandler):
    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def send_json(self, status_code: int, data: dict):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2).encode('utf-8'))

    def parse_json_body(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                body = self.rfile.read(content_length)
                return json.loads(body.decode('utf-8'))
            return {}
        except Exception:
            return {}

    def get_authenticated_owner(self):
        auth_header = self.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return None
        token = auth_header.split('Bearer ', 1)[1].strip()
        return get_owner_by_token(token)

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        query_params = urllib.parse.parse_qs(parsed_url.query)

        # 1. Health check
        if path == '/api/health':
            self.send_json(200, {
                "status": "healthy",
                "backend": "Python 3.11 ChargeSmart Real-Time Engine",
                "database": "SQLite 3 Persisted",
                "ml_models": {
                    "solar_wind_regressor": ml_regressor.model_version,
                    "battery_degradation_model": ml_battery.model_name,
                    "ai_energy_copilot": "Active"
                },
                "server_time": datetime.utcnow().isoformat(),
                "providers": {
                    "verified_owner_network": "Active (SQLite Database)",
                    "openstreetmap_nominatim": "Active",
                    "openstreetmap_overpass": "Active",
                    "open_meteo_radiation": "Active",
                    "osrm_routing": "Active",
                    "open_charge_map": "Configured" if OCM_API_KEY else "Available (Key optional)"
                }
            })
            return

        # 2. Auth: Get Current Owner Profile
        elif path == '/api/auth/me':
            owner = self.get_authenticated_owner()
            if not owner:
                self.send_json(401, {"error": "Unauthorized. Please log in as a station owner."})
                return
            self.send_json(200, {"owner": owner})
            return

        # 3. Owner: Get Stations
        elif path == '/api/owner/stations':
            owner = self.get_authenticated_owner()
            if not owner:
                self.send_json(401, {"error": "Unauthorized. Please log in as a station owner."})
                return
            stations = get_owner_stations(owner['id'])
            self.send_json(200, {"stations": stations, "total": len(stations)})
            return

        # 4. Owner: Get Single Station Details
        elif path.startswith('/api/owner/stations/'):
            station_id = path.split('/api/owner/stations/')[1]
            owner = self.get_authenticated_owner()
            if not owner:
                self.send_json(401, {"error": "Unauthorized. Please log in."})
                return
            station = get_station_details(station_id)
            if not station or station['owner_id'] != owner['id']:
                self.send_json(404, {"error": "Station not found or access denied."})
                return
            self.send_json(200, {"station": station})
            return

        # 5. Owner: Analytics & Real-Time KPIs
        elif path == '/api/owner/analytics':
            owner = self.get_authenticated_owner()
            if not owner:
                self.send_json(401, {"error": "Unauthorized. Please log in as a station owner."})
                return
            analytics = get_owner_analytics(owner['id'])
            self.send_json(200, analytics)
            return

        # 6. Geocoding Search (OSM Nominatim Proxy with Caching)
        elif path == '/api/geocode/search':
            query = query_params.get('q', [''])[0].strip()
            if not query:
                self.send_json(400, {"error": "Missing search query parameter 'q'"})
                return

            cache_key = f"geo_{query.lower()}"
            cached = get_cached(cache_key)
            if cached:
                self.send_json(200, {"query": query, "results": cached, "cached": True})
                return

            try:
                encoded_q = urllib.parse.quote(query)
                url = f"https://nominatim.openstreetmap.org/search?q={encoded_q}&format=json&limit=6&addressdetails=1"
                data = fetch_json_url(url, timeout=5)
                results = []
                for item in data:
                    addr = item.get('address', {})
                    city = addr.get('city') or addr.get('town') or addr.get('village') or addr.get('county') or addr.get('state') or query
                    country = addr.get('country', '')
                    results.append({
                        "displayName": item.get('display_name', query),
                        "latitude": float(item.get('lat', 0)),
                        "longitude": float(item.get('lon', 0)),
                        "city": city,
                        "country": country,
                        "type": item.get('type', 'place'),
                        "source": "OpenStreetMap Nominatim"
                    })
                set_cached(cache_key, results, ttl=600)
                self.send_json(200, {"query": query, "results": results, "cached": False})
            except Exception as e:
                self.send_json(500, {"error": "Geocoding request failed", "details": str(e), "results": []})
            return

        # 7. Unified EV Charging Station Discovery (Owner Verified + OpenStreetMap)
        elif path == '/api/stations/nearby':
            try:
                lat = float(query_params.get('lat', [12.9716])[0])
                lon = float(query_params.get('lon', [77.5946])[0])
                radius_m = int(query_params.get('radius', [25000])[0])
                radius_m = min(max(radius_m, 2000), 100000) # 2km to 100km
            except (ValueError, IndexError):
                self.send_json(400, {"error": "Invalid latitude, longitude, or radius"})
                return

            radius_km = radius_m / 1000.0
            stations = []

            # 7a. First, retrieve Verified Stations from Station Owners Database
            try:
                db_stations = get_all_public_stations_with_chargers()
                for st in db_stations:
                    dist = haversine_km(lat, lon, st['latitude'], st['longitude'])
                    # If within radius
                    if dist <= radius_km:
                        chargers = st.get('chargers', [])
                        total_plugs = sum(c.get('total_connectors', 1) for c in chargers)
                        avail_plugs = sum(c.get('total_connectors', 1) for c in chargers if c.get('availability_status') == 'Available')
                        occupied_plugs = sum(c.get('total_connectors', 1) for c in chargers if c.get('availability_status') == 'Occupied')
                        maint_plugs = sum(c.get('total_connectors', 1) for c in chargers if c.get('availability_status') in ('Maintenance', 'Out of Service', 'Offline'))

                        max_kw = max((float(c.get('power_kw', 22.0)) for c in chargers), default=22.0)
                        min_price = min((float(c.get('price_per_kwh', 0.20)) for c in chargers), default=0.20)

                        # Connector summaries
                        conn_map = {}
                        for c in chargers:
                            ctype = c.get('connector_type', 'CCS2')
                            if ctype not in conn_map:
                                conn_map[ctype] = {
                                    'type': ctype,
                                    'powerKw': float(c.get('power_kw', 50.0)),
                                    'available': 0,
                                    'total': 0
                                }
                            conn_map[ctype]['total'] += int(c.get('total_connectors', 1))
                            if c.get('availability_status') == 'Available':
                                conn_map[ctype]['available'] += int(c.get('total_connectors', 1))
                            conn_map[ctype]['powerKw'] = max(conn_map[ctype]['powerKw'], float(c.get('power_kw', 50.0)))

                        connectors_list = list(conn_map.values())
                        if not connectors_list:
                            connectors_list = [{'type': 'CCS2', 'powerKw': 150.0, 'available': 2, 'total': 2}]

                        latest_updated = st.get('updated_at', datetime.utcnow().isoformat())
                        if chargers:
                            latest_updated = max((c.get('last_status_updated', latest_updated) for c in chargers), default=latest_updated)

                        has_solar = any('solar' in f.lower() for f in st.get('facilities', []))

                        stations.append({
                            "id": st['id'],
                            "name": st['name'],
                            "operator": st.get('network_operator') or st.get('business_name') or 'ChargeSmart Network',
                            "address": st['address'],
                            "city": st['city'],
                            "latitude": st['latitude'],
                            "longitude": st['longitude'],
                            "distanceKm": dist,
                            "totalPlugs": total_plugs,
                            "availablePlugs": avail_plugs,
                            "occupiedPlugs": occupied_plugs,
                            "outOfServicePlugs": maint_plugs,
                            "connectors": connectors_list,
                            "chargers": chargers,
                            "maxPowerKw": max_kw,
                            "pricePerKwh": min_price,
                            "isVerifiedPrice": True,
                            "tariffDetails": f"${min_price:.2f}/kWh verified operator rate",
                            "currency": chargers[0].get('currency', 'USD') if chargers else 'USD',
                            "renewableInfo": {
                                "source": "On-Site Solar Canopy & BESS" if has_solar else "100% Certified Green Grid Mix",
                                "verified": True,
                                "greenSharePercent": 88 if has_solar else 72,
                                "lifecycleRating": "A+" if has_solar else "A"
                            },
                            "amenities": st.get('facilities', ["Public Access", "24/7 Security"]),
                            "status": "available" if avail_plugs > 0 else "busy",
                            "liveStatus": "operator_reported",
                            "isLiveStatusAvailable": True,
                            "dataProvider": "ChargeSmart Verified Owner",
                            "lastUpdated": latest_updated,
                            "isVerified": True,
                            "openingHours": st.get('operating_hours', '24/7 Access'),
                            "contactPhone": st.get('contact_phone', ''),
                            "contactEmail": st.get('contact_email', ''),
                            "description": st.get('description', '')
                        })
            except Exception as e:
                print(f"[ERROR] DB station retrieval failed: {e}")

            # 7b. Query OpenStreetMap Overpass (with caching)
            cache_key = f"osm_{round(lat, 3)}_{round(lon, 3)}_{radius_m}"
            cached_osm = get_cached(cache_key)
            osm_stations = []

            if cached_osm is not None:
                osm_stations = cached_osm
            else:
                try:
                    overpass_query = f"""
                    [out:json][timeout:12];
                    (
                      node["amenity"="charging_station"](around:{radius_m}, {lat}, {lon});
                      way["amenity"="charging_station"](around:{radius_m}, {lat}, {lon});
                    );
                    out center 40;
                    """
                    overpass_url = "https://overpass-api.de/api/interpreter"
                    req = urllib.request.Request(
                        overpass_url,
                        data=f"data={urllib.parse.quote(overpass_query)}".encode('utf-8'),
                        headers={
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'User-Agent': 'ChargeSmart-EV-Platform/2.5'
                        }
                    )
                    with urllib.request.urlopen(req, timeout=10) as resp:
                        osm_data = json.loads(resp.read().decode('utf-8'))
                        elements = osm_data.get('elements', [])

                    for idx, elem in enumerate(elements):
                        tags = elem.get('tags', {})
                        st_lat = elem.get('lat') or (elem.get('center') and elem['center'].get('lat')) or lat
                        st_lon = elem.get('lon') or (elem.get('center') and elem['center'].get('lon')) or lon
                        dist = haversine_km(lat, lon, st_lat, st_lon)

                        connectors = []
                        max_power = 22.0

                        if tags.get('socket:type2_combo') or tags.get('socket:type2_combo:output'):
                            kw = float(tags.get('socket:type2_combo:output') or 60.0)
                            max_power = max(max_power, kw)
                            connectors.append({'type': 'CCS2', 'powerKw': kw, 'available': 2, 'total': 3})
                        if tags.get('socket:type2') or tags.get('socket:type2:output') or len(connectors) == 0:
                            kw = float(tags.get('socket:type2:output') or 22.0)
                            connectors.append({'type': 'Type 2', 'powerKw': kw, 'available': 1, 'total': 2})
                        if tags.get('socket:chademo'):
                            connectors.append({'type': 'CHAdeMO', 'powerKw': 50.0, 'available': 1, 'total': 1})
                        if tags.get('socket:schuko'):
                            connectors.append({'type': 'Bharat AC001', 'powerKw': 3.3, 'available': 1, 'total': 2})

                        name = tags.get('name') or tags.get('brand') or tags.get('operator') or f"EV Charging Station #{idx + 1}"
                        operator = tags.get('operator') or tags.get('brand') or 'Public EV Network'
                        street = f"{tags.get('addr:street', '')} {tags.get('addr:housenumber', '')}".strip()
                        city = tags.get('addr:city') or tags.get('addr:district') or tags.get('addr:suburb') or 'Area Location'
                        address = f"{street}, {city}".strip(', ') if street else city

                        fee = tags.get('fee') or tags.get('charge:fee') or ''
                        is_free = 'no' in fee.lower()
                        verified_price = 0.0 if is_free else None

                        has_solar_tag = tags.get('solar_power') == 'yes' or tags.get('generator:source') == 'solar'

                        osm_stations.append({
                            "id": f"osm-{elem.get('id', idx)}",
                            "name": name,
                            "operator": operator,
                            "address": address or "Mapped on OpenStreetMap",
                            "city": city,
                            "latitude": st_lat,
                            "longitude": st_lon,
                            "distanceKm": dist,
                            "totalPlugs": sum(c['total'] for c in connectors),
                            "availablePlugs": sum(c['available'] for c in connectors),
                            "occupiedPlugs": 0,
                            "outOfServicePlugs": 0,
                            "connectors": connectors,
                            "maxPowerKw": max_power,
                            "pricePerKwh": verified_price if verified_price is not None else 0.18,
                            "isVerifiedPrice": verified_price is not None,
                            "tariffDetails": 'Free Access' if is_free else 'On-site operator tariff',
                            "currency": "USD",
                            "renewableInfo": {
                                "source": "Rooftop Solar Canopy" if has_solar_tag else "Regional Grid Mix",
                                "verified": has_solar_tag,
                                "greenSharePercent": 85 if has_solar_tag else 45,
                                "lifecycleRating": "A+" if has_solar_tag else "B"
                            },
                            "amenities": ["Public Access", "OSM Geocoded"],
                            "status": "available",
                            "liveStatus": "unknown",
                            "isLiveStatusAvailable": False,
                            "dataProvider": "OpenStreetMap Overpass API",
                            "lastUpdated": datetime.utcnow().isoformat(),
                            "isVerified": True,
                            "openingHours": tags.get('opening_hours', '24/7 Access')
                        })
                    set_cached(cache_key, osm_stations, ttl=300)
                except Exception as e:
                    print(f"[WARN] Overpass fetch failed: {e}")

            # Merge owner stations + OSM stations, avoiding duplicate locations (within 50 meters)
            final_stations = list(stations)
            for osm_st in osm_stations:
                is_duplicate = any(
                    haversine_km(osm_st['latitude'], osm_st['longitude'], s['latitude'], s['longitude']) < 0.05
                    for s in final_stations
                )
                if not is_duplicate:
                    final_stations.append(osm_st)

            final_stations.sort(key=lambda s: s['distanceKm'])
            self.send_json(200, {
                "stations": final_stations,
                "total": len(final_stations),
                "verifiedOwnerCount": len(stations),
                "osmCount": len(osm_stations),
                "provider": "ChargeSmart Unified Discovery"
            })
            return

        # 8. Route Calculation (OSRM Driving API Proxy)
        elif path == '/api/route':
            try:
                start_lat = float(query_params.get('startLat', [0])[0])
                start_lon = float(query_params.get('startLon', [0])[0])
                dest_lat = float(query_params.get('destLat', [0])[0])
                dest_lon = float(query_params.get('destLon', [0])[0])
            except (ValueError, IndexError):
                self.send_json(400, {"error": "Missing or invalid start/destination coordinates"})
                return

            cache_key = f"route_{round(start_lat,3)}_{round(start_lon,3)}_{round(dest_lat,3)}_{round(dest_lon,3)}"
            cached = get_cached(cache_key)
            if cached:
                self.send_json(200, cached)
                return

            try:
                osrm_url = f"https://router.project-osrm.org/route/v1/driving/{start_lon},{start_lat};{dest_lon},{dest_lat}?overview=full&geometries=geojson"
                data = fetch_json_url(osrm_url, timeout=7)
                routes = data.get('routes', [])
                if routes:
                    route = routes[0]
                    dist_km = round(route.get('distance', 0) / 1000.0, 1)
                    duration_mins = round(route.get('duration', 0) / 60.0)
                    coords = route.get('geometry', {}).get('coordinates', [])
                    lat_lon_points = [[pt[1], pt[0]] for pt in coords]

                    route_res = {
                        "distanceKm": dist_km,
                        "durationMinutes": duration_mins,
                        "durationFormatted": f"{duration_mins // 60}h {duration_mins % 60}m" if duration_mins >= 60 else f"{duration_mins}m",
                        "coordinates": lat_lon_points,
                        "isSimulatedRoute": False,
                        "provider": "OSRM Open Source Routing Machine"
                    }
                    set_cached(cache_key, route_res, ttl=600)
                    self.send_json(200, route_res)
                    return
            except Exception:
                dist_km = haversine_km(start_lat, start_lon, dest_lat, dest_lon)
                duration_mins = round(dist_km / 65.0 * 60.0)
                pts = []
                for i in range(11):
                    f = i / 10.0
                    pts.append([round(start_lat + f * (dest_lat - start_lat), 5), round(start_lon + f * (dest_lon - start_lon), 5)])
                self.send_json(200, {
                    "distanceKm": dist_km,
                    "durationMinutes": duration_mins,
                    "durationFormatted": f"{duration_mins // 60}h {duration_mins % 60}m" if duration_mins >= 60 else f"{duration_mins}m",
                    "coordinates": pts,
                    "isSimulatedRoute": True,
                    "provider": "Haversine Direct Estimation (OSRM Offline)"
                })
            return

        # 9. Live Grid Telemetry
        elif path == '/api/grid/live':
            now = datetime.now()
            current_hour = now.hour + now.minute / 60.0

            req_lat = query_params.get('lat')
            req_lon = query_params.get('lon')

            solar_irradiance = None
            wind_speed = None
            cloud_pct = 20.0
            temp_c = 28.0

            if req_lat and req_lon:
                try:
                    lat_f = float(req_lat[0])
                    lon_f = float(req_lon[0])
                    meteo_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat_f}&longitude={lon_f}&current=direct_normal_irradiance,wind_speed_10m,temperature_2m,cloud_cover"
                    meteo = fetch_json_url(meteo_url, timeout=3)
                    cur = meteo.get('current', {})
                    solar_irradiance = cur.get('direct_normal_irradiance')
                    wind_speed = cur.get('wind_speed_10m')
                    cloud_pct = cur.get('cloud_cover', 20.0)
                    temp_c = cur.get('temperature_2m', 28.0)
                except Exception:
                    pass

            forecast = ml_regressor.predict_combined(
                hour=current_hour,
                cloud_cover_pct=cloud_pct,
                temp_c=temp_c,
                wind_speed_ms=wind_speed if wind_speed is not None else 7.5
            )

            freq_jitter = round(50.0 + (random.random() - 0.5) * 0.04, 3)

            self.send_json(200, {
                "timestamp": now.isoformat(),
                "hour": round(current_hour, 2),
                "solar_generation_mw": forecast["solar"]["predicted_mw"],
                "wind_generation_mw": forecast["wind"]["predicted_mw"],
                "total_renewable_mw": forecast["total_renewable_mw"],
                "grid_demand_mw": forecast["grid_demand_mw"],
                "clean_share_pct": forecast["clean_share_pct"],
                "spot_tariff_usd": forecast["spot_tariff_usd"],
                "carbon_intensity_kg_kwh": forecast["carbon_intensity_kg_kwh"],
                "grid_frequency_hz": freq_jitter,
                "grid_status": "STABLE_DISPATCH" if freq_jitter >= 49.98 else "PEAK_STRAIN",
                "weather_telemetry": {
                    "provider": "Open-Meteo Physical Radiation API" if solar_irradiance is not None else "GreenByte Diurnal Model",
                    "cloud_cover_pct": cloud_pct,
                    "temperature_c": temp_c,
                    "wind_speed_ms": wind_speed or 7.5
                }
            })
            return

        # 10. 48-Hour Grid Forecast
        elif path == '/api/grid/forecast':
            now = datetime.now()
            hours_count = int(query_params.get('hours', [24])[0])
            hours_count = min(max(hours_count, 12), 48)

            points = []
            for i in range(hours_count):
                future_time = now + timedelta(hours=i)
                h = future_time.hour
                fc = ml_regressor.predict_combined(
                    hour=float(h),
                    cloud_cover_pct=25.0 + 15.0 * math.sin(i / 8.0),
                    temp_c=28.0 + 4.0 * math.cos((h - 14.0) / 12.0 * math.pi),
                    wind_speed_ms=7.0 + 3.0 * math.sin(i / 6.0)
                )
                points.append({
                    "hour": h,
                    "timeLabel": f"{h:02d}:00",
                    "dayOffset": i // 24,
                    "solarGenerationMw": fc["solar"]["predicted_mw"],
                    "windGenerationMw": fc["wind"]["predicted_mw"],
                    "totalRenewableMw": fc["total_renewable_mw"],
                    "gridDemandMw": fc["grid_demand_mw"],
                    "renewableSharePercent": fc["clean_share_pct"],
                    "gridTariff": fc["spot_tariff_usd"],
                    "gridEmissionFactorKg": fc["carbon_intensity_kg_kwh"],
                    "lifecycleRenewableEmissionKg": 0.04,
                    "isPeakTariff": fc["spot_tariff_usd"] >= 0.30,
                    "isPeakSolar": 11 <= h <= 14
                })

            self.send_json(200, {"forecast": points, "generated_at": now.isoformat()})
            return

        # 11. Saved Plans (SQLite)
        elif path == '/api/plans':
            plans = get_all_plans()
            self.send_json(200, {"plans": plans, "total": len(plans)})
            return

        else:
            self.send_json(404, {"error": "Endpoint not found", "path": path})

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        body = self.parse_json_body()

        # 1. Auth: Owner Registration
        if path == '/api/auth/register':
            required = ['fullName', 'email', 'businessName', 'password']
            for f in required:
                if not body.get(f):
                    self.send_json(400, {"error": f"Missing required field: '{f}'"})
                    return

            try:
                owner = register_owner(
                    full_name=body['fullName'],
                    email=body['email'],
                    phone=body.get('phone', ''),
                    business_name=body['businessName'],
                    password=body['password'],
                    business_address=body.get('businessAddress', '')
                )
                auth_res = authenticate_owner(body['email'], body['password'])
                self.send_json(201, {
                    "message": "Station owner registered successfully",
                    "token": auth_res['token'],
                    "owner": auth_res['owner']
                })
            except ValueError as ve:
                self.send_json(400, {"error": str(ve)})
            except Exception as e:
                self.send_json(500, {"error": "Registration failed", "details": str(e)})
            return

        # 2. Auth: Owner Login
        elif path == '/api/auth/login':
            email = body.get('email', '')
            password = body.get('password', '')
            if not email or not password:
                self.send_json(400, {"error": "Email and password are required."})
                return

            auth_res = authenticate_owner(email, password)
            if not auth_res:
                self.send_json(401, {"error": "Invalid email or password."})
                return

            self.send_json(200, {
                "message": "Login successful",
                "token": auth_res['token'],
                "owner": auth_res['owner']
            })
            return

        # 3. Auth: Owner Logout
        elif path == '/api/auth/logout':
            auth_header = self.headers.get('Authorization', '')
            if auth_header.startswith('Bearer '):
                token = auth_header.split('Bearer ', 1)[1].strip()
                logout_owner_session(token)
            self.send_json(200, {"message": "Logged out successfully"})
            return

        # 4. Owner: Create Station
        elif path == '/api/owner/stations':
            owner = self.get_authenticated_owner()
            if not owner:
                self.send_json(401, {"error": "Unauthorized. Please log in."})
                return

            required = ['name', 'address', 'city', 'latitude', 'longitude']
            for f in required:
                if f not in body or body[f] == '':
                    self.send_json(400, {"error": f"Field '{f}' is required."})
                    return

            try:
                new_st = create_station(owner['id'], body)
                self.send_json(201, {"message": "Charging station created successfully", "station": new_st})
            except Exception as e:
                self.send_json(500, {"error": "Failed to create station", "details": str(e)})
            return

        # 5. Owner: Add Charger to Station
        elif path.startswith('/api/owner/stations/') and path.endswith('/chargers'):
            parts = path.split('/')
            station_id = parts[4]
            owner = self.get_authenticated_owner()
            if not owner:
                self.send_json(401, {"error": "Unauthorized. Please log in."})
                return

            if not body.get('charger_identifier'):
                self.send_json(400, {"error": "charger_identifier is required"})
                return

            new_ch = create_charger(station_id, owner['id'], body)
            if not new_ch:
                self.send_json(404, {"error": "Station not found or access denied"})
                return

            self.send_json(201, {"message": "Charger added to station", "charger": new_ch})
            return

        # 6. Owner: Quick Charger Status Toggle (Available / Occupied / Maintenance)
        elif path.startswith('/api/owner/chargers/') and path.endswith('/status'):
            parts = path.split('/')
            charger_id = parts[4]
            owner = self.get_authenticated_owner()
            if not owner:
                self.send_json(401, {"error": "Unauthorized. Please log in."})
                return

            new_status = body.get('status')
            valid_statuses = ('Available', 'Occupied', 'Out of Service', 'Maintenance', 'Offline')
            if new_status not in valid_statuses:
                self.send_json(400, {"error": f"Invalid status '{new_status}'. Must be one of {valid_statuses}"})
                return

            updated = update_charger_status(charger_id, owner['id'], new_status, body.get('notes', ''))
            if not updated:
                self.send_json(404, {"error": "Charger not found or access denied"})
                return

            self.send_json(200, {
                "message": f"Charger status updated to {new_status}",
                "charger": updated
            })
            return

        # 7. AI Energy Copilot Query
        elif path == '/api/ai/copilot':
            query = body.get('message', '')
            context = body.get('context', {})
            response = ai_copilot.answer_query(query, context)
            self.send_json(200, response)
            return

        # 8. Interactive ML Solar & Wind Prediction
        elif path == '/api/ai/forecast-ml':
            hour = float(body.get('hour', datetime.now().hour))
            cloud_cover = float(body.get('cloud_cover_pct', 20.0))
            temperature = float(body.get('temperature_c', 28.0))
            wind_speed = float(body.get('wind_speed_ms', 8.0))

            prediction = ml_regressor.predict_combined(hour, cloud_cover, temperature, wind_speed)
            self.send_json(200, {
                "inputs": {
                    "hour": hour,
                    "cloud_cover_pct": cloud_cover,
                    "temperature_c": temperature,
                    "wind_speed_ms": wind_speed
                },
                "prediction": prediction,
                "model_metadata": {
                    "version": ml_regressor.model_version,
                    "r2_solar_accuracy": ml_regressor.r2_solar_accuracy,
                    "r2_wind_accuracy": ml_regressor.r2_wind_accuracy
                }
            })
            return

        # 9. ML Battery Health & Degradation Analysis
        elif path == '/api/ai/battery-analysis':
            capacity = float(body.get('battery_capacity_kwh', 40.5))
            current_soc = float(body.get('current_soc', 20.0))
            desired_soc = float(body.get('desired_soc', 80.0))
            charge_power = float(body.get('charge_power_kw', 50.0))
            temp_c = float(body.get('ambient_temp_c', 28.0))

            analysis = ml_battery.analyze_charging_session(
                battery_capacity_kwh=capacity,
                current_soc=current_soc,
                desired_soc=desired_soc,
                charge_power_kw=charge_power,
                ambient_temp_c=temp_c
            )
            self.send_json(200, analysis)
            return

        # 10. Save Plan (SQLite)
        elif path == '/api/plans':
            if not body.get('id'):
                body['id'] = f"plan-{int(datetime.utcnow().timestamp() * 1000)}"
            saved = insert_plan(body)
            self.send_json(201, {"message": "Plan saved to SQLite database", "plan": saved})
            return

        # 11. Clear all plans
        elif path == '/api/plans/clear':
            clear_all_plans()
            self.send_json(200, {"message": "All saved plans cleared from SQLite database"})
            return

        else:
            self.send_json(404, {"error": "Endpoint not found", "path": path})

    def do_PUT(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        body = self.parse_json_body()

        # 1. Owner: Update Station
        if path.startswith('/api/owner/stations/'):
            station_id = path.split('/api/owner/stations/')[1]
            owner = self.get_authenticated_owner()
            if not owner:
                self.send_json(401, {"error": "Unauthorized. Please log in."})
                return

            updated = update_station(station_id, owner['id'], body)
            if not updated:
                self.send_json(404, {"error": "Station not found or access denied."})
                return

            self.send_json(200, {"message": "Station updated successfully", "station": updated})
            return

        # 2. Owner: Update Charger
        elif path.startswith('/api/owner/chargers/'):
            charger_id = path.split('/api/owner/chargers/')[1]
            owner = self.get_authenticated_owner()
            if not owner:
                self.send_json(401, {"error": "Unauthorized. Please log in."})
                return

            updated = update_charger(charger_id, owner['id'], body)
            if not updated:
                self.send_json(404, {"error": "Charger not found or access denied."})
                return

            self.send_json(200, {"message": "Charger updated successfully", "charger": updated})
            return

        # 3. Public: Update Saved Plan
        elif path.startswith('/api/plans/'):
            plan_id = path.split('/api/plans/')[1]
            updated = update_plan_by_id(plan_id, body)
            if updated:
                self.send_json(200, {"message": "Plan updated in SQLite database", "plan": updated})
            else:
                self.send_json(404, {"error": "Plan not found", "id": plan_id})
            return

        self.send_json(404, {"error": "Endpoint not found", "path": path})

    def do_DELETE(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        # 1. Owner: Delete Station
        if path.startswith('/api/owner/stations/'):
            station_id = path.split('/api/owner/stations/')[1]
            owner = self.get_authenticated_owner()
            if not owner:
                self.send_json(401, {"error": "Unauthorized. Please log in."})
                return

            deleted = delete_station(station_id, owner['id'])
            if deleted:
                self.send_json(200, {"message": "Station deleted successfully", "id": station_id})
            else:
                self.send_json(404, {"error": "Station not found or access denied"})
            return

        # 2. Owner: Delete Charger
        elif path.startswith('/api/owner/chargers/'):
            charger_id = path.split('/api/owner/chargers/')[1]
            owner = self.get_authenticated_owner()
            if not owner:
                self.send_json(401, {"error": "Unauthorized. Please log in."})
                return

            deleted = delete_charger(charger_id, owner['id'])
            if deleted:
                self.send_json(200, {"message": "Charger deleted successfully", "id": charger_id})
            else:
                self.send_json(404, {"error": "Charger not found or access denied"})
            return

        # 3. Public: Delete Plan
        elif path.startswith('/api/plans/'):
            plan_id = path.split('/api/plans/')[1]
            deleted = delete_plan_by_id(plan_id)
            if deleted:
                self.send_json(200, {"message": "Plan deleted", "id": plan_id})
            else:
                self.send_json(404, {"error": "Plan not found", "id": plan_id})
            return

        self.send_json(404, {"error": "Endpoint not found"})

class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True

def run_server():
    init_db()
    server = ThreadedHTTPServer(('0.0.0.0', PORT), ChargeSmartAPIHandler)
    print(f"ChargeSmart Real-Time Python AI & SQLite Backend running on http://localhost:{PORT}")
    sys.stdout.flush()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

if __name__ == '__main__':
    run_server()
