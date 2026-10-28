# ChargeSmart — GreenByte's Intelligent EV Charging Platform

> **"Smarter Charging. A Cleaner Tomorrow."**  
> Developed by **GreenByte** for **DSU Ideathon 2026** under the domain **Clean Mobility & EV Infrastructure**.

---

## 1. Project Vision & Executive Summary

Electric vehicles (EVs) are only as clean as the electricity used to charge them. When EV drivers plug in during peak evening hours (6:00 PM – 9:30 PM), power grids are forced to spin up carbon-intensive coal and natural gas peaker plants, driving electricity tariffs up to 3.2x higher and emitting over 0.78 kg CO₂e per kWh.

**ChargeSmart** is an intelligent, renewable-energy-aware EV charging platform that transforms charging from an unmanaged load into a flexible clean-energy consumer. ChargeSmart answers three critical questions for EV users and fleet managers:

1. **When should I charge my EV?**
2. **Which available charging window best fits my vehicle needs, departure deadline, and budget?**
3. **How does my charging decision measurably reduce financial cost and greenhouse gas emissions?**

---

## 2. Technology Stack

- **Frontend Framework**: React 18 with TypeScript 5
- **Build Tool & Bundler**: Vite 5
- **Styling**: Tailwind CSS 3 (custom eco-tech palette: Emerald, Forest, Mint, Solar Gold, Wind Sky)
- **Data Visualizations & Charts**: Recharts 2 (Interactive AreaCharts, ComposedCharts, BarCharts)
- **Interactive Mapping**: Leaflet 1.9 with OpenStreetMap tiles & custom SVG eco-markers
- **Icons**: Lucide React
- **Local Persistence & Service Layer**: HTML5 `localStorage` with reactive cross-tab event listeners and JSON plan export
- **Test Suite**: Node.js built-in native test runner (`node --test` with `--experimental-strip-types`)

---

## 3. Project Structure

```
chargesmart/
├── dist/                             # Optimized production build artifacts
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── BrandLogo.tsx         # GreenByte leaf-and-bolt brand mark
│   │   │   ├── Navbar.tsx            # Responsive navigation & currency switcher
│   │   │   ├── Footer.tsx            # Transparent credits & Ideathon notes
│   │   │   ├── StatusBadge.tsx       # Renewable %, Priority, and Status badges
│   │   │   └── Toast.tsx             # Toast notification system
│   │   ├── home/
│   │   │   ├── HeroSection.tsx       # Animated hero with EV charging showcase
│   │   │   ├── InteractiveEnergySlider.tsx # Live 24h solar/wind/tariff synchronizer
│   │   │   ├── HowItWorksSection.tsx # 4-step transparent optimization pipeline
│   │   │   ├── FeaturesSection.tsx   # Core platform capabilities
│   │   │   └── ImpactMetrics.tsx     # Quantified clean mobility metrics
│   │   ├── dashboard/
│   │   │   ├── ActiveSessionWidget.tsx # Real-time battery & solar intake monitor
│   │   │   ├── EnergyGridChart.tsx   # 24-hour solar, wind, & dynamic tariff chart
│   │   │   └── RecentPlansWidget.tsx # Saved charging schedules table with actions
│   │   ├── planner/
│   │   │   ├── PlannerForm.tsx       # 10-input interactive smart scheduling form
│   │   │   ├── RecommendationCard.tsx# Detailed recommended window & why chosen
│   │   │   ├── ComparisonTable.tsx   # Side-by-side trade-off matrix vs baseline
│   │   │   └── InfeasibleAlternativeModal.tsx # Constraint conflict suggestions
│   │   ├── stations/
│   │   │   ├── StationMap.tsx        # Leaflet OpenStreetMap with custom markers
│   │   │   ├── StationList.tsx       # Station cards with connector power & rates
│   │   │   ├── StationFilterBar.tsx  # Search, connector chips, & verified filter
│   │   │   └── StationDetailModal.tsx# Station specs, amenities, & route simulator
│   │   ├── calculator/
│   │   │   ├── CostCalculatorView.tsx# Wall-to-battery efficiency & tariff comparison
│   │   │   └── EcoCalculatorView.tsx # ISO-aligned lifecycle CO₂e calculator
│   │   ├── analytics/
│   │   │   └── AnalyticsView.tsx     # Aggregate KPIs & correlation charts
│   │   └── settings/
│   │       └── SettingsView.tsx      # Currencies, default vehicle, reset demo data
│   ├── data/
│   │   └── mockData.ts               # 48h solar/wind/tariff forecast & EV presets
│   ├── services/
│   │   ├── recommendationEngine.ts   # Core multi-objective optimization algorithm
│   │   ├── calculatorService.ts      # Standalone cost & environmental calculators
│   │   ├── stationService.ts         # Station filtering, search, & geo queries
│   │   └── storageService.ts         # Client persistence & JSON receipt exports
│   ├── types/
│   │   └── index.ts                  # TypeScript models, inputs, & responses
│   ├── App.tsx                       # Root routing & tab orchestration
│   ├── index.css                     # Tailwind directives & custom animations
│   └── main.tsx                      # Application entry point
├── tests/
│   └── recommendationEngine.test.mjs # 11 unit tests covering all required edge cases
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 4. Key Calculation Formulas & Methodology

### A. Required Energy & Wall Supply Drawn
$$E_{\text{battery}} = \text{Capacity (kWh)} \times \frac{\text{Desired \%} - \text{Current \%}}{100}$$

$$E_{\text{drawn}} = \frac{E_{\text{battery}}}{\eta_{\text{charging}}}$$
*(where $\eta_{\text{charging}}$ accounts for thermal dissipation losses during AC-to-DC conversion, default 90% efficiency)*.

### B. Charging Duration & Power Limit
$$P_{\text{effective}} = \min(P_{\text{vehicle}}, P_{\text{station}})$$

$$t_{\text{duration}} = \frac{E_{\text{drawn}}}{P_{\text{effective}}}$$

### C. Multi-Objective Scoring Matrix
For candidate sliding windows $[t_{\text{start}}, t_{\text{start}} + t_{\text{duration}}]$ across the planning horizon:
$$\text{Composite Score} = w_c \cdot S_{\text{cost}} + w_r \cdot S_{\text{renewable}} + w_e \cdot S_{\text{emissions}} + w_u \cdot S_{\text{urgency}}$$

Transparent, configurable weights applied:
- **Lowest Cost**: $w = (0.70, 0.15, 0.10, 0.05)$
- **Max Renewable Energy**: $w = (0.15, 0.70, 0.10, 0.05)$
- **Balanced Smart**: $w = (0.40, 0.35, 0.20, 0.05)$
- **Urgent / ASAP**: $w = (0.10, 0.10, 0.05, 0.75)$

### D. Environmental Lifecycle Accounting (ISO 14044 Aligned)
Unlike generic calculators that incorrectly assume renewable power has zero lifecycle emissions:
$$\text{Emissions (kg CO}_2\text{e)} = \int \left( \text{Share}_{\text{renewable}}(t) \times \text{EF}_{\text{renewable}} + (1 - \text{Share}_{\text{renewable}}(t)) \times \text{EF}_{\text{grid}}(t) \right) \cdot P_{\text{drawn}} \, dt$$
- $\text{EF}_{\text{renewable}} = 0.040 \text{ kg CO}_2\text{e/kWh}$ (photovoltaic panel and turbine manufacturing lifecycle embodied footprint).
- $\text{EF}_{\text{grid}} = 0.65 - 0.82 \text{ kg CO}_2\text{e/kWh}$ (time-varying thermal coal/gas generation mix).

---

## 5. Setup & Run Instructions

### Prerequisites
- Node.js version 18+ (Node v20 or v24 recommended)
- npm or pnpm

### Installation
```bash
# Clone or navigate to the directory
cd chargesmart

