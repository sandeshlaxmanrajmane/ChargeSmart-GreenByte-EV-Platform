/**
 * Standalone calculation services for EV charging costs and environmental impacts
 */

export interface CostCalculationInput {
  requiredEnergyKwh: number;
  electricityTariffPerKwh: number;
  chargingEfficiencyPercent: number; // e.g. 90%
  sessionFee?: number;
  parkingFeePerHour?: number;
  chargingDurationHours?: number;
}

export interface CostCalculationResult {
  energyStoredInBatteryKwh: number;
  energyDrawnFromGridKwh: number;
  efficiencyLossKwh: number;
  efficiencyLossPercent: number;
  electricityEnergyCost: number;
  sessionFee: number;
  parkingFee: number;
  totalEstimatedCost: number;
  effectiveCostPerKwhStored: number;
}

export function calculateDetailedChargingCost(
  input: CostCalculationInput
): CostCalculationResult {
  const efficiency = Math.max(0.5, Math.min(1.0, (input.chargingEfficiencyPercent || 90) / 100));
  const energyStored = Math.max(0, input.requiredEnergyKwh || 0);
  const energyDrawn = Number((energyStored / efficiency).toFixed(2));
  const efficiencyLossKwh = Number((energyDrawn - energyStored).toFixed(2));
  const efficiencyLossPercent = Math.round((1 - efficiency) * 100);

  const electricityEnergyCost = Number((energyDrawn * (input.electricityTariffPerKwh || 0)).toFixed(2));
  const sessionFee = Number((input.sessionFee || 0).toFixed(2));
  const parkingFee = Number(
    ((input.parkingFeePerHour || 0) * (input.chargingDurationHours || 0)).toFixed(2)
  );

  const totalEstimatedCost = Number((electricityEnergyCost + sessionFee + parkingFee).toFixed(2));
  const effectiveCostPerKwhStored =
    energyStored > 0 ? Number((totalEstimatedCost / energyStored).toFixed(3)) : 0;

  return {
    energyStoredInBatteryKwh: energyStored,
    energyDrawnFromGridKwh: energyDrawn,
    efficiencyLossKwh,
    efficiencyLossPercent,
    electricityEnergyCost,
    sessionFee,
    parkingFee,
    totalEstimatedCost,
    effectiveCostPerKwhStored,
  };
}

export interface EnvironmentalImpactInput {
  energyDrawnKwh: number;
  renewableSharePercent: number; // 0..100
  gridEmissionFactorKgPerKwh?: number; // default ~0.72 kg CO2e/kWh for thermal grid
  renewableLifecycleEmissionKgPerKwh?: number; // default ~0.04 kg CO2e/kWh (solar/wind lifecycle)
  averageIceVehicleKmPerKwhEquivalent?: number; // ~ 5 km per kWh
  iceEmissionsKgPerKm?: number; // ~0.165 kg CO2e/km (petrol car average)
}

export interface EnvironmentalImpactResult {
  energyDrawnKwh: number;
  renewableEnergyKwh: number;
  gridFossilEnergyKwh: number;
  estimatedSessionEmissionsKg: number;
  unoptimizedGridEmissionsKg: number;
  emissionsAvoidedVsStandardGridKg: number;
  emissionsAvoidedVsPetrolIceKg: number;
  equivalentTreesPlantedYears: number;
  gasolineLitersEquivalentAvoided: number;
  iceDrivingKmEquivalent: number;
  lifecycleExplanation: string;
}

export function calculateDetailedEnvironmentalImpact(
  input: EnvironmentalImpactInput
): EnvironmentalImpactResult {
  const energy = Math.max(0, input.energyDrawnKwh || 0);
  const renPct = Math.max(0, Math.min(100, input.renewableSharePercent || 0)) / 100;
  const fossilPct = 1 - renPct;

  const gridEf = input.gridEmissionFactorKgPerKwh || 0.72; // Average coal/gas thermal grid
  const renEf = input.renewableLifecycleEmissionKgPerKwh || 0.04; // Solar/wind lifecycle footprint

  const renewableEnergyKwh = Number((energy * renPct).toFixed(2));
  const gridFossilEnergyKwh = Number((energy * fossilPct).toFixed(2));

  // Actual session emissions = (solar/wind lifecycle emissions) + (fossil grid emissions)
  const estimatedSessionEmissionsKg = Number(
    (renewableEnergyKwh * renEf + gridFossilEnergyKwh * gridEf).toFixed(2)
  );

  // Baseline standard unoptimized thermal grid (100% grid average)
  const unoptimizedGridEmissionsKg = Number((energy * gridEf).toFixed(2));

  // Emissions avoided vs dirty grid
  const emissionsAvoidedVsStandardGridKg = Number(
    Math.max(0, unoptimizedGridEmissionsKg - estimatedSessionEmissionsKg).toFixed(2)
  );

  // Baseline equivalent internal combustion engine (ICE) petrol vehicle
  // An EV typically gets ~5.5 km per kWh. Petrol car emits ~0.165 kg CO2/km (approx 7 L/100km).
  const iceDrivingKmEquivalent = Number((energy * 5.5).toFixed(1));
  const iceBaselineEmissionsKg = Number((iceDrivingKmEquivalent * 0.165).toFixed(2));
  const emissionsAvoidedVsPetrolIceKg = Number(
    Math.max(0, iceBaselineEmissionsKg - estimatedSessionEmissionsKg).toFixed(2)
  );

  // Tree absorption: One urban mature tree absorbs approx 21.7 kg CO2 per year
  const equivalentTreesPlantedYears = Number(
    (emissionsAvoidedVsPetrolIceKg / 21.7).toFixed(2)
  );

  // 1 liter of gasoline combustion emits approx 2.31 kg CO2
  const gasolineLitersEquivalentAvoided = Number(
    (emissionsAvoidedVsPetrolIceKg / 2.31).toFixed(1)
  );

  const lifecycleExplanation =
    'ChargeSmart applies ISO-aligned lifecycle accounting: Renewable solar and wind electricity are assigned ~0.04 kg CO₂e/kWh (photovoltaic panel & wind turbine manufacturing lifecycle), while thermal grid electricity is assessed based on real-time grid generation mix.';

  return {
    energyDrawnKwh: energy,
    renewableEnergyKwh,
    gridFossilEnergyKwh,
    estimatedSessionEmissionsKg,
    unoptimizedGridEmissionsKg,
    emissionsAvoidedVsStandardGridKg,
    emissionsAvoidedVsPetrolIceKg,
    equivalentTreesPlantedYears,
    gasolineLitersEquivalentAvoided,
    iceDrivingKmEquivalent,
    lifecycleExplanation,
  };
}
