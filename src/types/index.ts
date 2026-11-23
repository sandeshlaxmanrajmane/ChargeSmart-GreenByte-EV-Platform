export type VehicleType = 'car' | 'motorcycle' | 'scooter' | 'other';

export type ChargingLocation = 'home' | 'workplace' | 'public' | 'other';

export type ChargingPriority = 'lowest_cost' | 'max_renewable' | 'balanced' | 'asap';

export interface VehicleProfile {
  id: string;
  name: string;
  type: VehicleType;
  batteryCapacityKwh: number;
  maxChargingPowerKw: number;
  supportedConnectors: string[];
  defaultEfficiency: number;
  image?: string;
}

export interface PlanInput {
  vehicleType: VehicleType;
  vehicleName?: string;
  batteryCapacityKwh: number;
  currentBatteryPercent: number;
  desiredBatteryPercent: number;
  maxChargingPowerKw: number;
  preferredLocation: ChargingLocation;
  budgetMax: number;
  currency: string;
  departureDeadline: string; // ISO time or 'YYYY-MM-DDTHH:mm'
  priority: ChargingPriority;
  planningHorizonHours: number; // e.g. 12, 24, 48
  efficiencyPercent: number; // default 90%
}

export interface HourlyGridPoint {
  hour: number; // 0..23
  timeLabel: string; // '14:00'
  dayOffset: number; // 0 = today, 1 = tomorrow
  solarGenerationMw: number;
  windGenerationMw: number;
  totalRenewableMw: number;
  gridDemandMw: number;
  renewableSharePercent: number; // 0..100
  gridTariff: number; // currency per kWh, e.g. $0.18
  gridEmissionFactorKg: number; // kg CO2e per kWh (e.g. 0.65 kg for thermal grid)
  lifecycleRenewableEmissionKg: number; // e.g. 0.04 kg CO2e per kWh
  isPeakTariff: boolean;
  isPeakSolar: boolean;
}

export interface ChargingWindowCandidate {
  id: string;
  startHour: number;
  startDayOffset: number;
  durationHours: number;
  startTimeFormatted: string;
  endTimeFormatted: string;
  requiredEnergyKwh: number; // energy stored into battery
  energyDrawnKwh: number; // energy drawn from grid (after efficiency loss)
  effectivePowerKw: number;
  avgTariff: number;
  totalCost: number;
  avgRenewablePercent: number;
  gridSharePercent: number;
  totalEmissionsKg: number;
  emissionsPerKwh: number;
  completesBeforeDeadline: boolean;
  withinBudget: boolean;
  isFeasible: boolean;
  infeasibilityReasons: string[];
  costScore: number;
  renewableScore: number;
  emissionsScore: number;
  urgencyScore: number;
  compositeScore: number;
  isRecommended: boolean;
  categoryTag?: 'Recommended' | 'Lowest Cost' | 'Highest Green' | 'Fastest / ASAP';
}

export interface RecommendationResponse {
  input: PlanInput;
  requiredEnergyKwh: number;
  chargingDurationHours: number;
  effectiveChargingPowerKw: number;
  recommendedOption: ChargingWindowCandidate | null;
  comparisonOptions: {
    asap: ChargingWindowCandidate | null;
    lowestCost: ChargingWindowCandidate | null;
    highestRenewable: ChargingWindowCandidate | null;
    selectedPriority: ChargingWindowCandidate | null;
  };
  baselineMetrics: {
    asapCost: number;
    asapEmissionsKg: number;
    costSavingsAmount: number;
    costSavingsPercent: number;
    emissionsSavedKg: number;
    emissionsSavedPercent: number;
  };
  explanation: string[];
  weightsUsed: {
    cost: number;
    renewable: number;
    emissions: number;
    urgency: number;
  };
  allFeasibleCandidates: ChargingWindowCandidate[];
  allCandidates: ChargingWindowCandidate[];
  isEntirelyInfeasible: boolean;
  infeasibilitySummary?: {
    primaryReason: string;
    suggestions: string[];
  };
}

export interface ChargerBay {
  id: string;
  station_id?: string;
  stationId?: string;
  charger_identifier: string;
  connector_type: string;
  charging_type: 'DC Fast' | 'AC Level 2' | string;
  power_kw: number;
  total_connectors: number;
  price_per_kwh: number;
  currency: string;
  additional_fees?: number;
  availability_status: 'Available' | 'Occupied' | 'Out of Service' | 'Maintenance' | 'Offline';
  operating_status: 'Online' | 'Degraded' | 'Offline';
  last_status_updated: string;
}

