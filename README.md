# ChargeSmart — Smart EV Charging & Renewable Energy Optimization

> **"Smarter Charging. A Cleaner Tomorrow."**  
> Complete full-stack web application for EV drivers and charging station operators.

---

## 1. Project Vision & Executive Summary

Electric vehicles (EVs) are only as clean as the electricity used to charge them. When EV drivers plug in unmanaged during evening peak hours (6:00 PM – 9:30 PM), electrical grids fire up carbon-intensive coal and natural gas peaker plants. This drives electricity costs up by 3.2× and elevates carbon intensity to over 0.78 kg CO₂e per kWh.

**ChargeSmart** is a production-grade, real-time, renewable-energy-aware EV charging web application featuring two unified experiences:

1. **Public EV User Platform (100% Zero Login Required)**:
   - Real-time GPS location discovery & OpenStreetMap Nominatim search.
   - Interactive Leaflet map with real EV stations, verified connector types, and driving directions.
   - Transparent charging availability status: distinguishing verified live operator feeds, operator-reported status, and unprovided feeds.
   - Smart charging scheduler with multi-objective Pareto optimization (cost, green energy, battery longevity, departure deadline).
   - Multi-stop highway journey corridor planner with road-network routing (OSRM).
   - ISO-14044 aligned life-cycle environmental impact and charging cost calculators.
   - Local plan management stored securely in browser `localStorage`.

2. **EV Station Owner Portal (Secure Authentication & Real-Time Control)**:
   - Station operator registration and login with cryptographically secure PBKDF2 password hashing and session tokens.
   - Station creation with GPS geocoding, address lookup, operating hours, and driver amenities.
   - Multi-bay charger hardware registration (CCS2, Type 2, CHAdeMO, GB/T, Bharat AC001) with power ratings (kW) and tariffs ($/kWh).
   - Real-time charger availability control board: instant one-click status transitions (`Available`, `Occupied`, `Maintenance`, `Out of Service`, `Offline`) with automated timestamp auditing.
   - Full SQLite 3 persistence with cascade foreign keys.
   - Instant synchronization with the public discovery map and station detail cards!

---

## 2. Full Technology Stack

- **Frontend**: React 18 with TypeScript 5, Vite 5
- **Styling**: Tailwind CSS 3 (Custom eco-tech palette: Forest `#064E3B`, Emerald `#10B981`, Mint `#F4FBF7`, Solar Amber, Wind Sky)
- **Animations**: Framer Motion & CSS keyframe transitions + 3D Holographic EV Digital Twin Canvas
- **Icons**: Lucide React
- **Data Visualizations & Charts**: Recharts 2 (Interactive AreaCharts, ComposedCharts, BarCharts, PieCharts)
- **Interactive Mapping**: Leaflet 1.9 with OpenStreetMap tiles & custom SVG eco-markers
- **Geocoding & Location**: Browser Geolocation API & OpenStreetMap Nominatim Search API
- **Charging Station Data**: Verified SQLite Owner Database + OpenStreetMap Overpass API (Real-world charging nodes)
- **Highway Route Engine**: OSRM (Open Source Routing Machine) driving API
- **Renewable Solar & Wind Telemetry**: Open-Meteo Physical Radiation API + GreenByte Solar/Wind Physics Engine
- **Backend**: Python 3.11 with Threaded HTTP/REST server, SQLite 3 database persistence
- **Security**: PBKDF2-HMAC-SHA256 password hashing with unique salt, bearer token session authorization
- **Testing**: Node.js native test runner (`node --test`) and Python unit tests

---

## 3. Core Modules & Architecture

### 1. Real-Time Location System
- Uses standard browser Geolocation API.
- Requests GPS permission only when the user explicitly clicks *"Use My Current Location"*.
- **Manual Location Search & Autocomplete**: Instant search for any city, street, postal code, or landmark globally using OpenStreetMap Nominatim.
- **Configurable Search Radius**: Toggle search radius dynamically (5 km, 10 km, 25 km, 50 km, 100 km).
- Distinct visual badges indicate whether coordinates originate from `Live GPS Position` or `Geocoded Search`.
- Honest error handling for permission denied, timeout, or position unavailable without silent fallback substitutions.

