import http.server
import socketserver
import json
import urllib.parse
import os
import sys
import math
import random
from datetime import datetime, timedelta

# Ensure backend directory is in python module path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import init_db, get_all_plans, insert_plan, delete_plan_by_id
from ml_models import ml_regressor, ml_battery, ai_copilot

PORT = 8000

class ChargeSmartAPIHandler(http.server.BaseHTTPRequestHandler):
    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
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
                "server_time": datetime.utcnow().isoformat()
            })
            return

        # 2. Live Grid Telemetry
        elif path == '/api/grid/live':
            now = datetime.now()
            current_hour = now.hour + now.minute / 60.0

            # Realistic micro-fluctuations (sub-second telemetry jitter)
            jitter = (random.random() - 0.5) * 3.0
            freq_jitter = round(50.0 + (random.random() - 0.5) * 0.04, 3)

            forecast = ml_regressor.predict_combined(
                hour=current_hour,
                cloud_cover_pct=22.0 + (random.random() - 0.5) * 5.0,
                temp_c=29.0 + (random.random() - 0.5) * 1.5,
                wind_speed_ms=7.5 + (random.random() - 0.5) * 1.0
            )

            self.send_json(200, {
                "timestamp": now.isoformat(),
                "hour": round(current_hour, 2),
                "solar_generation_mw": max(0.0, round(forecast["solar"]["predicted_mw"] + jitter, 1)),
                "wind_generation_mw": max(0.0, round(forecast["wind"]["predicted_mw"] + jitter * 0.5, 1)),
                "total_renewable_mw": forecast["total_renewable_mw"],
                "grid_demand_mw": forecast["grid_demand_mw"],
                "clean_share_pct": forecast["clean_share_pct"],
                "spot_tariff_usd": forecast["spot_tariff_usd"],
                "carbon_intensity_kg_kwh": forecast["carbon_intensity_kg_kwh"],
                "grid_frequency_hz": freq_jitter,
                "grid_status": "STABLE_DISPATCH" if freq_jitter >= 49.98 else "PEAK_STRAIN"
            })
            return

        # 3. 48-Hour Grid Forecast
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

        # 4. Saved Plans (SQLite)
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

        # 1. AI Energy Copilot Query
        if path == '/api/ai/copilot':
            query = body.get('message', '')
            context = body.get('context', {})
            response = ai_copilot.answer_query(query, context)
            self.send_json(200, response)
            return

        # 2. Interactive ML Solar & Wind Prediction
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

        # 3. ML Battery Health & Degradation Analysis
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

        # 4. Save Plan (SQLite)
        elif path == '/api/plans':
            if not body.get('id'):
                body['id'] = f"plan-{int(datetime.utcnow().timestamp() * 1000)}"
            saved = insert_plan(body)
            self.send_json(201, {"message": "Plan saved to SQLite database", "plan": saved})
            return

        else:
            self.send_json(404, {"error": "Endpoint not found", "path": path})

    def do_DELETE(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        if path.startswith('/api/plans/'):
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
