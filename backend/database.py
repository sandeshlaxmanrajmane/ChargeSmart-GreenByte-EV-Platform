import sqlite3
import json
import os
import secrets
import hashlib
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), 'chargesmart.db')

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password: str, salt: str = None) -> tuple[str, str]:
    if not salt:
        salt = secrets.token_hex(16)
    pw_hash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    ).hex()
    return pw_hash, salt

def verify_password(password: str, salt: str, expected_hash: str) -> bool:
    calculated_hash, _ = hash_password(password, salt)
    return secrets.compare_digest(calculated_hash, expected_hash)

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Saved charging plans
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

    # 2. Telemetry logs
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

    # 3. Station Owners table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS station_owners (
            id TEXT PRIMARY KEY,
            full_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            business_name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            password_salt TEXT NOT NULL,
            business_address TEXT,
            created_at TEXT NOT NULL
        )
    ''')

    # 4. Owner Sessions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS owner_sessions (
            token TEXT PRIMARY KEY,
            owner_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            FOREIGN KEY (owner_id) REFERENCES station_owners(id) ON DELETE CASCADE
        )
    ''')

    # 5. Charging Stations table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS stations (
            id TEXT PRIMARY KEY,
            owner_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            address TEXT NOT NULL,
            city TEXT NOT NULL,
            state TEXT,
            postal_code TEXT,
            country TEXT,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            operating_hours TEXT DEFAULT '24/7 Access',
            facilities TEXT,
            contact_phone TEXT,
            contact_email TEXT,
            network_operator TEXT DEFAULT 'ChargeSmart Network',
            is_public INTEGER DEFAULT 1,
            photo_url TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (owner_id) REFERENCES station_owners(id) ON DELETE CASCADE
        )
    ''')

    # 6. Chargers table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chargers (
            id TEXT PRIMARY KEY,
            station_id TEXT NOT NULL,
            charger_identifier TEXT NOT NULL,
            connector_type TEXT NOT NULL,
            charging_type TEXT NOT NULL,
            power_kw REAL NOT NULL,
            total_connectors INTEGER DEFAULT 1,
            price_per_kwh REAL NOT NULL,
            currency TEXT DEFAULT 'USD',
            additional_fees REAL DEFAULT 0.0,
            availability_status TEXT DEFAULT 'Available',
            operating_status TEXT DEFAULT 'Online',
            last_status_updated TEXT NOT NULL,
            FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE
        )
    ''')

    # 7. Availability Audit Logs
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS availability_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            charger_id TEXT NOT NULL,
            station_id TEXT NOT NULL,
            old_status TEXT,
            new_status TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            notes TEXT
        )
    ''')

    # Seed demo saved plans if empty
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

    # Seed default verified owner and stations if empty
    cursor.execute('SELECT COUNT(*) as count FROM station_owners')
    if cursor.fetchone()['count'] == 0:
        demo_owner_id = 'owner-greencharge-01'
        pw_hash, pw_salt = hash_password('Password123!')
        now_iso = datetime.utcnow().isoformat()

        cursor.execute('''
            INSERT INTO station_owners (
                id, full_name, email, phone, business_name, password_hash, password_salt, business_address, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            demo_owner_id,
            'Elena Vance',
            'owner@greencharge.com',
            '+91 98765 43210',
            'GreenCharge Networks Pvt Ltd',
            pw_hash,
            pw_salt,
            '450 Innovation Parkway, Suite 100, Electronic City, Bengaluru',
            now_iso
        ))

        # Station 1: Bengaluru EcoHub
        st1_id = 'station-gc-blr-01'
        st1_facilities = json.dumps([
            "Restrooms", "Free High-Speed WiFi", "Solar Canopy", "EV Lounge", "Cafe & Snacks", "24/7 Security"
        ])
        cursor.execute('''
            INSERT INTO stations (
                id, owner_id, name, description, address, city, state, postal_code, country,
                latitude, longitude, operating_hours, facilities, contact_phone, contact_email,
                network_operator, is_public, photo_url, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            st1_id,
            demo_owner_id,
            'GreenCharge EcoHub — Silicon Central',
            'Flagship ultra-fast 150kW CCS2 & Type 2 solar-backed charging plaza with EV driver lounge and cafe.',
            '450 Innovation Parkway, Electronic City Phase 1',
            'Bengaluru',
            'Karnataka',
            '560100',
            'India',
            12.8452,
            77.6602,
            '24/7 Access',
            st1_facilities,
            '+91 98765 43210',
            'support@greencharge.com',
            'GreenCharge Network',
            1,
            'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=800&q=80',
            now_iso,
            now_iso
        ))

        # Chargers for Station 1
        chargers_st1 = [
            ('ch-gc-01', st1_id, 'Bay A1 — 150kW Ultra-Fast CCS2', 'CCS2', 'DC Fast', 150.0, 2, 0.22, 'USD', 0.0, 'Available', 'Online', now_iso),
            ('ch-gc-02', st1_id, 'Bay A2 — 60kW Rapid CCS2', 'CCS2', 'DC Fast', 60.0, 1, 0.19, 'USD', 0.0, 'Occupied', 'Online', now_iso),
            ('ch-gc-03', st1_id, 'Bay B1 — 22kW Dual AC Type 2', 'Type 2', 'AC Level 2', 22.0, 2, 0.14, 'USD', 0.0, 'Available', 'Online', now_iso),
            ('ch-gc-04', st1_id, 'Bay B2 — 50kW CHAdeMO Fast Bay', 'CHAdeMO', 'DC Fast', 50.0, 1, 0.18, 'USD', 0.0, 'Maintenance', 'Online', now_iso)
        ]
        cursor.executemany('''
            INSERT INTO chargers (
                id, station_id, charger_identifier, connector_type, charging_type, power_kw,
                total_connectors, price_per_kwh, currency, additional_fees, availability_status,
                operating_status, last_status_updated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', chargers_st1)

        # Station 2: Bengaluru Metro Supercharger Plaza
        st2_id = 'station-gc-blr-02'
        st2_facilities = json.dumps(["Restrooms", "Convenience Store", "Solar Canopy", "Wheelchair Accessible"])
        cursor.execute('''
            INSERT INTO stations (
                id, owner_id, name, description, address, city, state, postal_code, country,
                latitude, longitude, operating_hours, facilities, contact_phone, contact_email,
                network_operator, is_public, photo_url, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            st2_id,
            demo_owner_id,
            'GreenCharge Metro Supercharger Plaza',
            'High-throughput downtown EV charging station equipped with DC fast chargers and solar canopy.',
            '88 MG Road, Central Business District',
            'Bengaluru',
            'Karnataka',
            '560001',
            'India',
            12.9752,
            77.6085,
            '24/7 Access',
            st2_facilities,
            '+91 98765 43211',
            'mgroad@greencharge.com',
            'GreenCharge Network',
            1,
            'https://images.unsplash.com/photo-1558441719-8b489c63f7d1?auto=format&fit=crop&w=800&q=80',
            now_iso,
            now_iso
        ))

        chargers_st2 = [
            ('ch-gc-05', st2_id, 'Bay 1 — 120kW Supercharger CCS2', 'CCS2', 'DC Fast', 120.0, 2, 0.21, 'USD', 0.0, 'Available', 'Online', now_iso),
            ('ch-gc-06', st2_id, 'Bay 2 — 60kW Dual CCS2', 'CCS2', 'DC Fast', 60.0, 2, 0.19, 'USD', 0.0, 'Available', 'Online', now_iso),
            ('ch-gc-07', st2_id, 'Bay 3 — 22kW Type 2 Destination', 'Type 2', 'AC Level 2', 22.0, 2, 0.13, 'USD', 0.0, 'Occupied', 'Online', now_iso)
        ]
        cursor.executemany('''
            INSERT INTO chargers (
                id, station_id, charger_identifier, connector_type, charging_type, power_kw,
                total_connectors, price_per_kwh, currency, additional_fees, availability_status,
                operating_status, last_status_updated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', chargers_st2)

        # Station 3: San Francisco Clean Energy Hub (for US coordinates)
        st3_id = 'station-gc-sf-01'
        st3_facilities = json.dumps(["Restrooms", "Coffee Bar", "Rooftop Solar", "EV Drivers Lounge", "Free WiFi"])
        cursor.execute('''
            INSERT INTO stations (
                id, owner_id, name, description, address, city, state, postal_code, country,
                latitude, longitude, operating_hours, facilities, contact_phone, contact_email,
                network_operator, is_public, photo_url, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            st3_id,
            demo_owner_id,
            'GreenCharge Bay Area Solar Hub',
            '100% solar and wind powered ultra-fast corridor charging hub with 350kW CCS chargers.',
            '750 Market Street, Financial District',
            'San Francisco',
            'California',
            '94102',
            'United States',
            37.7879,
            -122.4075,
            '24/7 Access',
            st3_facilities,
            '+1 (415) 555-0199',
            'sf@greencharge.com',
            'GreenCharge Network',
            1,
            'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=800&q=80',
            now_iso,
            now_iso
        ))

        chargers_st3 = [
            ('ch-gc-08', st3_id, 'Bay 1 — 350kW Hyper-Charger CCS2', 'CCS2', 'DC Fast', 350.0, 2, 0.35, 'USD', 0.0, 'Available', 'Online', now_iso),
            ('ch-gc-09', st3_id, 'Bay 2 — 150kW Ultra-Fast CCS2', 'CCS2', 'DC Fast', 150.0, 2, 0.28, 'USD', 0.0, 'Occupied', 'Online', now_iso),
            ('ch-gc-10', st3_id, 'Bay 3 — 50kW Level 2 Type 2', 'Type 2', 'AC Level 2', 22.0, 2, 0.18, 'USD', 0.0, 'Available', 'Online', now_iso)
        ]
        cursor.executemany('''
            INSERT INTO chargers (
                id, station_id, charger_identifier, connector_type, charging_type, power_kw,
                total_connectors, price_per_kwh, currency, additional_fees, availability_status,
                operating_status, last_status_updated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', chargers_st3)

        # Seed initial availability logs
        init_logs = [
            ('ch-gc-02', st1_id, 'Available', 'Occupied', now_iso, 'Vehicle connected to Bay A2'),
            ('ch-gc-04', st1_id, 'Available', 'Maintenance', now_iso, 'Routine cable connector inspection'),
            ('ch-gc-07', st2_id, 'Available', 'Occupied', now_iso, 'Vehicle session in progress')
        ]
        cursor.executemany('''
            INSERT INTO availability_logs (charger_id, station_id, old_status, new_status, updated_at, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', init_logs)

    conn.commit()
    conn.close()

# --- OWNER AUTH & SESSION MANAGEMENT ---

def register_owner(full_name, email, phone, business_name, password, business_address=''):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT id FROM station_owners WHERE email = ?', (email.strip().lower(),))
    if cursor.fetchone():
        conn.close()
        raise ValueError(f"An account with email '{email}' already exists.")

    owner_id = f"owner-{secrets.token_hex(8)}"
    pw_hash, pw_salt = hash_password(password)
    created_at = datetime.utcnow().isoformat()

    cursor.execute('''
        INSERT INTO station_owners (
            id, full_name, email, phone, business_name, password_hash, password_salt, business_address, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        owner_id,
        full_name.strip(),
        email.strip().lower(),
        phone.strip() if phone else '',
        business_name.strip(),
        pw_hash,
        pw_salt,
        business_address.strip() if business_address else '',
        created_at
    ))

    conn.commit()
    conn.close()
    return get_owner_by_id(owner_id)

def authenticate_owner(email, password):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM station_owners WHERE email = ?', (email.strip().lower(),))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None

    owner = dict(row)
    if not verify_password(password, owner['password_salt'], owner['password_hash']):
        conn.close()
        return None

    # Create session token
    token = secrets.token_hex(32)
    created_at = datetime.utcnow().isoformat()
    expires_at = (datetime.utcnow() + timedelta(days=30)).isoformat()

    cursor.execute('''
        INSERT INTO owner_sessions (token, owner_id, created_at, expires_at)
        VALUES (?, ?, ?, ?)
    ''', (token, owner['id'], created_at, expires_at))

    conn.commit()
    conn.close()

    del owner['password_hash']
    del owner['password_salt']
    return {"token": token, "owner": owner}

def get_owner_by_token(token):
    if not token:
        return None
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT s.expires_at, o.*
        FROM owner_sessions s
        JOIN station_owners o ON s.owner_id = o.id
        WHERE s.token = ?
    ''', (token,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    row_dict = dict(row)
    # Check expiry
    try:
        expires = datetime.fromisoformat(row_dict['expires_at'])
        if datetime.utcnow() > expires:
            return None
    except Exception:
        pass

    del row_dict['password_hash']
    del row_dict['password_salt']
    del row_dict['expires_at']
    return row_dict

def get_owner_by_id(owner_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM station_owners WHERE id = ?', (owner_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    owner = dict(row)
    del owner['password_hash']
    del owner['password_salt']
    return owner

def logout_owner_session(token):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM owner_sessions WHERE token = ?', (token,))
    conn.commit()
    conn.close()
    return True

# --- OWNER STATIONS & CHARGERS CRUD ---

def get_owner_stations(owner_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT * FROM stations WHERE owner_id = ? ORDER BY created_at DESC
    ''', (owner_id,))
    stations = [dict(r) for r in cursor.fetchall()]

    for st in stations:
        try:
            st['facilities'] = json.loads(st['facilities']) if st['facilities'] else []
        except Exception:
            st['facilities'] = []

        cursor.execute('''
            SELECT * FROM chargers WHERE station_id = ? ORDER BY charger_identifier ASC
        ''', (st['id'],))
        st['chargers'] = [dict(c) for c in cursor.fetchall()]

    conn.close()
    return stations

def create_station(owner_id, st_dict):
    conn = get_connection()
    cursor = conn.cursor()

    station_id = st_dict.get('id') or f"station-{secrets.token_hex(6)}"
    now_iso = datetime.utcnow().isoformat()
    facilities_json = json.dumps(st_dict.get('facilities', []))

    cursor.execute('''
        INSERT INTO stations (
            id, owner_id, name, description, address, city, state, postal_code, country,
            latitude, longitude, operating_hours, facilities, contact_phone, contact_email,
            network_operator, is_public, photo_url, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        station_id,
        owner_id,
        st_dict['name'],
        st_dict.get('description', ''),
        st_dict['address'],
        st_dict['city'],
        st_dict.get('state', ''),
        st_dict.get('postal_code', ''),
        st_dict.get('country', ''),
        float(st_dict['latitude']),
        float(st_dict['longitude']),
        st_dict.get('operating_hours', '24/7 Access'),
        facilities_json,
        st_dict.get('contact_phone', ''),
        st_dict.get('contact_email', ''),
        st_dict.get('network_operator', 'ChargeSmart Verified Network'),
        1 if st_dict.get('is_public', True) else 0,
        st_dict.get('photo_url', ''),
        now_iso,
        now_iso
    ))

    # If chargers provided in creation payload
    initial_chargers = st_dict.get('chargers', [])
    for ch in initial_chargers:
        ch_id = ch.get('id') or f"ch-{secrets.token_hex(6)}"
        cursor.execute('''
            INSERT INTO chargers (
                id, station_id, charger_identifier, connector_type, charging_type, power_kw,
                total_connectors, price_per_kwh, currency, additional_fees, availability_status,
                operating_status, last_status_updated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            ch_id,
            station_id,
            ch['charger_identifier'],
            ch.get('connector_type', 'CCS2'),
            ch.get('charging_type', 'DC Fast'),
            float(ch.get('power_kw', 50.0)),
            int(ch.get('total_connectors', 1)),
            float(ch.get('price_per_kwh', 0.20)),
            ch.get('currency', 'USD'),
            float(ch.get('additional_fees', 0.0)),
            ch.get('availability_status', 'Available'),
            ch.get('operating_status', 'Online'),
            now_iso
        ))

    conn.commit()
    conn.close()
    return get_station_details(station_id)

def update_station(station_id, owner_id, st_dict):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT id FROM stations WHERE id = ? AND owner_id = ?', (station_id, owner_id))
    if not cursor.fetchone():
        conn.close()
        return None

    now_iso = datetime.utcnow().isoformat()
    facilities_json = json.dumps(st_dict.get('facilities', []))

    cursor.execute('''
        UPDATE stations SET
            name = ?,
            description = ?,
            address = ?,
            city = ?,
            state = ?,
            postal_code = ?,
            country = ?,
            latitude = ?,
            longitude = ?,
            operating_hours = ?,
            facilities = ?,
            contact_phone = ?,
            contact_email = ?,
            network_operator = ?,
            is_public = ?,
            photo_url = ?,
            updated_at = ?
        WHERE id = ? AND owner_id = ?
    ''', (
        st_dict['name'],
        st_dict.get('description', ''),
        st_dict['address'],
        st_dict['city'],
        st_dict.get('state', ''),
        st_dict.get('postal_code', ''),
        st_dict.get('country', ''),
        float(st_dict['latitude']),
        float(st_dict['longitude']),
        st_dict.get('operating_hours', '24/7 Access'),
        facilities_json,
        st_dict.get('contact_phone', ''),
        st_dict.get('contact_email', ''),
        st_dict.get('network_operator', 'ChargeSmart Verified Network'),
        1 if st_dict.get('is_public', True) else 0,
        st_dict.get('photo_url', ''),
        now_iso,
        station_id,
        owner_id
    ))

    conn.commit()
    conn.close()
    return get_station_details(station_id)

def delete_station(station_id, owner_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT id FROM stations WHERE id = ? AND owner_id = ?', (station_id, owner_id))
    if not cursor.fetchone():
        conn.close()
        return False

    cursor.execute('DELETE FROM chargers WHERE station_id = ?', (station_id,))
    cursor.execute('DELETE FROM availability_logs WHERE station_id = ?', (station_id,))
    cursor.execute('DELETE FROM stations WHERE id = ?', (station_id,))
    conn.commit()
    conn.close()
    return True

def get_station_details(station_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM stations WHERE id = ?', (station_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None

    station = dict(row)
    try:
        station['facilities'] = json.loads(station['facilities']) if station['facilities'] else []
    except Exception:
        station['facilities'] = []

    cursor.execute('SELECT * FROM chargers WHERE station_id = ? ORDER BY charger_identifier ASC', (station_id,))
    station['chargers'] = [dict(c) for c in cursor.fetchall()]
    conn.close()
    return station

def create_charger(station_id, owner_id, ch_dict):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT id FROM stations WHERE id = ? AND owner_id = ?', (station_id, owner_id))
    if not cursor.fetchone():
        conn.close()
        return None

    ch_id = ch_dict.get('id') or f"ch-{secrets.token_hex(6)}"
    now_iso = datetime.utcnow().isoformat()

    cursor.execute('''
        INSERT INTO chargers (
            id, station_id, charger_identifier, connector_type, charging_type, power_kw,
            total_connectors, price_per_kwh, currency, additional_fees, availability_status,
            operating_status, last_status_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        ch_id,
        station_id,
        ch_dict['charger_identifier'],
        ch_dict.get('connector_type', 'CCS2'),
        ch_dict.get('charging_type', 'DC Fast'),
        float(ch_dict.get('power_kw', 50.0)),
        int(ch_dict.get('total_connectors', 1)),
        float(ch_dict.get('price_per_kwh', 0.20)),
        ch_dict.get('currency', 'USD'),
        float(ch_dict.get('additional_fees', 0.0)),
        ch_dict.get('availability_status', 'Available'),
        ch_dict.get('operating_status', 'Online'),
        now_iso
    ))

    cursor.execute('''
        INSERT INTO availability_logs (charger_id, station_id, old_status, new_status, updated_at, notes)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (ch_id, station_id, 'None', ch_dict.get('availability_status', 'Available'), now_iso, 'Charger created'))

    conn.commit()
    conn.close()

    return get_charger_by_id(ch_id)

def get_charger_by_id(charger_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM chargers WHERE id = ?', (charger_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_charger(charger_id, owner_id, ch_dict):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT c.*, s.owner_id
        FROM chargers c
        JOIN stations s ON c.station_id = s.id
        WHERE c.id = ? AND s.owner_id = ?
    ''', (charger_id, owner_id))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        return None

    existing_dict = dict(existing)
    now_iso = datetime.utcnow().isoformat()
    new_status = ch_dict.get('availability_status', existing_dict['availability_status'])

    cursor.execute('''
        UPDATE chargers SET
            charger_identifier = ?,
            connector_type = ?,
            charging_type = ?,
            power_kw = ?,
            total_connectors = ?,
            price_per_kwh = ?,
            currency = ?,
            additional_fees = ?,
            availability_status = ?,
            operating_status = ?,
            last_status_updated = ?
        WHERE id = ?
    ''', (
        ch_dict.get('charger_identifier', existing_dict['charger_identifier']),
        ch_dict.get('connector_type', existing_dict['connector_type']),
        ch_dict.get('charging_type', existing_dict['charging_type']),
        float(ch_dict.get('power_kw', existing_dict['power_kw'])),
        int(ch_dict.get('total_connectors', existing_dict['total_connectors'])),
        float(ch_dict.get('price_per_kwh', existing_dict['price_per_kwh'])),
        ch_dict.get('currency', existing_dict['currency']),
        float(ch_dict.get('additional_fees', existing_dict['additional_fees'])),
        new_status,
        ch_dict.get('operating_status', existing_dict['operating_status']),
        now_iso,
        charger_id
    ))

    # Log status change if status changed
    if new_status != existing_dict['availability_status']:
        cursor.execute('''
            INSERT INTO availability_logs (charger_id, station_id, old_status, new_status, updated_at, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (charger_id, existing_dict['station_id'], existing_dict['availability_status'], new_status, now_iso, ch_dict.get('notes', 'Owner update')))

    conn.commit()
    conn.close()
    return get_charger_by_id(charger_id)

def update_charger_status(charger_id, owner_id, new_status, notes=''):
    return update_charger(charger_id, owner_id, {'availability_status': new_status, 'notes': notes})

def delete_charger(charger_id, owner_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT c.id
        FROM chargers c
        JOIN stations s ON c.station_id = s.id
        WHERE c.id = ? AND s.owner_id = ?
    ''', (charger_id, owner_id))
    if not cursor.fetchone():
        conn.close()
        return False

    cursor.execute('DELETE FROM availability_logs WHERE charger_id = ?', (charger_id,))
    cursor.execute('DELETE FROM chargers WHERE id = ?', (charger_id,))
    conn.commit()
    conn.close()
    return True

def get_all_public_stations_with_chargers():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT s.*, o.business_name, o.full_name as owner_name
        FROM stations s
        JOIN station_owners o ON s.owner_id = o.id
        WHERE s.is_public = 1
        ORDER BY s.updated_at DESC
    ''')
    stations = [dict(r) for r in cursor.fetchall()]

    for st in stations:
        try:
            st['facilities'] = json.loads(st['facilities']) if st['facilities'] else []
        except Exception:
            st['facilities'] = []

        cursor.execute('''
            SELECT * FROM chargers WHERE station_id = ? ORDER BY charger_identifier ASC
        ''', (st['id'],))
        st['chargers'] = [dict(c) for c in cursor.fetchall()]

    conn.close()
    return stations

def get_owner_analytics(owner_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT COUNT(*) as count FROM stations WHERE owner_id = ?', (owner_id,))
    total_stations = cursor.fetchone()['count']

    cursor.execute('''
        SELECT c.*
        FROM chargers c
        JOIN stations s ON c.station_id = s.id
        WHERE s.owner_id = ?
    ''', (owner_id,))
    chargers = [dict(c) for c in cursor.fetchall()]

    total_chargers = len(chargers)
    available_chargers = sum(1 for c in chargers if c['availability_status'] == 'Available')
    occupied_chargers = sum(1 for c in chargers if c['availability_status'] == 'Occupied')
    offline_chargers = sum(1 for c in chargers if c['availability_status'] in ('Maintenance', 'Out of Service', 'Offline'))

    utilization_rate = round((occupied_chargers / total_chargers * 100), 1) if total_chargers > 0 else 0.0

    # Recent activity logs
    cursor.execute('''
        SELECT l.*, c.charger_identifier, s.name as station_name
        FROM availability_logs l
        JOIN chargers c ON l.charger_id = c.id
        JOIN stations s ON l.station_id = s.id
        WHERE s.owner_id = ?
        ORDER BY l.updated_at DESC
        LIMIT 20
    ''', (owner_id,))
    activity_logs = [dict(r) for r in cursor.fetchall()]

    conn.close()

    return {
        "totalStations": total_stations,
        "totalChargers": total_chargers,
        "availableChargers": available_chargers,
        "occupiedChargers": occupied_chargers,
        "offlineChargers": offline_chargers,
        "utilizationRatePercent": utilization_rate,
        "recentActivity": activity_logs
    }

# --- SAVED PLANS ---

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

def update_plan_by_id(plan_id, updates):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM saved_plans WHERE id = ?', (plan_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        return None

    status = updates.get('status', existing['status'])
    notes = updates.get('notes', existing['notes'])

    cursor.execute('''
        UPDATE saved_plans
        SET status = ?, notes = ?
        WHERE id = ?
    ''', (status, notes, plan_id))
    conn.commit()

    cursor.execute('SELECT * FROM saved_plans WHERE id = ?', (plan_id,))
    updated_plan = dict(cursor.fetchone())
    conn.close()
    return updated_plan

def delete_plan_by_id(plan_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM saved_plans WHERE id = ?', (plan_id,))
    rows_affected = cursor.rowcount
    conn.commit()
    conn.close()
    return rows_affected > 0

def clear_all_plans():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM saved_plans')
    conn.commit()
    conn.close()
    return True