### 2. EV Station Owner Portal & Availability Management
- **Owner Authentication**: Secure registration, login, profile inspection, and session logout.
- **Demo Operator Pre-fill**: One-click demo login for instant inspection (`owner@greencharge.com` / `Password123!`).
- **Station Management**: Add, update, and delete charging stations with address, GPS coordinates, facilities, and public listing toggle.
- **Charger Bay Hardware Control**: Configure individual charger bays with connector types, charging speed (kW), and pricing.
- **Real-Time Availability Switcher**: Operators can toggle bays between `Available`, `Occupied`, `Maintenance`, `Out of Service`, and `Offline`.
- **Audit Log & Analytics**: Full historical log of every status transition with exact timestamps and reason notes.

### 3. Unified Real Station Discovery
- Queries both verified station owner databases and OpenStreetMap Overpass.
- Displays station name, actual street address, coordinates, driving distance, operator name, operating hours, and connector types.
- **Strict Status Labels**:
  - `Operator Reported (X/Y Available)`: Verified live operator status from registered owners.
  - `Available (Confirmed by live feed)`
  - `Occupied (Confirmed by live feed)`
  - `Out of service (Confirmed by live feed)`
  - `Live availability not provided by operator`: Displayed whenever live operator feed is not provided; never invents fake availability.
- Transparent tariff indicators: Verified prices distinguished from unverified / on-site tariffs.
- One-click navigation in Google Maps and OpenStreetMap.

### 4. Smart Charging Planner & Recommendation Engine
- Vehicle presets (Tesla Model 3, Tata Nexon EV, Hyundai Ioniq 5, MG ZS EV, Ather 450X) plus Custom EV entry.
- Multi-objective Pareto scoring across sliding candidate windows:
  - **Lowest Estimated Cost**: Prioritizes solar soak ($0.10/kWh) and overnight off-peak ($0.12/kWh).
  - **Maximum Renewable Energy**: Prioritizes peak solar and wind generation (up to 92% clean share).
  - **Balanced Smart**: Compromise between bill savings and grid decarbonization.
  - **Fastest / ASAP**: Immediate rapid charging meeting tight departure constraints.
- Infeasible Constraint Detection: Automatically warns if budget or departure time cannot be met and provides transparent alternative suggestions.

### 5. Highway Journey Corridor Planner
- Origin and Destination inputs with geocoding search or live GPS.
- Real road path calculation via OSRM driving API.
- Vehicle energy consumption model ($E = \text{dist} \times \frac{\text{capacity}}{\text{range}} \times 1.05$).
- Dynamic range check: Identifies if distance exceeds current safe battery range.
- Discovers and maps charging hubs along the highway corridor.
- Add and configure charging stops with arrival SoC, energy needed, charging duration, and estimated stop cost.

### 6. Charging Cost & Environmental LCA Calculator
- Calculates net battery energy needed, wall energy drawn with conversion efficiency (default 90%), efficiency losses, electricity cost, session fees, and hourly parking fees.
- ISO-14044 aligned lifecycle assessment comparing smart charging against thermal coal/gas grids and petrol internal combustion engine (ICE) vehicles.
- Captures embodied lifecycle emissions of clean energy equipment (0.04 kg CO₂e/kWh for solar/wind manufacturing).
- Real-world equivalencies: kg CO₂e avoided, equivalent trees planted for 10 years, and liters of petrol not burned.

---

## 4. Database Schema (SQLite 3)

The persistent database is located at `backend/chargesmart.db`:

1. `station_owners`: Station operator accounts (`id`, `full_name`, `email`, `phone`, `business_name`, `password_hash`, `password_salt`, `business_address`, `created_at`).
2. `owner_sessions`: Cryptographically generated session tokens with 30-day expiration (`token`, `owner_id`, `created_at`, `expires_at`).
3. `stations`: Charging stations registered by operators (`id`, `owner_id`, `name`, `description`, `address`, `city`, `state`, `postal_code`, `country`, `latitude`, `longitude`, `operating_hours`, `facilities`, `contact_phone`, `contact_email`, `network_operator`, `is_public`, `created_at`, `updated_at`).
4. `chargers`: Individual charger bays at stations (`id`, `station_id`, `charger_identifier`, `connector_type`, `charging_type`, `power_kw`, `total_connectors`, `price_per_kwh`, `currency`, `additional_fees`, `availability_status`, `operating_status`, `last_status_updated`).
5. `availability_logs`: Audit trail of status transitions (`id`, `charger_id`, `station_id`, `old_status`, `new_status`, `updated_at`, `notes`).
6. `saved_plans`: User charging itineraries saved locally and synchronized.
7. `telemetry_logs`: Historical solar, wind, demand, tariff, and grid carbon logs.

