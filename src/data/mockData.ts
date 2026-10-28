import type { HourlyGridPoint, VehicleProfile, ChargingStation, SavedPlan, UserSettings } from '../types/index.ts';

export const DEFAULT_SETTINGS: UserSettings = {
  currency: 'USD',
  currencySymbol: '$',
  defaultVehicleId: 'car-nexon',
  defaultTariffPerKwh: 0.18,
  defaultEfficiency: 90,
  homeChargerPowerKw: 7.4,
  gridRegion: 'Green Grid District 4 (Simulated)',
  enableSimulatedLiveUpdates: true,
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  INR: '₹',
  GBP: '£',
};

export const VEHICLE_PRESETS: VehicleProfile[] = [
  {
    id: 'car-nexon',
    name: 'Tata Nexon EV Long Range',
    type: 'car',
    batteryCapacityKwh: 40.5,
    maxChargingPowerKw: 50.0,
    supportedConnectors: ['CCS2', 'Type 2'],
    defaultEfficiency: 91,
  },
  {
    id: 'car-tesla3',
    name: 'Tesla Model 3 Standard',
    type: 'car',
    batteryCapacityKwh: 60.0,
    maxChargingPowerKw: 170.0,
    supportedConnectors: ['CCS2', 'Type 2'],
    defaultEfficiency: 93,
  },
  {
    id: 'car-mgzs',
    name: 'MG ZS EV Excite',
    type: 'car',
    batteryCapacityKwh: 50.3,
    maxChargingPowerKw: 50.0,
    supportedConnectors: ['CCS2', 'Type 2'],
    defaultEfficiency: 90,
  },
  {
    id: 'car-hyundai-ioniq',
    name: 'Hyundai Ioniq 5',
    type: 'car',
    batteryCapacityKwh: 72.6,
    maxChargingPowerKw: 220.0,
    supportedConnectors: ['CCS2', 'Type 2'],
    defaultEfficiency: 94,
  },
  {
    id: 'scooter-ather',
    name: 'Ather 450X Gen 3',
    type: 'scooter',
    batteryCapacityKwh: 3.7,
    maxChargingPowerKw: 3.3,
    supportedConnectors: ['Type 2', 'Bharat AC001'],
    defaultEfficiency: 88,
  },
  {
    id: 'scooter-ola',
    name: 'Ola S1 Pro',
    type: 'scooter',
    batteryCapacityKwh: 4.0,
    maxChargingPowerKw: 3.0,
    supportedConnectors: ['Type 2', 'Bharat AC001'],
    defaultEfficiency: 88,
  },
  {
    id: 'moto-ultraviolette',
    name: 'Ultraviolette F77',
    type: 'motorcycle',
    batteryCapacityKwh: 10.3,
    maxChargingPowerKw: 7.4,
    supportedConnectors: ['Type 2', 'CCS2'],
    defaultEfficiency: 89,
  },
  {
    id: 'other-van',
    name: 'Commercial E-Delivery Van',
    type: 'other',
    batteryCapacityKwh: 35.0,
    maxChargingPowerKw: 22.0,
    supportedConnectors: ['CCS2', 'Type 2'],
    defaultEfficiency: 89,
  },
];

/**
 * 48-Hour simulated hourly grid profile.
 * Realistic dynamic modeling:
 * - Solar curve peaks between 10:00 and 15:00 (up to 85% renewable share).
 * - Wind generation is higher during late night / early morning (21:00 to 05:00).
 * - Dynamic Time-of-Use tariffs:
 *     - Off-Peak / Solar Soak (11:00-14:00): Low pricing ($0.10/kWh)
 *     - Night Off-Peak (00:00-06:00): Moderate low ($0.12/kWh)
 *     - Evening Peak (18:00-21:30): High pricing ($0.32/kWh)
 *     - Standard Shoulder: ($0.18/kWh)
 * - Grid emission factor:
 *     - Thermal coal/gas heavy grid during evening peak (0.75-0.82 kg CO2e/kWh)
 *     - High renewable grid during solar midday (0.15-0.22 kg CO2e/kWh)
 * - Lifecycle factor for renewable: 0.04 kg CO2e/kWh
 */
