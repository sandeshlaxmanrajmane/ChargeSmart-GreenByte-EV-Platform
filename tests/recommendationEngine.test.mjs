import test from 'node:test';
import assert from 'node:assert/strict';

// Import calculation and engine logic
import {
  calculateRequiredEnergyKwh,
  calculateEnergyDrawnKwh,
  calculateChargingDurationHours,
  calculateEffectivePowerKw,
  validatePlanInput,
  generateSmartChargingPlan,
} from '../src/services/recommendationEngine.ts';

import {
  calculateDetailedChargingCost,
  calculateDetailedEnvironmentalImpact,
} from '../src/services/calculatorService.ts';

import { generateHourlyGridForecast } from '../src/data/mockData.ts';

// 1. Battery charging from 20% to 80%
test('Case 1: Battery charging from 20% to 80%', () => {
  const capacityKwh = 50.0;
  const currentPct = 20;
  const desiredPct = 80;

  const requiredEnergy = calculateRequiredEnergyKwh(capacityKwh, currentPct, desiredPct);
  // (80 - 20) / 100 * 50 = 30.0 kWh
  assert.equal(requiredEnergy, 30.0);

  const energyDrawn = calculateEnergyDrawnKwh(requiredEnergy, 90);
  // 30 / 0.90 = 33.33 kWh
  assert.equal(energyDrawn, 33.33);

  const durationHours = calculateChargingDurationHours(energyDrawn, 22.0);
  // 33.33 / 22.0 = 1.51 hours
  assert.equal(durationHours, 1.51);
});

// 2. Invalid battery percentages
test('Case 2: Invalid battery percentages', () => {
  const inputNegativeCurrent = {
    vehicleType: 'car',
    batteryCapacityKwh: 40,
    currentBatteryPercent: -10,
    desiredBatteryPercent: 80,
    maxChargingPowerKw: 50,
    preferredLocation: 'home',
    budgetMax: 20,
    currency: '$',
    departureDeadline: new Date(Date.now() + 24 * 3600000).toISOString(),
    priority: 'lowest_cost',
    planningHorizonHours: 24,
    efficiencyPercent: 90,
  };

  const validation1 = validatePlanInput(inputNegativeCurrent);
  assert.equal(validation1.isValid, false);
  assert.ok(validation1.errors.currentBatteryPercent);

  const inputExceedingDesired = {
    ...inputNegativeCurrent,
    currentBatteryPercent: 20,
    desiredBatteryPercent: 120,
  };
  const validation2 = validatePlanInput(inputExceedingDesired);
  assert.equal(validation2.isValid, false);
  assert.ok(validation2.errors.desiredBatteryPercent);
});

// 3. Current charge already above the desired charge
test('Case 3: Current charge already above or equal to desired charge', () => {
  const inputAbove = {
    vehicleType: 'car',
    batteryCapacityKwh: 40,
    currentBatteryPercent: 85,
    desiredBatteryPercent: 60,
    maxChargingPowerKw: 50,
    preferredLocation: 'home',
    budgetMax: 20,
    currency: '$',
    departureDeadline: new Date(Date.now() + 24 * 3600000).toISOString(),
    priority: 'lowest_cost',
    planningHorizonHours: 24,
    efficiencyPercent: 90,
  };

  const validation = validatePlanInput(inputAbove);
  assert.equal(validation.isValid, false);
  assert.ok(validation.errors.desiredBatteryPercent);

  const energyZero = calculateRequiredEnergyKwh(40, 85, 60);
  assert.equal(energyZero, 0);
});

// 4. Charging power limited by the vehicle
test('Case 4: Charging power limited by the vehicle', () => {
  const vehicleMaxKw = 11.0;
  const stationMaxKw = 150.0; // High speed DC station

  const effectivePower = calculateEffectivePowerKw(vehicleMaxKw, stationMaxKw);
  assert.equal(effectivePower, 11.0); // Limited by vehicle onboard charger
});

// 5. Charging power limited by the station
test('Case 5: Charging power limited by the station', () => {
  const vehicleMaxKw = 150.0; // High speed EV car
  const stationMaxKw = 22.0; // Commercial AC charger

  const effectivePower = calculateEffectivePowerKw(vehicleMaxKw, stationMaxKw);
  assert.equal(effectivePower, 22.0); // Limited by station supply
});

// 6. A budget that is too low
test('Case 6: A budget that is too low flags infeasibility', () => {
  const now = new Date('2026-10-28T10:00:00Z');
  const departureDeadline = new Date(now.getTime() + 12 * 3600000).toISOString();

  const planInput = {
    vehicleType: 'car',
    batteryCapacityKwh: 60,
    currentBatteryPercent: 10,
    desiredBatteryPercent: 90,
    maxChargingPowerKw: 50,
    preferredLocation: 'home',
    budgetMax: 0.50, // $0.50 is impossible for ~53 kWh
    currency: '$',
    departureDeadline,
    priority: 'lowest_cost',
    planningHorizonHours: 12,
    efficiencyPercent: 90,
  };

  const plan = generateSmartChargingPlan(planInput, undefined, now);
  assert.equal(plan.isEntirelyInfeasible, true);
  assert.ok(plan.infeasibilitySummary);
  assert.ok(plan.infeasibilitySummary.suggestions.length > 0);
});

