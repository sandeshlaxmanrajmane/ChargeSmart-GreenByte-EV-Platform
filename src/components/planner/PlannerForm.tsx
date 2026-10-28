import React, { useState, useEffect } from 'react';
import {
  VehicleType,
  ChargingLocation,
  ChargingPriority,
  PlanInput,
  RecommendationResponse,
  ChargingWindowCandidate,
} from '../../types';
import { VEHICLE_PRESETS } from '../../data/mockData';
import { generateSmartChargingPlan } from '../../services/recommendationEngine';
import { RecommendationCard } from './RecommendationCard';
import { ComparisonTable } from './ComparisonTable';
import { InfeasibleAlternativeModal } from './InfeasibleAlternativeModal';
import { storageService } from '../../services/storageService';
import { apiService } from '../../services/apiService';
import { locationService } from '../../services/locationService';
import { stationService } from '../../services/stationService';
import { showToast } from '../common/Toast';
import {
  Car,
  Bike,
  Zap,
  DollarSign,
  Clock,
  Sparkles,
  Sliders,
  Battery,
  MapPin,
  Leaf,
  Scale,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface PlannerFormProps {
  currency: string;
  currencySymbol: string;
}

export const PlannerForm: React.FC<PlannerFormProps> = ({ currency, currencySymbol }) => {
  // Preset or custom vehicle selection
  const [selectedPresetId, setSelectedPresetId] = useState<string>('car-nexon');

  // Input states
  const [vehicleType, setVehicleType] = useState<VehicleType>('car');
  const [vehicleName, setVehicleName] = useState<string>('Tata Nexon EV Long Range');
  const [batteryCapacityKwh, setBatteryCapacityKwh] = useState<number>(40.5);
  const [currentBatteryPercent, setCurrentBatteryPercent] = useState<number>(20);
  const [desiredBatteryPercent, setDesiredBatteryPercent] = useState<number>(80);
  const [maxChargingPowerKw, setMaxChargingPowerKw] = useState<number>(50.0);
  const [preferredLocation, setPreferredLocation] = useState<ChargingLocation>('home');
  const [budgetMax, setBudgetMax] = useState<number>(15.0);
  const [priority, setPriority] = useState<ChargingPriority>('balanced');
  const [planningHorizonHours, setPlanningHorizonHours] = useState<number>(24);
  const [efficiencyPercent, setEfficiencyPercent] = useState<number>(90);

  // Departure deadline default: 12 hours from now formatted as local datetime
  const [departureDeadline, setDepartureDeadline] = useState<string>(() => {
    const d = new Date(Date.now() + 12 * 3600 * 1000);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });

  // Calculation and results state
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [calculationStep, setCalculationStep] = useState<string>('');
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [selectedPlanCandidate, setSelectedPlanCandidate] = useState<ChargingWindowCandidate | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [showInfeasibleModal, setShowInfeasibleModal] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Live Location and Nearest Station Detection
  const [nearestDetectedStation, setNearestDetectedStation] = useState<{
    name: string;
    distanceKm: number;
    maxPowerKw: number;
    greenShare: number;
  } | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const handleDetectNearestStation = async () => {
    setIsDetectingLocation(true);
    try {
      showToast('info', 'Requesting Location', 'Acquiring device GPS coordinates...');
      const loc = await locationService.requestCurrentLocation();
      const realStations = await locationService.fetchRealNearbyStations(loc.latitude, loc.longitude, 25000);
      const allStations = realStations.length > 0 ? realStations : locationService.recalculateDistances(stationService.getAllStations(), loc);

      if (allStations.length > 0) {
        const top = allStations[0];
        setNearestDetectedStation({
          name: top.name,
          distanceKm: top.distanceKm,
          maxPowerKw: top.maxPowerKw,
          greenShare: top.renewableInfo.greenSharePercent,
        });
        setMaxChargingPowerKw(top.maxPowerKw);
        showToast(
          'success',
          'Nearest Station Found',
          `${top.name} is ${top.distanceKm} km away. Charger rating auto-set to ${top.maxPowerKw} kW!`
        );
      }
    } catch (err: any) {
      showToast('warning', 'Location Error', err.message || 'Could not acquire GPS position.');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Quick preset selector handler
  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (presetId === 'custom') return;

    const preset = VEHICLE_PRESETS.find((v) => v.id === presetId);
    if (preset) {
      setVehicleType(preset.type);
      setVehicleName(preset.name);
      setBatteryCapacityKwh(preset.batteryCapacityKwh);
      setMaxChargingPowerKw(preset.maxChargingPowerKw);
      setEfficiencyPercent(preset.defaultEfficiency);
    }
  };

  // Real-time calculation preview
  const requiredEnergyKwh = Number(
    (batteryCapacityKwh * Math.max(0, (desiredBatteryPercent - currentBatteryPercent) / 100)).toFixed(1)
  );
  const energyDrawnKwh = Number((requiredEnergyKwh / (efficiencyPercent / 100)).toFixed(1));
  const estimatedDurationHours = Number((energyDrawnKwh / Math.max(0.1, maxChargingPowerKw)).toFixed(1));

  // Run the recommendation calculation
  const handleGeneratePlan = (customInput?: Partial<PlanInput>) => {
    setValidationError(null);

    if (currentBatteryPercent >= desiredBatteryPercent) {
      setValidationError('Desired battery percentage must be greater than current battery charge.');
      return;
    }

    const planInput: PlanInput = {
      vehicleType,
      vehicleName,
      batteryCapacityKwh,
      currentBatteryPercent,
      desiredBatteryPercent,
      maxChargingPowerKw,
      preferredLocation,
      budgetMax,
      currency: currencySymbol,
      departureDeadline,
      priority,
      planningHorizonHours,
      efficiencyPercent,
      ...customInput,
    };

    setIsCalculating(true);
    setCalculationStep('Analyzing vehicle battery thermodynamics & supply losses...');

    setTimeout(() => {
      setCalculationStep('Ingesting 48h solar irradiance & wind forecast profiles...');
    }, 350);

    setTimeout(() => {
      setCalculationStep('Running multi-objective constraint optimizer & scoring matrix...');
    }, 700);

    setTimeout(() => {
      try {
        const response = generateSmartChargingPlan(planInput);
        setResult(response);
        setSelectedPlanCandidate(response.recommendedOption);
        setIsSaved(false);
        setIsCalculating(false);

        if (response.isEntirelyInfeasible) {
          setShowInfeasibleModal(true);
          showToast('warning', 'Constraints Unmet', 'No window satisfies both deadline and budget.');
        } else {
          showToast('success', 'Plan Generated', 'Optimized renewable charging schedule calculated!');
        }

        // Scroll to results smoothly
        setTimeout(() => {
          const resEl = document.getElementById('recommendation-results-anchor');
          if (resEl) resEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } catch (err: any) {
        setIsCalculating(false);
        setValidationError(err.message || 'Calculation error occurred.');
      }
    }, 1100);
  };

  const handleSavePlan = (candidate: ChargingWindowCandidate) => {
    if (!result) return;

    const planData = {
      vehicleName: vehicleName || 'EV Vehicle',
      vehicleType,
      startTime: candidate.startTimeFormatted,
      endTime: candidate.endTimeFormatted,
      energyKwh: candidate.energyDrawnKwh,
      cost: candidate.totalCost,
      currency: currencySymbol,
      renewableShare: candidate.avgRenewablePercent,
      emissionsKg: candidate.totalEmissionsKg,
      priority,
      locationName:
        preferredLocation === 'home'
          ? 'Home Charging Point'
          : preferredLocation === 'workplace'
          ? 'Workplace Solar Grid'
          : 'Public EV Fast Station',
      status: 'scheduled' as const,
      notes: `Optimal schedule. ${candidate.avgRenewablePercent}% renewable power intake.`,
    };

    const savedLocal = storageService.savePlan(planData);
    apiService.savePlanToSQLite({ ...planData, id: savedLocal.id });

    setIsSaved(true);
    showToast('success', 'Plan Saved!', 'Your charging schedule has been saved to your dashboard and SQLite database.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-300">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Core Recommendation Engine</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Smart Charge Planner
        </h2>
        <p className="text-sm sm:text-base text-slate-600 mt-2">
          Configure your vehicle, battery requirements, and personal constraints. ChargeSmart will calculate the most cost-effective and renewable-synchronized charging window.
        </p>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-card border border-slate-200 mb-12">
        {/* Preset Vehicle Selector Bar */}
        <div className="mb-8 pb-6 border-b border-slate-100">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            Quick Select Vehicle Preset (or configure manually)
          </label>
          <div className="flex flex-wrap gap-2">
            {VEHICLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetChange(preset.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedPresetId === preset.id
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/30'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {preset.type === 'car' ? (
                  <Car className="w-3.5 h-3.5" />
                ) : (
                  <Bike className="w-3.5 h-3.5" />
                )}
                <span>{preset.name}</span>
                <span className="text-[10px] opacity-75 font-mono">({preset.batteryCapacityKwh} kWh)</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => handlePresetChange('custom')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedPresetId === 'custom'
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/30'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              Custom Vehicle
            </button>
          </div>
        </div>

        {/* 10-Field Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. Vehicle Type */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              1. Vehicle Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'car', label: 'Electric Car', icon: Car },
                  { id: 'scooter', label: 'E-Scooter', icon: Bike },
                  { id: 'motorcycle', label: 'E-Motorcycle', icon: Bike },
                  { id: 'other', label: 'Other / Fleet', icon: Zap },
                ] as const
              ).map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setVehicleType(type.id);
                      setSelectedPresetId('custom');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                      vehicleType === type.id
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-emerald-600" />
                    <span>{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Battery Capacity (kWh) */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Battery Capacity
              </label>
              <span className="font-mono text-sm font-black text-emerald-700">
                {batteryCapacityKwh} kWh
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="120"
              step="0.5"
              value={batteryCapacityKwh}
              onChange={(e) => {
                setBatteryCapacityKwh(parseFloat(e.target.value));
                setSelectedPresetId('custom');
              }}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>2 kWh (Scooter)</span>
              <span>40 kWh (Compact)</span>
              <span>120 kWh (Truck)</span>
            </div>
          </div>

          {/* 3 & 4. Current & Desired Battery % */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                3 & 4. Battery State of Charge (SoC)
              </label>
              <span className="font-mono text-xs font-bold text-slate-700">
                {currentBatteryPercent}% → <span className="text-emerald-700 font-extrabold">{desiredBatteryPercent}%</span>
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-16 text-slate-500">Current:</span>
                <input
                  type="range"
                  min="0"
                  max="90"
                  step="5"
                  value={currentBatteryPercent}
                  onChange={(e) => setCurrentBatteryPercent(parseInt(e.target.value, 10))}
                  className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <span className="w-10 font-mono font-bold text-slate-700 text-right">
                  {currentBatteryPercent}%
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-16 text-slate-500">Target:</span>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={desiredBatteryPercent}
                  onChange={(e) => setDesiredBatteryPercent(parseInt(e.target.value, 10))}
                  className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <span className="w-10 font-mono font-bold text-emerald-700 text-right">
                  {desiredBatteryPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* 5. Maximum Charging Power (kW) */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                5. Max Charging Power
              </label>
              <span className="font-mono text-sm font-black text-emerald-700">
                {maxChargingPowerKw} kW
              </span>
            </div>
            <input
              type="range"
              min="2.2"
              max="150"
              step="0.5"
              value={maxChargingPowerKw}
              onChange={(e) => {
                setMaxChargingPowerKw(parseFloat(e.target.value));
                setSelectedPresetId('custom');
              }}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>3.3 kW (Slow AC)</span>
              <span>22 kW (Commercial)</span>
              <span>150 kW (DC Fast)</span>
            </div>
          </div>

          {/* 6. Preferred Charging Location */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                6. Preferred Location
              </label>
              <button
                type="button"
                onClick={handleDetectNearestStation}
                disabled={isDetectingLocation}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 hover:underline disabled:opacity-50"
              >
                <MapPin className="w-3 h-3 text-emerald-600" />
                <span>{isDetectingLocation ? 'Locating...' : 'Detect Nearest Hub'}</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'home', label: 'Home Charging' },
                  { id: 'workplace', label: 'Workplace' },
                  { id: 'public', label: 'Public Station' },
                  { id: 'other', label: 'Other Grid' },
                ] as const
              ).map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => setPreferredLocation(loc.id)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    preferredLocation === loc.id
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{loc.label}</span>
                </button>
              ))}
            </div>

            {nearestDetectedStation && (
              <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-950 flex items-center justify-between">
                <div>
                  <span className="font-bold block text-emerald-900">{nearestDetectedStation.name}</span>
                  <span className="text-slate-600 font-mono">
                    {nearestDetectedStation.distanceKm} km away • {nearestDetectedStation.maxPowerKw} kW DC • {nearestDetectedStation.greenShare}% Clean
                  </span>
                </div>
                <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-bold px-1.5 py-0.5 rounded">
                  Nearest
                </span>
              </div>
            )}
          </div>

          {/* 7. Maximum Budget */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                7. Maximum Budget ({currencySymbol})
              </label>
              <span className="font-mono text-sm font-black text-emerald-700">
                {currencySymbol}{budgetMax.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="50"
              step="1"
              value={budgetMax}
              onChange={(e) => setBudgetMax(parseFloat(e.target.value))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>{currencySymbol}2 (Low)</span>
              <span>{currencySymbol}15 (Standard)</span>
              <span>{currencySymbol}50 (Unlimited)</span>
            </div>
          </div>

          {/* 8. Departure Deadline */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              8. Departure Deadline
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={departureDeadline}
                onChange={(e) => setDepartureDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Optimization strictly ensures the battery finishes before this time.
            </p>
          </div>

          {/* 9. Charging Priority */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              9. Optimization Priority
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  {
                    id: 'lowest_cost',
                    label: 'Lowest Cost',
                    desc: '70% Cost weight',
                    icon: DollarSign,
                  },
                  {
                    id: 'max_renewable',
                    label: 'Max Clean Energy',
                    desc: '70% Renewable weight',
                    icon: Leaf,
                  },
                  {
                    id: 'balanced',
                    label: 'Balanced Smart',
                    desc: '40% Cost, 35% Green',
                    icon: Scale,
                  },
                  {
                    id: 'asap',
                    label: 'Urgent / ASAP',
                    desc: 'Earliest completion',
                    icon: Clock,
                  },
                ] as const
              ).map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPriority(p.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      priority === p.id
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-emerald-600 mb-1" />
                    <div className="text-xs font-bold">{p.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{p.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 10. Planning Horizon */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              10. Planning Horizon
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[12, 24, 48].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setPlanningHorizonHours(h)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    planningHorizonHours === h
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {h} Hours
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Lookahead analysis window.</p>
          </div>
        </div>

        {/* Real-time Requirement Calculator Preview Bar */}
        <div className="mt-8 pt-6 border-t border-slate-100 bg-slate-50/80 -mx-6 sm:-mx-10 -mb-6 sm:-mb-10 p-6 sm:p-8 rounded-b-3xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Required Energy</span>
              <span className="text-slate-900 font-mono font-extrabold text-base">
                {requiredEnergyKwh} kWh
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Supply Drawn (with 90% η)</span>
              <span className="text-emerald-700 font-mono font-extrabold text-base">
                {energyDrawnKwh} kWh
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Est. Duration</span>
              <span className="text-slate-900 font-mono font-extrabold text-base">
                ~{estimatedDurationHours} hours
              </span>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="w-full md:w-auto">
            <button
              type="button"
              onClick={() => handleGeneratePlan()}
              disabled={isCalculating}
              className="w-full md:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm shadow-md hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 group hover:scale-[1.02] disabled:opacity-75"
            >
              <Zap className="w-4 h-4 transition-transform group-hover:rotate-12" />
              <span>{isCalculating ? 'Computing Optimal Grid Schedule...' : 'Generate Smart Plan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Validation Error Message */}
      {validationError && (
        <div className="mb-8 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-shake">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Animated Calculation Processing Indicator */}
      {isCalculating && (
        <div className="my-12 p-8 rounded-3xl bg-slate-900 text-white shadow-2xl border border-emerald-500/30 text-center max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin mx-auto" />
          <h4 className="text-lg font-bold text-emerald-300">Evaluating Optimal Charging Windows</h4>
          <p className="text-xs text-slate-300 font-mono transition-all animate-pulse">
            {calculationStep}
          </p>
        </div>
      )}

      {/* Anchor for Smooth Scrolling to Results */}
      <div id="recommendation-results-anchor" />

      {/* Recommendation Results Presentation */}
      {result && !isCalculating && (
        <div className="space-y-8 animate-fade-in">
          <RecommendationCard
            result={result}
            currencySymbol={currencySymbol}
            onSavePlan={handleSavePlan}
            onRecalculate={() => handleGeneratePlan()}
            isSaved={isSaved}
          />

          <ComparisonTable
            result={result}
            currencySymbol={currencySymbol}
            onSelectOption={(option) => {
              setSelectedPlanCandidate(option);
              handleSavePlan(option);
            }}
          />

          {showInfeasibleModal && (
            <InfeasibleAlternativeModal
              result={result}
              onClose={() => setShowInfeasibleModal(false)}
              onApplyAdjustment={(adj) => {
                if (adj.desiredBatteryPercent) setDesiredBatteryPercent(adj.desiredBatteryPercent);
                if (adj.maxChargingPowerKw) setMaxChargingPowerKw(adj.maxChargingPowerKw);
                setTimeout(() => handleGeneratePlan(adj), 100);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};