# Install dependencies
npm install
```

### Running the Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:3000`.

### Running Unit Tests
```bash
npm test
```
Executes the native test suite verifying all 11 test scenarios.

### Building for Production
```bash
npm run build
```
Generates optimized code-split bundles inside `dist/`.

---

## 6. Unit Testing Coverage

The test suite in `tests/recommendationEngine.test.mjs` verifies:
1. **Case 1**: Battery charging from 20% to 80% (energy required, wall draw, duration).
2. **Case 2**: Invalid battery percentages (negative values, >100%).
3. **Case 3**: Current battery charge already above or equal to desired charge.
4. **Case 4**: Charging power limited by vehicle onboard charger rating.
5. **Case 5**: Charging power limited by station power rating.
6. **Case 6**: Budget set too low (flags infeasibility and returns practical advice).
7. **Case 7**: Departure deadline that cannot be met (flags infeasibility and suggests target reduction or DC fast charger).
8. **Case 8**: Missing / zero renewable energy data handles gracefully without NaN.
9. **Case 9**: Wall-to-battery electricity cost consistency (efficiency losses + auxiliary fees).
10. **Case 10**: Tight deadline scenario where charging immediately is the only feasible option.
11. **Internal Consistency**: ISO lifecycle emissions calculation and petrol displacement equivalence.

---

## 7. Data Transparency & Honest Fallbacks

- **Simulated Grid Data**: Grid profiles, solar/wind curves, and station listings are clearly labeled as simulated datasets modeled after real Bangalore/DSU distribution nodes.
- **No Fabricated Telemetry**: ChargeSmart does not present invented live vehicle sensors as real data.
- **Constraint Integrity**: If a user's departure deadline is too tight or budget is insufficient, the system flags the schedule as infeasible and provides practical suggestions rather than displaying an invalid schedule.

---

## 8. Credits & Acknowledgements

- **Developed by**: GreenByte Technologies
- **Presented at**: DSU Ideathon 2026
- **Domain**: Clean Mobility & EV Infrastructure
- **Brand Tagline**: *"Smarter Charging. A Cleaner Tomorrow."*