---

## 5. API Endpoints (Python Backend)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System health, active data providers, ML versions, DB status |
| `POST` | `/api/auth/register` | Station owner registration with PBKDF2 password hashing |
| `POST` | `/api/auth/login` | Station owner login & session token generation |
| `GET` | `/api/auth/me` | Authenticated owner profile inspection |
| `POST` | `/api/auth/logout` | Session token revocation |
| `GET` | `/api/owner/stations` | Retrieves all stations and chargers for authenticated owner |
| `POST` | `/api/owner/stations` | Creates a new charging station |
| `PUT` | `/api/owner/stations/{id}` | Updates charging station information |
| `DELETE` | `/api/owner/stations/{id}` | Deletes charging station and child chargers |
| `POST` | `/api/owner/stations/{id}/chargers` | Registers a charger bay at a station |
| `PUT` | `/api/owner/chargers/{id}` | Updates charger hardware details, power, or pricing |
| `POST` | `/api/owner/chargers/{id}/status` | Instant charger availability toggle with audit logging |
| `DELETE` | `/api/owner/chargers/{id}` | Deletes charger bay |
| `GET` | `/api/owner/analytics` | Owner KPI analytics, utilization rate, and audit activity |
| `GET` | `/api/stations/nearby?lat={lat}&lon={lon}&radius={m}` | Unified real station discovery (Verified Owners + OSM) |
| `GET` | `/api/geocode/search?q={query}` | Geocodes cities, addresses, and PIN codes via Nominatim |
| `GET` | `/api/route?startLat={}&startLon={}&destLat={}&destLon={}` | OSRM road driving distance, duration, and coordinates |
| `GET` | `/api/grid/live?lat={lat}&lon={lon}` | Real-time Open-Meteo physical solar/wind radiation telemetry |
| `GET` | `/api/grid/forecast?hours={12-48}` | 48-hour hourly clean energy, tariff, and carbon forecast |
| `GET` | `/api/plans` | Retrieves saved charging plans from SQLite 3 database |
| `POST` | `/api/plans` | Saves a new plan to SQLite 3 |
| `PUT` | `/api/plans/{id}` | Updates plan status or notes in SQLite 3 |
| `DELETE` | `/api/plans/{id}` | Deletes a plan from SQLite 3 |
| `POST` | `/api/plans/clear` | Clears saved plans from SQLite 3 |
| `POST` | `/api/ai/copilot` | AI Energy Copilot natural language queries |
| `POST` | `/api/ai/forecast-ml` | Physical PV & wind aero-turbine regression inference |
| `POST` | `/api/ai/battery-analysis` | Arrhenius battery health & C-rate stress analysis |

---

## 6. Setup & Execution Instructions

### Prerequisites
- **Node.js**: v18+ (Node.js v20 or v24 recommended)
- **Python**: 3.11+ (Python 3.11 recommended)

### Step 1: Install Frontend Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(All core features work immediately out-of-the-box without requiring paid API keys!)*

### Step 3: Run Unit & Integration Tests
```bash
# Run Frontend & Service calculation tests (17 unit test scenarios)
npm test

# Run Backend Python, Owner Authentication, & SQLite persistence tests
python tests/test_backend.py
```

### Step 4: Start the Backend Server
```bash
python backend/server.py
```
*Backend runs on `http://localhost:8000` with SQLite persistence at `backend/chargesmart.db`.*

### Step 5: Start the Frontend Application
```bash
npm run dev
```
*Frontend opens at `http://localhost:3000`.*

### Step 6: Production Build & Preview
```bash
npm run build
npm run preview
```

---

## 7. Data Accuracy & Transparency Principles

1. **Never Invented Data**: Coordinates, addresses, and connectors originate from verified station owners or OpenStreetMap. If live plug status is not available from an operator feed, ChargeSmart displays `"Live availability not provided by operator"`.
2. **Never Fabricated Telemetry**: Grid solar irradiance and wind measurements are computed from physical models and Open-Meteo radiation feeds.
3. **Transparent Price Labels**: Station tariffs are explicitly marked as `Verified Station Price` or `User Entered Estimate`.
4. **No Mandatory Login**: All EV user features are publicly accessible without authentication.
5. **No Blind Fallbacks**: If location access is denied, users are prompted to search manually rather than silently being teleported to a random location.