export function generateHourlyGridForecast(hoursCount = 48): HourlyGridPoint[] {
  const points: HourlyGridPoint[] = [];
  const currentHour = new Date().getHours();

  for (let i = 0; i < hoursCount; i++) {
    const rawHour = (currentHour + i) % 24;
    const dayOffset = Math.floor((currentHour + i) / 24);
    const timeLabel = `${String(rawHour).padStart(2, '0')}:00`;

    // Solar generation (peak around 12:00 - 13:00)
    let solarFraction = 0;
    if (rawHour >= 6 && rawHour <= 18) {
      const solarPeakDist = Math.abs(rawHour - 12.5);
      solarFraction = Math.max(0, Math.cos((solarPeakDist / 6.5) * (Math.PI / 2)));
    }
    const solarGenerationMw = Math.round(solarFraction * 450);

    // Wind generation (higher in early morning & evening)
    const windBase = 120 + 80 * Math.sin((rawHour / 24) * 2 * Math.PI + 1.2);
    const windGenerationMw = Math.max(40, Math.round(windBase));

    const totalRenewableMw = solarGenerationMw + windGenerationMw;
    const gridDemandMw = 500 + 250 * Math.sin(((rawHour - 8) / 24) * 2 * Math.PI);
    
    // Renewable share percentage capped at 92% (grid stability baseload remains)
    const renewableSharePercent = Math.min(
      92,
      Math.max(18, Math.round((totalRenewableMw / (gridDemandMw + totalRenewableMw * 0.3)) * 100))
    );

    // Tariff calculation ($ per kWh baseline)
    let gridTariff = 0.18;
    let isPeakTariff = false;
    let isPeakSolar = false;

    if (rawHour >= 18 && rawHour <= 21) {
      // Evening peak demand, low solar
      gridTariff = 0.32;
      isPeakTariff = true;
    } else if (rawHour >= 11 && rawHour <= 14) {
      // Solar soak super off-peak
      gridTariff = 0.10;
      isPeakSolar = true;
    } else if (rawHour >= 0 && rawHour <= 5) {
      // Night wind off-peak
      gridTariff = 0.12;
    } else if (rawHour >= 7 && rawHour <= 10) {
      // Morning ramp
      gridTariff = 0.22;
    }

    // Grid emission factor (kg CO2e per kWh)
    // When renewable share is high, emission factor drops drastically
    const thermalBaseEmission = 0.78; // coal/gas mix
    const gridEmissionFactorKg = Number(
      ((1 - renewableSharePercent / 100) * thermalBaseEmission + (renewableSharePercent / 100) * 0.04).toFixed(3)
    );

    points.push({
      hour: rawHour,
      timeLabel,
      dayOffset,
      solarGenerationMw,
      windGenerationMw,
      totalRenewableMw,
      gridDemandMw: Math.round(gridDemandMw),
      renewableSharePercent,
      gridTariff,
      gridEmissionFactorKg,
      lifecycleRenewableEmissionKg: 0.04,
      isPeakTariff,
      isPeakSolar,
    });
  }

  return points;
}

