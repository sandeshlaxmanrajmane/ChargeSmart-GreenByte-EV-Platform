import type {
  PlanInput,
  HourlyGridPoint,
  ChargingWindowCandidate,
  RecommendationResponse,
} from '../types/index.ts';
import { generateHourlyGridForecast } from '../data/mockData.ts';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validates user input before recommendation calculation
 */
export function validatePlanInput(input: PlanInput): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.batteryCapacityKwh || input.batteryCapacityKwh <= 0) {
    errors.batteryCapacityKwh = 'Battery capacity must be greater than 0 kWh.';
  } else if (input.batteryCapacityKwh > 300) {
    errors.batteryCapacityKwh = 'Battery capacity seems unrealistic (> 300 kWh).';
  }

  if (input.currentBatteryPercent < 0 || input.currentBatteryPercent > 100) {
    errors.currentBatteryPercent = 'Current battery percentage must be between 0% and 100%.';
  }

  if (input.desiredBatteryPercent <= 0 || input.desiredBatteryPercent > 100) {
    errors.desiredBatteryPercent = 'Desired battery percentage must be between 1% and 100%.';
  }

  if (input.currentBatteryPercent >= input.desiredBatteryPercent) {
    errors.desiredBatteryPercent =
      'Desired charge percentage must be greater than current battery charge.';
  }

  if (!input.maxChargingPowerKw || input.maxChargingPowerKw <= 0) {
    errors.maxChargingPowerKw = 'Charging power must be greater than 0 kW.';
  }

  if (input.budgetMax !== undefined && input.budgetMax <= 0) {
    errors.budgetMax = 'Maximum budget must be greater than 0.';
  }

  if (!input.departureDeadline) {
    errors.departureDeadline = 'Please specify your departure deadline.';
  } else {
    const deadlineDate = new Date(input.departureDeadline);
    if (isNaN(deadlineDate.getTime())) {
      errors.departureDeadline = 'Invalid departure deadline date/time format.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Core mathematical calculation functions
 */
export function calculateRequiredEnergyKwh(
  capacityKwh: number,
  currentPercent: number,
  desiredPercent: number
): number {
  if (currentPercent >= desiredPercent || capacityKwh <= 0) return 0;
  const delta = (desiredPercent - currentPercent) / 100;
  return Number((capacityKwh * delta).toFixed(2));
}

export function calculateEnergyDrawnKwh(requiredEnergyKwh: number, efficiencyPercent = 90): number {
  const eff = Math.max(0.5, Math.min(1.0, efficiencyPercent / 100));
  return Number((requiredEnergyKwh / eff).toFixed(2));
}

export function calculateChargingDurationHours(
  energyDrawnKwh: number,
  effectivePowerKw: number
): number {
  if (effectivePowerKw <= 0 || energyDrawnKwh <= 0) return 0;
  return Number((energyDrawnKwh / effectivePowerKw).toFixed(2));
}

export function calculateEffectivePowerKw(
  vehicleMaxKw: number,
  stationLimitKw?: number
): number {
  if (!stationLimitKw) return vehicleMaxKw;
  return Math.min(vehicleMaxKw, stationLimitKw);
}

/**
 * Weights by priority
 */
export const PRIORITY_WEIGHTS = {
  lowest_cost: { cost: 0.70, renewable: 0.15, emissions: 0.10, urgency: 0.05 },
  max_renewable: { cost: 0.15, renewable: 0.70, emissions: 0.10, urgency: 0.05 },
  balanced: { cost: 0.40, renewable: 0.35, emissions: 0.20, urgency: 0.05 },
  asap: { cost: 0.10, renewable: 0.10, emissions: 0.05, urgency: 0.75 },
};

/**
 * Evaluates candidate window across hourly forecast
 */
function evaluateCandidateWindow(
  startOffsetHours: number,
  durationHours: number,
  energyDrawnKwh: number,
  effectivePowerKw: number,
  requiredEnergyKwh: number,
  gridForecast: HourlyGridPoint[],
  deadlineOffsetHours: number,
  budgetMax: number,
  now: Date
): ChargingWindowCandidate {
  const endOffsetHours = startOffsetHours + durationHours;
  const startTime = new Date(now.getTime() + startOffsetHours * 3600 * 1000);
  const endTime = new Date(now.getTime() + endOffsetHours * 3600 * 1000);

  // Integrate over the hours spanned
  let totalCost = 0;
  let weightedRenewableSum = 0;
  let totalEmissionsKg = 0;
  let remainingHours = durationHours;
  let currentOffset = startOffsetHours;

  while (remainingHours > 0) {
    const hourIndex = Math.min(Math.floor(currentOffset), gridForecast.length - 1);
    const gridPoint = gridForecast[hourIndex] || gridForecast[gridForecast.length - 1];

    const currentHourFraction = Math.min(
      remainingHours,
      Math.floor(currentOffset) + 1 - currentOffset
    );
    const energyInThisSlice = effectivePowerKw * currentHourFraction;

    // Energy cost in this slice
    totalCost += energyInThisSlice * gridPoint.gridTariff;

    // Renewable weighting
    weightedRenewableSum += gridPoint.renewableSharePercent * currentHourFraction;

    // Emissions calculation:
    // (Renewable share * 0.04 + Non-renewable share * grid emission factor) * kWh
    const renFraction = gridPoint.renewableSharePercent / 100;
    const sliceEmissionFactor =
      renFraction * gridPoint.lifecycleRenewableEmissionKg +
      (1 - renFraction) * gridPoint.gridEmissionFactorKg;

    totalEmissionsKg += energyInThisSlice * sliceEmissionFactor;

    currentOffset += currentHourFraction;
    remainingHours -= currentHourFraction;
  }

  const avgRenewablePercent = Math.round(weightedRenewableSum / Math.max(0.01, durationHours));
  const gridSharePercent = 100 - avgRenewablePercent;
  const avgTariff = Number((totalCost / Math.max(0.01, energyDrawnKwh)).toFixed(3));
  totalCost = Number(totalCost.toFixed(2));
  totalEmissionsKg = Number(totalEmissionsKg.toFixed(2));

  // Feasibility checks
  const completesBeforeDeadline = endOffsetHours <= deadlineOffsetHours + 0.01;
  const withinBudget = budgetMax === undefined || budgetMax <= 0 || totalCost <= budgetMax + 0.01;

  const infeasibilityReasons: string[] = [];
  if (!completesBeforeDeadline) {
    infeasibilityReasons.push(
      `Exceeds departure deadline: Completes in ${endOffsetHours.toFixed(1)}h, but departure is in ${deadlineOffsetHours.toFixed(1)}h.`
    );
  }
  if (!withinBudget) {
    infeasibilityReasons.push(
      `Exceeds budget: Cost ($${totalCost.toFixed(2)}) is higher than your maximum budget ($${budgetMax.toFixed(2)}).`
    );
  }

  const isFeasible = completesBeforeDeadline && withinBudget;

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  const formatDayTime = (d: Date) => {
    const isToday = d.toDateString() === now.toDateString();
    const dayStr = isToday ? 'Today' : 'Tomorrow';
    return `${dayStr}, ${formatTime(d)}`;
  };

  return {
    id: `cand-${startOffsetHours.toFixed(1)}`,
    startHour: startOffsetHours,
    startDayOffset: Math.floor(startOffsetHours / 24),
    durationHours,
    startTimeFormatted: formatDayTime(startTime),
    endTimeFormatted: formatDayTime(endTime),
    requiredEnergyKwh,
    energyDrawnKwh,
    effectivePowerKw,
    avgTariff,
    totalCost,
    avgRenewablePercent,
    gridSharePercent,
    totalEmissionsKg,
    emissionsPerKwh: Number((totalEmissionsKg / Math.max(0.01, energyDrawnKwh)).toFixed(3)),
    completesBeforeDeadline,
    withinBudget,
    isFeasible,
    infeasibilityReasons,
    costScore: 0,
    renewableScore: 0,
    emissionsScore: 0,
    urgencyScore: 0,
    compositeScore: 0,
    isRecommended: false,
  };
}

/**
 * Main Smart Recommendation Engine
 */
export function generateSmartChargingPlan(
  input: PlanInput,
  forecastOverride?: HourlyGridPoint[],
  currentTimeOverride?: Date
): RecommendationResponse {
  const validation = validatePlanInput(input);
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0];
    throw new Error(`Validation Error: ${firstError}`);
  }

  const now = currentTimeOverride || new Date();
  const deadlineDate = new Date(input.departureDeadline);
  const deadlineOffsetHours = Math.max(
    0.1,
    (deadlineDate.getTime() - now.getTime()) / (1000 * 3600)
  );

  const horizonHours = Math.min(input.planningHorizonHours || 24, 48);
  const gridForecast = forecastOverride || generateHourlyGridForecast(horizonHours + 12);

  // 1. Calculate required energy and duration
  const requiredEnergyKwh = calculateRequiredEnergyKwh(
    input.batteryCapacityKwh,
    input.currentBatteryPercent,
    input.desiredBatteryPercent
  );

  const efficiency = input.efficiencyPercent || 90;
  const energyDrawnKwh = calculateEnergyDrawnKwh(requiredEnergyKwh, efficiency);
  const effectivePowerKw = input.maxChargingPowerKw;
  const chargingDurationHours = calculateChargingDurationHours(energyDrawnKwh, effectivePowerKw);

  // 2. Generate candidate sliding windows
  // Step every 0.5 hours or 1 hour across horizon
  const stepHours = chargingDurationHours <= 4 ? 0.5 : 1.0;
  const maxStartHour = Math.max(0, horizonHours - chargingDurationHours);

  const allCandidates: ChargingWindowCandidate[] = [];

  for (let startHour = 0; startHour <= maxStartHour; startHour += stepHours) {
    const candidate = evaluateCandidateWindow(
      startHour,
      chargingDurationHours,
      energyDrawnKwh,
      effectivePowerKw,
      requiredEnergyKwh,
      gridForecast,
      deadlineOffsetHours,
      input.budgetMax,
      now
    );
    allCandidates.push(candidate);
  }

  if (allCandidates.length === 0) {
    // Generate at least one immediate window to analyze infeasibility
    const fallbackCand = evaluateCandidateWindow(
      0,
      chargingDurationHours,
      energyDrawnKwh,
      effectivePowerKw,
      requiredEnergyKwh,
      gridForecast,
      deadlineOffsetHours,
      input.budgetMax,
      now
    );
    allCandidates.push(fallbackCand);
  }

  // 3. Compute normalized scores across all candidates
  const costs = allCandidates.map((c) => c.totalCost);
  const renewables = allCandidates.map((c) => c.avgRenewablePercent);
  const emissions = allCandidates.map((c) => c.totalEmissionsKg);
  const startHours = allCandidates.map((c) => c.startHour);

  const minCost = Math.min(...costs);
  const maxCost = Math.max(...costs);
  const costRange = maxCost - minCost || 1;

  const minRen = Math.min(...renewables);
  const maxRen = Math.max(...renewables);
  const renRange = maxRen - minRen || 1;

  const minEm = Math.min(...emissions);
  const maxEm = Math.max(...emissions);
  const emRange = maxEm - minEm || 1;

  const maxStart = Math.max(...startHours) || 1;

  const weights = PRIORITY_WEIGHTS[input.priority] || PRIORITY_WEIGHTS.balanced;

  allCandidates.forEach((c) => {
    // Lower cost is better (1 = cheapest, 0 = most expensive)
    c.costScore = Number((1 - (c.totalCost - minCost) / costRange).toFixed(3));

    // Higher renewable is better (1 = highest %, 0 = lowest %)
    c.renewableScore = Number(((c.avgRenewablePercent - minRen) / renRange).toFixed(3));

    // Lower emissions is better (1 = cleanest, 0 = highest emissions)
    c.emissionsScore = Number((1 - (c.totalEmissionsKg - minEm) / emRange).toFixed(3));

    // Earlier start is better for urgency (1 = right now, 0 = latest)
    c.urgencyScore = Number((1 - c.startHour / maxStart).toFixed(3));

    // Composite weighted score
    c.compositeScore = Number(
      (
        c.costScore * weights.cost +
        c.renewableScore * weights.renewable +
        c.emissionsScore * weights.emissions +
        c.urgencyScore * weights.urgency
      ).toFixed(3)
    );
  });

  // 4. Feasible candidates
  const feasibleCandidates = allCandidates.filter((c) => c.isFeasible);

  // Baseline: ASAP charging window (candidate starting at offset 0)
  const asapOption = allCandidates[0];

  // Lowest cost feasible (or fallback lowest cost among all)
  const lowestCostOption = [...(feasibleCandidates.length > 0 ? feasibleCandidates : allCandidates)]
    .sort((a, b) => a.totalCost - b.totalCost)[0];

  // Highest renewable feasible (or fallback highest renewable among all)
  const highestRenewableOption = [
    ...(feasibleCandidates.length > 0 ? feasibleCandidates : allCandidates),
  ].sort((a, b) => b.avgRenewablePercent - a.avgRenewablePercent)[0];

  // Recommended option: best composite score among FEASIBLE candidates
  let recommendedOption: ChargingWindowCandidate | null = null;
  const isEntirelyInfeasible = feasibleCandidates.length === 0;

  if (!isEntirelyInfeasible) {
    const sortedFeasible = [...feasibleCandidates].sort((a, b) => {
      if (input.priority === 'lowest_cost') {
        return a.totalCost - b.totalCost || b.compositeScore - a.compositeScore;
      } else if (input.priority === 'max_renewable') {
        return b.avgRenewablePercent - a.avgRenewablePercent || b.compositeScore - a.compositeScore;
      } else if (input.priority === 'asap') {
        return a.startHour - b.startHour;
      }
      return b.compositeScore - a.compositeScore;
    });

    recommendedOption = sortedFeasible[0];
    recommendedOption.isRecommended = true;
    recommendedOption.categoryTag = 'Recommended';
  } else {
    // If completely infeasible, pick best composite as theoretical candidate
    recommendedOption = [...allCandidates].sort((a, b) => b.compositeScore - a.compositeScore)[0];
    recommendedOption.categoryTag = 'Recommended';
  }

  // Label options
  if (asapOption) asapOption.categoryTag = 'Fastest / ASAP';
  if (lowestCostOption && lowestCostOption !== recommendedOption) {
    lowestCostOption.categoryTag = 'Lowest Cost';
  }
  if (highestRenewableOption && highestRenewableOption !== recommendedOption) {
    highestRenewableOption.categoryTag = 'Highest Green';
  }

  // 5. Baseline comparison metrics (against ASAP charging)
  const baselineCost = asapOption ? asapOption.totalCost : 0;
  const baselineEmissions = asapOption ? asapOption.totalEmissionsKg : 0;

  const chosenCost = recommendedOption ? recommendedOption.totalCost : baselineCost;
  const chosenEmissions = recommendedOption ? recommendedOption.totalEmissionsKg : baselineEmissions;

  const costSavingsAmount = Number(Math.max(0, baselineCost - chosenCost).toFixed(2));
  const costSavingsPercent = baselineCost > 0 ? Math.round((costSavingsAmount / baselineCost) * 100) : 0;

  const emissionsSavedKg = Number(Math.max(0, baselineEmissions - chosenEmissions).toFixed(2));
  const emissionsSavedPercent =
    baselineEmissions > 0 ? Math.round((emissionsSavedKg / baselineEmissions) * 100) : 0;

  // 6. Generate transparent rationale explanation
  const explanation: string[] = [];
  if (recommendedOption) {
    if (recommendedOption.startHour === 0) {
      explanation.push(
        'Immediate charging is optimal: either deadline constraints require early start or current energy tariffs are favorable.'
      );
    } else {
      explanation.push(
        `Scheduled start at ${recommendedOption.startTimeFormatted} aligns with peak renewable generation and off-peak tariffs.`
      );
    }

    if (recommendedOption.avgRenewablePercent >= 70) {
      explanation.push(
        `High green factor: Achieves ~${recommendedOption.avgRenewablePercent}% clean solar and wind energy absorption.`
      );
    }

    if (costSavingsAmount > 0) {
      explanation.push(
        `Cost optimization: Saves ${input.currency || '$'}${costSavingsAmount.toFixed(
          2
        )} (${costSavingsPercent}%) compared to unoptimized immediate charging.`
      );
    }

    if (emissionsSavedKg > 0) {
      explanation.push(
        `Avoids ~${emissionsSavedKg.toFixed(2)} kg CO₂e greenhouse gas emissions versus high-carbon grid hours.`
      );
    }

    explanation.push(
      `Finishes at ${recommendedOption.endTimeFormatted}, fully meeting departure deadline with ${
        recommendedOption.withinBudget ? 'budget satisfied' : 'budget alert'
      }.`
    );
  }

  // Infeasibility summary if needed
  let infeasibilitySummary: { primaryReason: string; suggestions: string[] } | undefined = undefined;

  if (isEntirelyInfeasible) {
    const reasons = allCandidates[0]?.infeasibilityReasons || [];
    const primaryReason = reasons[0] || 'No candidate charging window satisfies all specified constraints.';
    const suggestions: string[] = [];

    if (chargingDurationHours > deadlineOffsetHours) {
      suggestions.push(
        `Charging requires ${chargingDurationHours.toFixed(1)}h, but your departure is in only ${deadlineOffsetHours.toFixed(
          1
        )}h. Lower your desired charge target to ${Math.round(
          input.currentBatteryPercent + (deadlineOffsetHours / chargingDurationHours) * (input.desiredBatteryPercent - input.currentBatteryPercent)
        )}%, or extend your deadline.`
      );
      suggestions.push(
        `Switch to a high-power DC Fast Charger (e.g. 50kW - 150kW) to reduce charging duration significantly.`
      );
    }

    if (minCost > (input.budgetMax || 0) && (input.budgetMax || 0) > 0) {
      suggestions.push(
        `The minimum possible charging cost is ${input.currency || '$'}${minCost.toFixed(2)}, which exceeds your budget of ${input.currency || '$'}${input.budgetMax.toFixed(2)}. Increase your budget or charge fewer kWh.`
      );
    }

    infeasibilitySummary = { primaryReason, suggestions };
  }

  return {
    input,
    requiredEnergyKwh,
    chargingDurationHours,
    effectiveChargingPowerKw: effectivePowerKw,
    recommendedOption,
    comparisonOptions: {
      asap: asapOption || null,
      lowestCost: lowestCostOption || null,
      highestRenewable: highestRenewableOption || null,
      selectedPriority: recommendedOption,
    },
    baselineMetrics: {
      asapCost: baselineCost,
      asapEmissionsKg: baselineEmissions,
      costSavingsAmount,
      costSavingsPercent,
      emissionsSavedKg,
      emissionsSavedPercent,
    },
    explanation,
    weightsUsed: weights,
    allFeasibleCandidates: feasibleCandidates,
    allCandidates,
    isEntirelyInfeasible,
    infeasibilitySummary,
  };
}
