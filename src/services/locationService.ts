import { ChargingStation } from '../types';
import { DEMO_STATIONS } from '../data/mockData';
import { calculateDistanceKm } from '../utils/geoUtils';

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  addressLabel?: string;
  city?: string;
  country?: string;
  timestamp: number;
  source: 'gps' | 'manual';
}

export interface GeocodeResult {
  displayName: string;
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  type: string;
  source: string;
}

export type GeolocationStatus =
  | 'idle'
  | 'prompt'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'unavailable'
  | 'timeout';

class LocationService {
  private userLocation: UserLocation | null = null;
  private status: GeolocationStatus = 'idle';
  private listeners: ((loc: UserLocation | null, status: GeolocationStatus) => void)[] = [];

  constructor() {
    this.checkInitialPermission();
  }

  private async checkInitialPermission() {
    if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' as any });
        this.status = result.state as GeolocationStatus;
        result.onchange = () => {
          this.status = result.state as GeolocationStatus;
          this.notify();
        };
      } catch {
        // Permissions API fallback
      }
    }
  }

  subscribe(listener: (loc: UserLocation | null, status: GeolocationStatus) => void) {
    this.listeners.push(listener);
    listener(this.userLocation, this.status);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(this.userLocation, this.status));
  }

  getStatus(): GeolocationStatus {
    return this.status;
  }

  getUserLocation(): UserLocation | null {
    return this.userLocation;
  }

  /**
   * Request real user location permission from the browser.
   * Only called when user explicitly clicks "Use My Current Location".
   */
  async requestCurrentLocation(): Promise<UserLocation> {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.status = 'unavailable';
      this.notify();
      throw new Error('Geolocation is not supported by your current browser.');
    }

    this.status = 'requesting';
    this.notify();

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const accuracy = position.coords.accuracy;

          const location: UserLocation = {
            latitude: lat,
            longitude: lon,
            accuracyMeters: Math.round(accuracy),
            timestamp: position.timestamp,
            source: 'gps',
          };

          // Reverse geocode to get street / city name
          try {
            const address = await this.reverseGeocode(lat, lon);
            if (address) {
              location.addressLabel = address.label;
              location.city = address.city;
              location.country = address.country;
            }
          } catch (e) {
            console.warn('Reverse geocoding failed', e);
          }

          this.userLocation = location;
          this.status = 'granted';
          this.notify();
          resolve(location);
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            this.status = 'denied';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            this.status = 'unavailable';
          } else {
            this.status = 'timeout';
          }
          this.notify();
          reject(new Error(this.getErrorMessage(error)));
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 30000,
        }
      );
    });
  }

  /**
   * Set manually searched location
   */
  setManualLocation(lat: number, lon: number, label: string, city?: string, country?: string): UserLocation {
    const location: UserLocation = {
      latitude: lat,
      longitude: lon,
      addressLabel: label,
      city: city || label.split(',')[0],
      country: country,
      timestamp: Date.now(),
      source: 'manual',
    };
    this.userLocation = location;
    this.notify();
    return location;
  }

  /**
   * Search locations using geocoding API (OSM Nominatim)
   */
  async searchLocations(query: string): Promise<GeocodeResult[]> {
    if (!query || query.trim().length < 2) return [];

    // Try backend proxy first
    try {
      const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}`, {
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          return data.results;
        }
      }
    } catch {
      // Backend proxy fallback to direct Nominatim
    }

    try {
      const directUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1`;
      const res = await fetch(directUrl, {
        headers: { 'User-Agent': 'ChargeSmart-EV-Platform/2.5 (contact@greenbyte.energy)' },
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        return (data || []).map((item: any): GeocodeResult => {
          const addr = item.address || {};
          const city = addr.city || addr.town || addr.village || addr.county || addr.state || query;
          const country = addr.country || '';
          return {
            displayName: item.display_name || query,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            city,
            country,
            type: item.type || 'place',
            source: 'OpenStreetMap Nominatim',
          };
        });
      }
    } catch (e) {
      console.warn('Direct Nominatim geocoding failed', e);
    }

    return [];
  }

  /**
   * Reverse geocodes GPS coordinates using OpenStreetMap Nominatim
   */
  async reverseGeocode(lat: number, lon: number): Promise<{ label: string; city: string; country?: string } | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'ChargeSmart-EV-Platform/2.5 (contact@greenbyte.energy)' },
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const neighbourhood = addr.suburb || addr.neighbourhood || addr.road || '';
        const city = addr.city || addr.town || addr.county || addr.state || 'Local Metro';
        const country = addr.country || '';
        const label = neighbourhood ? `${neighbourhood}, ${city}` : city;
        return { label, city, country };
      }
    } catch {
      // Fallback
    }
    return null;
  }

  /**
   * Fetches real EV charging stations from backend proxy or direct Overpass API
   */
  async fetchRealNearbyStations(
    lat: number,
    lon: number,
    radiusMeters: number = 25000
  ): Promise<ChargingStation[]> {
    // 1. Try backend proxy first (has caching and connection pooling)
    try {
      const res = await fetch(`/api/stations/nearby?lat=${lat}&lon=${lon}&radius=${radiusMeters}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.stations && Array.isArray(data.stations) && data.stations.length > 0) {
          return data.stations;
        }
      }
    } catch {
      // Backend proxy fallback
    }

    // 2. Direct client query to OpenStreetMap Overpass API
    try {
      const overpassQuery = `
        [out:json][timeout:10];
        (
          node["amenity"="charging_station"](around:${radiusMeters}, ${lat}, ${lon});
          way["amenity"="charging_station"](around:${radiusMeters}, ${lat}, ${lon});
        );
        out center 35;
      `;

      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(overpassQuery),
        signal: AbortSignal.timeout(9000),
      });

      if (res.ok) {
        const data = await res.json();
        const elements = data.elements || [];

        if (elements.length > 0) {
          return elements.map((elem: any, idx: number): ChargingStation => {
            const tags = elem.tags || {};
            const stLat = elem.lat || (elem.center && elem.center.lat) || lat;
            const stLon = elem.lon || (elem.center && elem.center.lon) || lon;
            const dist = calculateDistanceKm(lat, lon, stLat, stLon);

            // Connectors
            const connectors: ChargingStation['connectors'] = [];
            let maxPowerKw = 22;

            if (tags['socket:type2_combo'] || tags['socket:type2_combo:output']) {
              const kw = parseFloat(tags['socket:type2_combo:output']) || 60;
              maxPowerKw = Math.max(maxPowerKw, kw);
              connectors.push({ type: 'CCS2', powerKw: kw, available: 2, total: 3 });
            }
            if (tags['socket:type2'] || tags['socket:type2:output'] || connectors.length === 0) {
              const kw = parseFloat(tags['socket:type2:output']) || 22;
              connectors.push({ type: 'Type 2', powerKw: kw, available: 1, total: 2 });
            }
            if (tags['socket:chademo']) {
              connectors.push({ type: 'CHAdeMO', powerKw: 50, available: 1, total: 1 });
            }
            if (tags['socket:schuko']) {
              connectors.push({ type: 'Bharat AC001', powerKw: 3.3, available: 1, total: 2 });
            }

            const name =
              tags.name ||
              tags.brand ||
              tags.operator ||
              `EV Charging Station #${idx + 1}`;

            const operator = tags.operator || tags.brand || 'Public EV Network';
            const street = tags['addr:street'] ? `${tags['addr:street']}, ` : '';
            const city = tags['addr:city'] || tags['addr:district'] || tags['addr:suburb'] || 'Local Area';
            const address = `${street}${city}`;

            const feeTag = tags.fee || tags['charge:fee'] || '';
            const isFree = feeTag.toLowerCase().includes('no');
            const hasSolar = tags.solar_power === 'yes' || tags['generator:source'] === 'solar';

            return {
              id: `osm-${elem.id || idx}`,
              name,
              operator,
              address: address || 'Mapped on OpenStreetMap',
              city,
              latitude: stLat,
              longitude: stLon,
              distanceKm: dist,
              totalPlugs: connectors.reduce((acc, c) => acc + c.total, 0) || 4,
              availablePlugs: connectors.reduce((acc, c) => acc + c.available, 0) || 2,
              connectors,
              maxPowerKw,
              pricePerKwh: isFree ? 0.0 : 0.18,
              isVerifiedPrice: isFree,
              tariffDetails: isFree ? 'Free Charging' : 'Tariff not published / Check on-site or operator app',
              currency: 'USD',
              renewableInfo: {
                source: hasSolar ? 'Rooftop Solar Canopy' : 'Regional Grid Mix',
                verified: hasSolar,
                greenSharePercent: hasSolar ? 85 : 45,
                lifecycleRating: hasSolar ? 'A+' : 'B',
              },
              amenities: ['Public Access', 'OSM Geocoded Station'],
              status: 'unknown',
              liveStatus: 'unknown',
              isLiveStatusAvailable: false,
              dataProvider: 'OpenStreetMap Overpass API',
              lastUpdated: new Date().toISOString(),
              isVerified: true,
              openingHours: tags.opening_hours || '24/7 Access',
            };
          });
        }
      }
    } catch (e) {
      console.warn('Overpass API real station fetch failed or timed out', e);
    }

    return [];
  }

  /**
   * Recalculates distances of stations relative to the user's location
   */
  recalculateDistances(
    stations: ChargingStation[],
    userLoc: UserLocation
  ): ChargingStation[] {
    return stations
      .map((st) => {
        const dist = calculateDistanceKm(userLoc.latitude, userLoc.longitude, st.latitude, st.longitude);
        return {
          ...st,
          distanceKm: dist,
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  private getErrorMessage(error: GeolocationPositionError): string {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Location permission was denied. You can manually enter your city, address, or landmark below to search for stations.';
      case error.POSITION_UNAVAILABLE:
        return 'GPS position information is currently unavailable from your device.';
      case error.TIMEOUT:
        return 'Location request timed out. Please check your connection or search manually.';
      default:
        return 'An error occurred while acquiring your location.';
    }
  }
}

export const locationService = new LocationService();
