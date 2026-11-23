import sys
import os
import json
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from database import (
    init_db,
    get_all_plans,
    insert_plan,
    update_plan_by_id,
    delete_plan_by_id,
    register_owner,
    authenticate_owner,
    get_owner_by_token,
    logout_owner_session,
    get_owner_stations,
    create_station,
    update_station,
    delete_station,
    create_charger,
    update_charger_status,
    delete_charger,
    get_all_public_stations_with_chargers,
    get_owner_analytics
)
from ml_models import ml_regressor, ml_battery, ai_copilot

def test_database():
    init_db()
    plans = get_all_plans()
    assert isinstance(plans, list), "get_all_plans should return a list"
    print(f"[OK] Database initialized, {len(plans)} plans retrieved.")

    # Test insert
    test_id = f"test-plan-{int(datetime.utcnow().timestamp())}"
    new_plan = {
        "id": test_id,
        "created_at": datetime.utcnow().isoformat(),
        "vehicle_name": "Test EV",
        "vehicle_type": "car",
        "start_time": "12:00",
        "end_time": "14:00",
        "energy_kwh": 25.0,
        "cost": 3.50,
        "currency": "$",
        "renewable_share": 85.0,
        "emissions_kg": 1.2,
        "priority": "lowest_cost",
        "location_name": "Home Test Bay",
        "status": "scheduled",
        "notes": "Testing DB persistence"
    }
    inserted = insert_plan(new_plan)
    assert inserted["id"] == test_id
    print(f"[OK] Plan {test_id} inserted.")

    # Test update
    updated = update_plan_by_id(test_id, {"notes": "Updated note", "status": "completed"})
    assert updated["status"] == "completed"
    print(f"[OK] Plan {test_id} updated.")

    # Test delete
    deleted = delete_plan_by_id(test_id)
    assert deleted is True
    print(f"[OK] Plan {test_id} deleted successfully.")

def test_station_owner_system():
    init_db()
    # 1. Test authenticating seeded demo owner
    demo_auth = authenticate_owner('owner@greencharge.com', 'Password123!')
    assert demo_auth is not None, "Demo owner login should succeed"
    token = demo_auth['token']
    owner_id = demo_auth['owner']['id']
    print(f"[OK] Demo owner authenticated. ID: {owner_id}, Token: {token[:10]}...")

    # Verify session token
    owner = get_owner_by_token(token)
    assert owner is not None
    assert owner['email'] == 'owner@greencharge.com'
    print(f"[OK] Session token verified for owner: {owner['full_name']}")

    # 2. Test registration of a new unique owner
    new_email = f"operator_{int(datetime.utcnow().timestamp())}@chargenet.com"
    new_owner = register_owner(
        full_name="Marcus Vance",
        email=new_email,
        phone="+1 555-0199",
        business_name="Vance Volt Solutions",
        password="SecurePass2026!",
        business_address="100 Battery St, San Francisco, CA"
    )
    assert new_owner['email'] == new_email
    print(f"[OK] New owner registered: {new_owner['business_name']}")

    # 3. Test wrong password
    bad_auth = authenticate_owner(new_email, 'WrongPassword!')
    assert bad_auth is None, "Bad password should return None"
    print("[OK] Invalid password correctly rejected.")

    # 4. Test station creation for new owner
    new_station = create_station(new_owner['id'], {
        "name": "Vance Volt Hub — Downtown SOMA",
        "description": "High-power 150kW DC chargers with dedicated solar canopy.",
        "address": "400 Howard Street",
        "city": "San Francisco",
        "state": "CA",
        "postal_code": "94105",
        "country": "United States",
        "latitude": 37.7892,
        "longitude": -122.3981,
        "operating_hours": "24/7 Access",
        "facilities": ["Restrooms", "Free WiFi", "Solar Canopy"],
        "contact_phone": "+1 555-0199",
        "contact_email": new_email,
        "network_operator": "Vance Volt",
        "is_public": True
    })
    assert new_station is not None
    station_id = new_station['id']
    print(f"[OK] Station created: '{new_station['name']}' with ID {station_id}")

    # 5. Test adding a charger to the station
    charger = create_charger(station_id, new_owner['id'], {
        "charger_identifier": "Bay A1 — 150kW CCS2",
        "connector_type": "CCS2",
        "charging_type": "DC Fast",
        "power_kw": 150.0,
        "total_connectors": 2,
        "price_per_kwh": 0.28,
        "currency": "USD",
        "availability_status": "Available",
        "operating_status": "Online"
    })
    assert charger is not None
    charger_id = charger['id']
    print(f"[OK] Charger added: '{charger['charger_identifier']}'")

    # 6. Test updating charger availability status (Available -> Occupied)
    updated_ch = update_charger_status(charger_id, new_owner['id'], "Occupied", "Driver started fast charge")
    assert updated_ch['availability_status'] == "Occupied"
    print(f"[OK] Charger status updated to Occupied with audit log entry.")

    # 7. Test Owner Analytics
    analytics = get_owner_analytics(new_owner['id'])
    assert analytics['totalStations'] >= 1
    assert analytics['totalChargers'] >= 1
    assert analytics['occupiedChargers'] >= 1
    assert len(analytics['recentActivity']) >= 1
    print(f"[OK] Owner analytics verified: {analytics['totalStations']} station(s), {analytics['totalChargers']} charger(s), utilization: {analytics['utilizationRatePercent']}%.")

    # 8. Test public station query integration
    public_stations = get_all_public_stations_with_chargers()
    found = any(s['id'] == station_id for s in public_stations)
    assert found is True, "New owner station should appear in public listings"
    print(f"[OK] Station '{new_station['name']}' verified in public station directory ({len(public_stations)} total public stations).")

    # 9. Clean up test charger and station
    delete_charger(charger_id, new_owner['id'])
    delete_station(station_id, new_owner['id'])
    print("[OK] Test station and charger cleaned up cleanly.")

def test_ml_models():
    # Test solar wind prediction
    res = ml_regressor.predict_combined(hour=12.5, cloud_cover_pct=20.0, temp_c=28.0, wind_speed_ms=8.0)
    assert res["solar"]["predicted_mw"] > 0, "Solar generation at noon should be > 0"
    assert res["wind"]["predicted_mw"] > 0, "Wind generation at 8 m/s should be > 0"
    assert 0 <= res["clean_share_pct"] <= 100
    print(f"[OK] Solar/Wind physics model verified. Noon solar: {res['solar']['predicted_mw']} MW, clean share: {res['clean_share_pct']}%.")

    # Test battery degradation
    battery_res = ml_battery.analyze_charging_session(
        battery_capacity_kwh=40.5,
        current_soc=20.0,
        desired_soc=80.0,
        charge_power_kw=50.0,
        ambient_temp_c=28.0
    )
    assert "c_rate" in battery_res
    assert len(battery_res["optimal_taper_curve"]) > 0
    print(f"[OK] Battery degradation physics model verified. C-rate: {battery_res['c_rate']}.")

    # Test copilot
    copilot_res = ai_copilot.answer_query("When is the best time to charge cheaply?", {})
    assert "answer" in copilot_res
    print(f"[OK] AI Copilot response verified: {copilot_res['headline']}.")

if __name__ == '__main__':
    test_database()
    test_station_owner_system()
    test_ml_models()
    print("\nALL BACKEND DATABASE, OWNER SYSTEM & PHYSICS TESTS PASSED PERFECTLY!")
