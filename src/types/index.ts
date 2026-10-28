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
  // Normalized component scores (0 to 1, higher is better)
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

export interface ChargingStation {
  id: string;
  name: string;
  operator: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  totalPlugs: number;
  availablePlugs: number;
  connectors: {
    type: 'CCS2' | 'Type 2' | 'CHAdeMO' | 'Bharat AC001' | 'GB/T';
    powerKw: number;
    available: number;
    total: number;
  }[];
  maxPowerKw: number;
  pricePerKwh: number;
  currency: string;
  renewableInfo: {
    source: 'Rooftop Solar Canopy' | 'Wind PPA' | '100% Certified Green Grid' | 'Standard Grid Mix';
    verified: boolean;
    greenSharePercent: number;
    lifecycleRating: 'A+' | 'A' | 'B' | 'C';
  };
  amenities: string[];
  status: 'available' | 'busy' | 'offline';
  isVerified: boolean;
  openingHours: string;
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