export const DEMO_STATIONS: ChargingStation[] = [
  {
    id: 'station-1',
    name: 'GreenByte EcoHub — DSU Innovation Park',
    operator: 'GreenByte Clean Infra',
    address: 'DSU Campus South Gate, Innovation Ring Road',
    city: 'Bengaluru',
    latitude: 12.8615,
    longitude: 77.4385,
    distanceKm: 0.8,
    totalPlugs: 8,
    availablePlugs: 5,
    connectors: [
      { type: 'CCS2', powerKw: 60, available: 3, total: 4 },
      { type: 'Type 2', powerKw: 22, available: 2, total: 3 },
      { type: 'Bharat AC001', powerKw: 3.3, available: 1, total: 1 },
    ],
    maxPowerKw: 60,
    pricePerKwh: 0.14,
    currency: 'USD',
    renewableInfo: {
      source: 'Rooftop Solar Canopy',
      verified: true,
      greenSharePercent: 94,
      lifecycleRating: 'A+',
    },
    amenities: ['Cafeteria', 'Wi-Fi 6', 'Restrooms', 'Shaded EV Bay', 'Battery Health Diagnostic'],
    status: 'available',
    isVerified: true,
    openingHours: '24/7 Clean Energy Access',
  },
  {
    id: 'station-2',
    name: 'SolarDrive Hub Central',
    operator: 'SolarDrive Energy',
    address: 'Plot 44, Tech Boulevard, Sector 3',
    city: 'Bengaluru',
    latitude: 12.8752,
    longitude: 77.4491,
    distanceKm: 2.3,
    totalPlugs: 12,
    availablePlugs: 7,
    connectors: [
      { type: 'CCS2', powerKw: 150, available: 4, total: 6 },
      { type: 'CHAdeMO', powerKw: 50, available: 1, total: 2 },
      { type: 'Type 2', powerKw: 22, available: 2, total: 4 },
    ],
    maxPowerKw: 150,
    pricePerKwh: 0.19,
    currency: 'USD',
    renewableInfo: {
      source: 'Wind PPA',
      verified: true,
      greenSharePercent: 88,
      lifecycleRating: 'A',
    },
    amenities: ['EV Lounge', 'Coffee Bar', 'Tire Pressure Station'],
    status: 'available',
    isVerified: true,
    openingHours: '24/7',
  },
  {
    id: 'station-3',
    name: 'Metro Greenway Fast Charging Point',
    operator: 'CleanCharge Metro',
    address: 'Near Electronic City Metro Station Exit 2',
    city: 'Bengaluru',
    latitude: 12.8512,
    longitude: 77.4261,
    distanceKm: 3.1,
    totalPlugs: 6,
    availablePlugs: 2,
    connectors: [
      { type: 'CCS2', powerKw: 50, available: 1, total: 3 },
      { type: 'Type 2', powerKw: 11, available: 1, total: 3 },
    ],
    maxPowerKw: 50,
    pricePerKwh: 0.16,
    currency: 'USD',
    renewableInfo: {
      source: '100% Certified Green Grid',
      verified: true,
      greenSharePercent: 78,
      lifecycleRating: 'A',
    },
    amenities: ['Metro Transit Link', 'Convenience Store'],
    status: 'available',
    isVerified: true,
    openingHours: '05:00 - 23:30',
  },
  {
    id: 'station-4',
    name: 'Phoenix Market City EcoCharger',
    operator: 'ChargeGrid Commercial',
    address: 'Level B2 Mall Parking, Whitefield Main Road',
    city: 'Bengaluru',
    latitude: 12.8911,
    longitude: 77.4619,
    distanceKm: 4.8,
    totalPlugs: 10,
    availablePlugs: 3,
    connectors: [
      { type: 'CCS2', powerKw: 60, available: 1, total: 4 },
      { type: 'Type 2', powerKw: 22, available: 2, total: 6 },
    ],
    maxPowerKw: 60,
    pricePerKwh: 0.22,
    currency: 'USD',
    renewableInfo: {
      source: 'Standard Grid Mix',
      verified: false,
      greenSharePercent: 42,
      lifecycleRating: 'C',
    },
    amenities: ['Shopping Mall', 'Cinema', 'Food Court', 'Valet EV Plug-in'],
    status: 'available',
    isVerified: false,
    openingHours: '10:00 - 22:30',
  },
  {
    id: 'station-5',
    name: 'WindPower Oasis — West Expressway',
    operator: 'AeroGreen Energy',
    address: 'Highway KM 18, Service Road West',
    city: 'Bengaluru',
    latitude: 12.8398,
    longitude: 77.4125,
    distanceKm: 5.6,
    totalPlugs: 16,
    availablePlugs: 11,
    connectors: [
      { type: 'CCS2', powerKw: 180, available: 7, total: 10 },
      { type: 'CHAdeMO', powerKw: 50, available: 2, total: 2 },
      { type: 'Type 2', powerKw: 22, available: 2, total: 4 },
    ],
    maxPowerKw: 180,
    pricePerKwh: 0.15,
    currency: 'USD',
    renewableInfo: {
      source: 'Wind PPA',
      verified: true,
      greenSharePercent: 91,
      lifecycleRating: 'A+',
    },
    amenities: ['Highway Diner', 'Showers', 'Kids Play Area', 'Driver Nap Pods'],
    status: 'available',
    isVerified: true,
    openingHours: '24/7',
  },
  {
    id: 'station-6',
    name: 'Cyber Park Rooftop Solar Station',
    operator: 'GreenByte Corporate',
    address: 'Cyber Tech Park Tower B Basement 1',
    city: 'Bengaluru',
    latitude: 12.8687,
    longitude: 77.4422,
    distanceKm: 1.4,
    totalPlugs: 8,
    availablePlugs: 4,
    connectors: [
      { type: 'Type 2', powerKw: 11, available: 3, total: 6 },
      { type: 'CCS2', powerKw: 30, available: 1, total: 2 },
    ],
    maxPowerKw: 30,
    pricePerKwh: 0.11,
    currency: 'USD',
    renewableInfo: {
      source: 'Rooftop Solar Canopy',
      verified: true,
      greenSharePercent: 96,
      lifecycleRating: 'A+',
    },
    amenities: ['Office Access', 'Security Staff', 'Bike Lockers'],
    status: 'available',
    isVerified: true,
    openingHours: '07:00 - 21:00 (Weekdays)',
  },
];