export interface ChargingStation {
  id: string;
  name: string;
  operator: string;
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  totalPlugs: number;
  availablePlugs: number;
  occupiedPlugs?: number;
  outOfServicePlugs?: number;
  connectors: {
    type: 'CCS2' | 'Type 2' | 'CHAdeMO' | 'Bharat AC001' | 'GB/T' | 'Tesla Supercharger' | string;
    powerKw: number;
    available: number;
    total: number;
  }[];
  chargers?: ChargerBay[];
  maxPowerKw: number;
  pricePerKwh: number;
  isVerifiedPrice?: boolean;
  tariffDetails?: string;
  currency: string;
  renewableInfo: {
    source: 'Rooftop Solar Canopy' | 'Wind PPA' | '100% Certified Green Grid' | 'Regional Grid Mix' | 'Standard Grid Mix' | string;
    verified: boolean;
    greenSharePercent: number;
    lifecycleRating: 'A+' | 'A' | 'B' | 'C';
  };
  amenities: string[];
  status: 'available' | 'busy' | 'offline' | 'unknown';
  liveStatus?: 'available' | 'occupied' | 'out_of_service' | 'unknown' | 'operator_reported' | 'live';
  isLiveStatusAvailable?: boolean;
  dataProvider?: string;
  lastUpdated?: string;
  isVerified: boolean;
  openingHours: string;
  contactPhone?: string;
  contactEmail?: string;
  description?: string;
  ownerId?: string;
}

export interface StationOwner {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  business_name: string;
  business_address?: string;
  created_at: string;
}

export interface OwnerStation {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  state?: string;
  postal_code?: string;
  country?: string;
  latitude: number;
  longitude: number;
  operating_hours: string;
  facilities: string[];
  contact_phone?: string;
  contact_email?: string;
  network_operator: string;
  is_public: boolean;
  photo_url?: string;
  chargers: ChargerBay[];
  created_at: string;
  updated_at: string;
}

export interface OwnerAnalytics {
  totalStations: number;
  totalChargers: number;
  availableChargers: number;
  occupiedChargers: number;
  offlineChargers: number;
  utilizationRatePercent: number;
  recentActivity: {
    id: number;
    charger_id: string;
    station_id: string;
    charger_identifier: string;
    station_name: string;
    old_status: string;
    new_status: string;
    updated_at: string;
    notes?: string;
  }[];
}

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  durationFormatted: string;
  coordinates: [number, number][];
  isSimulatedRoute: boolean;
  provider: string;
}

export interface RouteChargingStop {
  station: ChargingStation;
  distanceFromStartKm: number;
  estimatedArrivalSocPercent: number;
  targetDepartureSocPercent: number;
  energyNeededKwh: number;
  chargingDurationMinutes: number;
  estimatedCost: number;
}

export interface JourneyPlan {
  id: string;
  createdAt: string;
  startLocation: { name: string; latitude: number; longitude: number };
  destLocation: { name: string; latitude: number; longitude: number };
  vehicleName: string;
  batteryCapacityKwh: number;
  vehicleRangeKm: number;
  currentBatteryPercent: number;
  totalDistanceKm: number;
  totalDriveTimeFormatted: string;
  estimatedEnergyKwh: number;
  requiresChargingStop: boolean;
  chargingStops: RouteChargingStop[];
  totalJourneyCost: number;
  totalChargingTimeMinutes: number;
}

export interface SavedPlan {
  id: string;
  createdAt: string;
  vehicleName: string;
  vehicleType: VehicleType;
  startTime: string;
  endTime: string;
  energyKwh: number;
  cost: number;
  currency: string;
  renewableShare: number;
  emissionsKg: number;
  priority: ChargingPriority;
  locationName: string;
  status: 'scheduled' | 'charging' | 'completed';
  notes?: string;
}

export interface UserSettings {
  currency: 'USD' | 'EUR' | 'INR' | 'GBP';
  currencySymbol: string;
  defaultVehicleId: string;
  defaultTariffPerKwh: number;
  defaultEfficiency: number;
  homeChargerPowerKw: number;
  gridRegion: string;
  enableSimulatedLiveUpdates: boolean;
}