// 7. A departure deadline that cannot be met
test('Case 7: A departure deadline that cannot be met', () => {
  const now = new Date('2026-10-28T10:00:00Z');
  // Departure in 30 minutes (0.5 hours), but vehicle needs ~3.5 hours on 11kW
  const departureDeadline = new Date(now.getTime() + 0.5 * 3600000).toISOString();

  const planInput = {
    vehicleType: 'car',
    batteryCapacityKwh: 40,
    currentBatteryPercent: 10,
    desiredBatteryPercent: 90,
    maxChargingPowerKw: 11.0, // Needs ~3.2 hours
    preferredLocation: 'home',
    budgetMax: 50,
    currency: '$',
    departureDeadline,
    priority: 'asap',
    planningHorizonHours: 12,
    efficiencyPercent: 90,
  };

  const plan = generateSmartChargingPlan(planInput, undefined, now);
  assert.equal(plan.isEntirelyInfeasible, true);
  assert.ok(plan.infeasibilitySummary);
  assert.ok(plan.infeasibilitySummary.primaryReason.includes('Exceeds departure deadline'));
});

// 8. Missing renewable-energy data handled gracefully
test('Case 8: Missing / zero renewable energy data handles gracefully', () => {
  const now = new Date('2026-10-28T10:00:00Z');
  const departureDeadline = new Date(now.getTime() + 10 * 3600000).toISOString();

  // Create a grid forecast with 0 renewable energy
  const zeroRenewableForecast = generateHourlyGridForecast(24).map((pt) => ({
    ...pt,
    renewableSharePercent: 0,
    solarGenerationMw: 0,
    windGenerationMw: 0,
  }));

  const planInput = {
    vehicleType: 'car',
    batteryCapacityKwh: 30,
    currentBatteryPercent: 20,
    desiredBatteryPercent: 80,
    maxChargingPowerKw: 22,
    preferredLocation: 'home',
    budgetMax: 20,
    currency: '$',
    departureDeadline,
    priority: 'max_renewable',
    planningHorizonHours: 10,
    efficiencyPercent: 90,
  };

  const plan = generateSmartChargingPlan(planInput, zeroRenewableForecast, now);
  assert.ok(plan.recommendedOption);
  assert.equal(plan.recommendedOption.avgRenewablePercent, 0);
  assert.ok(plan.recommendedOption.totalEmissionsKg > 0);
});

// 9. Missing / default electricity-price data
test('Case 9: Electricity cost calculation is internally consistent with wall supply', () => {
  const costResult = calculateDetailedChargingCost({
    requiredEnergyKwh: 40.0,
    electricityTariffPerKwh: 0.20,
    chargingEfficiencyPercent: 80, // 20% loss
    sessionFee: 1.50,
    parkingFeePerHour: 1.0,
    chargingDurationHours: 2.0,
  });

  // Energy drawn = 40 / 0.8 = 50.0 kWh
  assert.equal(costResult.energyDrawnFromGridKwh, 50.0);
  // Commodity cost = 50 * 0.20 = $10.00
  assert.equal(costResult.electricityEnergyCost, 10.0);
  // Total cost = 10.0 + 1.50 + 2.0 = $13.50
  assert.equal(costResult.totalEstimatedCost, 13.50);
});

// 10. Recommendation where charging immediately is the only feasible option
test('Case 10: Recommendation where charging immediately is the only feasible option', () => {
  const now = new Date('2026-10-28T10:00:00Z');
  // Vehicle takes exactly 2 hours to charge. Deadline is in 2.1 hours.
  // Window at offset 0 finishes at 2.0h (feasible).
  // Window at offset 0.5 finishes at 2.5h (violates 2.1h deadline).
  const departureDeadline = new Date(now.getTime() + 2.1 * 3600000).toISOString();

  const planInput = {
    vehicleType: 'car',
    batteryCapacityKwh: 40,
    currentBatteryPercent: 50,
    desiredBatteryPercent: 95, // 18 kWh needed -> 20 kWh drawn / 10kW = 2.0h duration
    maxChargingPowerKw: 10.0,
    preferredLocation: 'home',
    budgetMax: 50,
    currency: '$',
    departureDeadline,
    priority: 'lowest_cost',
    planningHorizonHours: 12,
    efficiencyPercent: 90,
  };

  const plan = generateSmartChargingPlan(planInput, undefined, now);
  assert.equal(plan.isEntirelyInfeasible, false);
  assert.ok(plan.recommendedOption);
  assert.equal(plan.recommendedOption.startHour, 0); // Must start immediately!
  assert.equal(plan.allFeasibleCandidates.length, 1); // Exactly one feasible window
});

// Internal consistency: Emissions calculation lifecycle test
test('Internal Consistency: ISO lifecycle emissions calculation', () => {
  const ecoResult = calculateDetailedEnvironmentalImpact({
    energyDrawnKwh: 50,
    renewableSharePercent: 80,
    gridEmissionFactorKgPerKwh: 0.70,
    renewableLifecycleEmissionKgPerKwh: 0.04,
  });

  // Renewable kWh = 40, Grid kWh = 10
  // Emissions = (40 * 0.04) + (10 * 0.70) = 1.6 + 7.0 = 8.6 kg
  assert.equal(ecoResult.estimatedSessionEmissionsKg, 8.6);
  // Unoptimized = 50 * 0.70 = 35.0 kg
  assert.equal(ecoResult.unoptimizedGridEmissionsKg, 35.0);
  // Avoided = 35.0 - 8.6 = 26.4 kg
  assert.equal(ecoResult.emissionsAvoidedVsStandardGridKg, 26.4);
});