export const INITIAL_SAVED_PLANS: SavedPlan[] = [
  {
    id: 'plan-demo-1',
    createdAt: '2026-10-27T18:45:00.000Z',
    vehicleName: 'Tata Nexon EV Long Range',
    vehicleType: 'car',
    startTime: 'Today, 11:30 AM',
    endTime: 'Today, 01:15 PM',
    energyKwh: 24.3,
    cost: 2.67,
    currency: '$',
    renewableShare: 89,
    emissionsKg: 1.84,
    priority: 'max_renewable',
    locationName: 'Home Rooftop Solar (Smart Inverter)',
    status: 'scheduled',
    notes: 'Scheduled for maximum solar irradiance peak window.',
  },
  {
    id: 'plan-demo-2',
    createdAt: '2026-10-26T09:12:00.000Z',
    vehicleName: 'Ather 450X Gen 3',
    vehicleType: 'scooter',
    startTime: 'Yesterday, 02:00 AM',
    endTime: 'Yesterday, 03:10 AM',
    energyKwh: 2.2,
    cost: 0.26,
    currency: '$',
    renewableShare: 78,
    emissionsKg: 0.21,
    priority: 'lowest_cost',
    locationName: 'Home Off-Peak Tariff',
    status: 'completed',
    notes: 'Off-peak overnight wind tariff savings realized.',
  },
  {
    id: 'plan-demo-3',
    createdAt: '2026-10-25T14:20:00.000Z',
    vehicleName: 'Tesla Model 3 Standard',
    vehicleType: 'car',
    startTime: 'Oct 25, 01:00 PM',
    endTime: 'Oct 25, 01:45 PM',
    energyKwh: 36.0,
    cost: 4.86,
    currency: '$',
    renewableShare: 84,
    emissionsKg: 3.12,
    priority: 'balanced',
    locationName: 'GreenByte EcoHub — DSU Innovation Park',
    status: 'completed',
    notes: 'Fast charge utilizing onsite solar canopy.',
  },
];
