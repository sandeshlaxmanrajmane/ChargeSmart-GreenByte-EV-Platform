import sqlite3
import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'chargesmart.db')

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Table for saved charging plans
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS saved_plans (
            id TEXT PRIMARY KEY,
            created_at TEXT NOT NULL,
            vehicle_name TEXT NOT NULL,
            vehicle_type TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            energy_kwh REAL NOT NULL,
            cost REAL NOT NULL,
            currency TEXT NOT NULL,
            renewable_share REAL NOT NULL,
            emissions_kg REAL NOT NULL,
            priority TEXT NOT NULL,
            location_name TEXT NOT NULL,
            status TEXT NOT NULL,
            notes TEXT
        )
    ''')

    # Table for ML training & telemetry historical logs
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS telemetry_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            hour INTEGER NOT NULL,
            solar_generation_mw REAL NOT NULL,
            wind_generation_mw REAL NOT NULL,
            grid_demand_mw REAL NOT NULL,
            renewable_share_pct REAL NOT NULL,
            grid_tariff REAL NOT NULL,
            grid_carbon_intensity REAL NOT NULL,
            grid_frequency_hz REAL NOT NULL
        )
    ''')

    # Check if plans exist; if empty, seed demo data
    cursor.execute('SELECT COUNT(*) as count FROM saved_plans')
    if cursor.fetchone()['count'] == 0:
        demo_plans = [
            (
                'plan-demo-1',
                datetime.utcnow().isoformat(),
                'Tata Nexon EV Long Range',
                'car',
                'Today, 11:30 AM',
                'Today, 01:15 PM',
                24.3,
                2.67,
                '$',
                89.0,
                1.84,
                'max_renewable',
                'Home Rooftop Solar (Smart Inverter)',
                'scheduled',
                'Scheduled for maximum solar irradiance peak window.'
            ),
            (
                'plan-demo-2',
                datetime.utcnow().isoformat(),
                'Ather 450X Gen 3',
                'scooter',
                'Yesterday, 02:00 AM',
                'Yesterday, 03:10 AM',
                2.2,
                0.26,
                '$',
                78.0,
                0.21,
                'lowest_cost',
                'Home Off-Peak Tariff',
                'completed',
                'Off-peak overnight wind tariff savings realized.'
            ),
            (
                'plan-demo-3',
                datetime.utcnow().isoformat(),
                'Tesla Model 3 Standard',
                'car',
                'Oct 27, 01:00 PM',
                'Oct 27, 01:45 PM',
                36.0,
                4.86,
                '$',
                84.0,
                3.12,
                'balanced',
                'GreenByte EcoHub — DSU Innovation Park',
                'completed',
                'Fast charge utilizing onsite solar canopy.'
            )
        ]
        cursor.executemany('''
            INSERT INTO saved_plans (
                id, created_at, vehicle_name, vehicle_type, start_time, end_time,
                energy_kwh, cost, currency, renewable_share, emissions_kg,
                priority, location_name, status, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', demo_plans)

    conn.commit()
    conn.close()

def get_all_plans():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM saved_plans ORDER BY created_at DESC')
    rows = cursor.fetchall()
    plans = [dict(row) for row in rows]
    conn.close()
    return plans

def insert_plan(plan_dict):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO saved_plans (
            id, created_at, vehicle_name, vehicle_type, start_time, end_time,
            energy_kwh, cost, currency, renewable_share, emissions_kg,
            priority, location_name, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        plan_dict['id'],
        plan_dict.get('created_at', datetime.utcnow().isoformat()),
        plan_dict['vehicle_name'],
        plan_dict['vehicle_type'],
        plan_dict['start_time'],
        plan_dict['end_time'],
        plan_dict['energy_kwh'],
        plan_dict['cost'],
        plan_dict.get('currency', '$'),
        plan_dict['renewable_share'],
        plan_dict['emissions_kg'],
        plan_dict['priority'],
        plan_dict['location_name'],
        plan_dict.get('status', 'scheduled'),
        plan_dict.get('notes', '')
    ))
    conn.commit()
    conn.close()
    return plan_dict

def delete_plan_by_id(plan_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM saved_plans WHERE id = ?', (plan_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

if __name__ == '__main__':
    init_db()
    print('SQLite database initialized successfully at', DB_PATH)
