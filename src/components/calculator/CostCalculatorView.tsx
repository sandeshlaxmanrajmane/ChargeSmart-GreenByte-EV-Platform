import React, { useState } from 'react';
import { calculateDetailedChargingCost } from '../../services/calculatorService';
import { VEHICLE_PRESETS } from '../../data/mockData';
import { VehicleProfile } from '../../types';
import { DollarSign, Zap, HelpCircle, ArrowRight, ShieldCheck, Scale, Car, Battery, Clock } from 'lucide-react';

interface CostCalculatorViewProps {
  currencySymbol: string;
}

export const CostCalculatorView: React.FC<CostCalculatorViewProps> = ({ currencySymbol }) => {
  // Input mode: vehicle battery SoC vs manual kWh
  const [inputMode, setInputMode] = useState<'soc' | 'manual'>('soc');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('car-nexon');
  const [batteryCapacityKwh, setBatteryCapacityKwh] = useState<number>(40.5);
  const [currentSocPercent, setCurrentSocPercent] = useState<number>(20);
  const [targetSocPercent, setTargetSocPercent] = useState<number>(80);

  const [manualEnergyKwh, setManualEnergyKwh] = useState<number>(30);
  const [electricityTariff, setElectricityTariff] = useState<number>(0.18);
  const [isVerifiedPrice, setIsVerifiedPrice] = useState<boolean>(false);
  const [efficiencyPercent, setEfficiencyPercent] = useState<number>(90);
  const [sessionFee, setSessionFee] = useState<number>(1.0);
  const [parkingFeePerHour, setParkingFeePerHour] = useState<number>(0.5);
  const [chargingDurationHours, setChargingDurationHours] = useState<number>(2.0);

  // Compute required energy
  const requiredEnergyKwh =
    inputMode === 'soc'
      ? Number(
          (batteryCapacityKwh * (Math.max(0, targetSocPercent - currentSocPercent) / 100.0)).toFixed(1)
        )
      : manualEnergyKwh;

  const result = calculateDetailedChargingCost({
    requiredEnergyKwh,
    electricityTariffPerKwh: electricityTariff,
    chargingEfficiencyPercent: efficiencyPercent,
    sessionFee,
    parkingFeePerHour,
    chargingDurationHours,
  });

  const handleVehicleChange = (id: string) => {
    setSelectedVehicleId(id);
    const v = VEHICLE_PRESETS.find((p: VehicleProfile) => p.id === id);
    if (v) {
      setBatteryCapacityKwh(v.batteryCapacityKwh);
    }
  };

  // Preset comparative tariff scenarios
  const scenarios = [
    {
      name: 'ChargeSmart Solar Soak (12-2 PM)',
      tariff: 0.10,
      fee: 0,
      desc: 'Midday solar generation abundance',
      badge: 'Lowest Cost',
      verified: true,
    },
    {
      name: 'Residential Overnight Wind',
      tariff: 0.12,
      fee: 0,
      desc: 'Off-peak scheduled home charging',
      badge: 'Economical',
      verified: true,
    },
    {
      name: 'Standard Flat Grid Tariff',
      tariff: 0.18,
      fee: 0.5,
      desc: 'Average utility benchmark rate',
      badge: 'Benchmark',
      verified: false,
    },
    {
      name: 'Commercial Evening Peak (6-9 PM)',
      tariff: 0.34,
      fee: 2.0,
      desc: 'Heavy fossil peaker surcharge',
      badge: 'Avoid Peak',
      verified: true,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
          Wall-to-Battery Transparency
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2">
          EV Charging Cost Calculator
        </h2>
        <p className="text-sm sm:text-base text-slate-600 mt-2">
          Calculate actual electricity expenses factoring in wall conversion efficiency losses, multi-tariff time slots, and auxiliary bay fees.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* Controls Column (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-200 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-600" /> Session Inputs
            </h3>

            {/* Input Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setInputMode('soc')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  inputMode === 'soc'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Battery SoC Mode
              </button>
              <button
                type="button"
                onClick={() => setInputMode('manual')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  inputMode === 'manual'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Manual Energy (kWh)
              </button>
            </div>
          </div>

          {/* Mode 1: Battery SoC Inputs */}
          {inputMode === 'soc' ? (
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-4">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-slate-800">Vehicle & Battery Profile</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Vehicle Preset</label>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => handleVehicleChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
                  >
                    {VEHICLE_PRESETS.map((v: VehicleProfile) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.batteryCapacityKwh} kWh)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Battery Capacity (kWh)</label>
                  <input
                    type="number"
                    min="5"
                    max="200"
                    step="0.5"
                    value={batteryCapacityKwh}
                    onChange={(e) => setBatteryCapacityKwh(parseFloat(e.target.value) || 40)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 bg-white"
                  />
                </div>
              </div>

              {/* SoC Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-bold text-slate-700">Current Battery</span>
                    <span className="font-mono font-bold text-slate-900">{currentSocPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={Math.min(95, targetSocPercent - 1)}
                    value={currentSocPercent}
                    onChange={(e) => setCurrentSocPercent(parseInt(e.target.value))}
                    className="w-full accent-slate-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-bold text-slate-700">Target Battery</span>
                    <span className="font-mono font-bold text-emerald-700">{targetSocPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min={Math.max(5, currentSocPercent + 1)}
                    max="100"
                    value={targetSocPercent}
                    onChange={(e) => setTargetSocPercent(parseInt(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>
              </div>

              <div className="text-[11px] text-emerald-800 font-medium bg-white p-2.5 rounded-xl border border-emerald-200 flex items-center justify-between">
                <span>Calculated Net Energy Required:</span>
                <strong className="font-mono text-sm font-black">{requiredEnergyKwh} kWh</strong>
              </div>
            </div>
          ) : (
            /* Mode 2: Direct Required Energy Slider */
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Energy Stored in Battery
                </label>
                <span className="font-mono text-base font-black text-emerald-700">
                  {requiredEnergyKwh} kWh
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="100"
                step="1"
                value={manualEnergyKwh}
                onChange={(e) => setManualEnergyKwh(parseFloat(e.target.value))}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>
          )}

          {/* Electricity Tariff */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span>Electricity Tariff Rate</span>
                {isVerifiedPrice ? (
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" /> Verified Station Price
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                    User Entered Estimate
                  </span>
                )}
              </label>
              <span className="font-mono text-base font-black text-amber-700">
                {currencySymbol}{electricityTariff.toFixed(2)} / kWh
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.60"
              step="0.01"
              value={electricityTariff}
              onChange={(e) => {
                setElectricityTariff(parseFloat(e.target.value));
                setIsVerifiedPrice(false);
              }}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Charging Efficiency */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <span>Charger Conversion Efficiency</span>
                <span title="Typical AC chargers are 88-92% efficient, DC fast chargers 92-95%">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                </span>
              </label>
              <span className="font-mono text-base font-black text-slate-800">
                {efficiencyPercent}%
              </span>
            </div>
            <input
              type="range"
              min="70"
              max="98"
              step="1"
              value={efficiencyPercent}
              onChange={(e) => setEfficiencyPercent(parseInt(e.target.value, 10))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-700"
            />
            <div className="text-[11px] text-slate-400 mt-1">
              {100 - efficiencyPercent}% loss is dissipated as heat during AC-to-DC rectification and battery cooling.
            </div>
          </div>

          {/* Additional Fees */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Station Session Fee ({currencySymbol})
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={sessionFee}
                onChange={(e) => setSessionFee(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Parking Fee / Hr ({currencySymbol})
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={parkingFeePerHour}
                onChange={(e) => setParkingFeePerHour(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Results Summary Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gradient-to-br from-forest via-[#0F4238] to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-500/20">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
              Total Cost Breakdown
            </span>

            <div className="my-5">
              <div className="text-xs text-slate-400 font-medium">Estimated Charging Total</div>
              <div className="text-4xl sm:text-5xl font-black text-emerald-300 font-mono tracking-tight mt-1">
                {currencySymbol}{result.totalEstimatedCost.toFixed(2)}
              </div>
              <div className="text-xs text-slate-300 mt-1">
                Effective price: <strong className="text-white font-mono">{currencySymbol}{result.effectiveCostPerKwhStored.toFixed(3)}</strong> / stored kWh
              </div>
            </div>

            {/* Step by Step Breakdown */}
            <div className="space-y-3 pt-4 border-t border-white/10 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>Net Battery Energy Needed</span>
                <span className="font-mono font-bold text-white">{result.energyStoredInBatteryKwh} kWh</span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1">
                  <span>Wall Supply Energy Drawn</span>
                  <span className="text-[10px] text-slate-400">({efficiencyPercent}% eff)</span>
                </span>
                <span className="font-mono font-bold text-emerald-400">{result.energyDrawnFromGridKwh} kWh</span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span>Rectification Energy Loss</span>
                <span className="font-mono font-bold text-rose-400">+{result.efficiencyLossKwh} kWh</span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span>Raw Electricity Cost</span>
                <span className="font-mono font-bold text-white">
                  {currencySymbol}{result.electricityEnergyCost.toFixed(2)}
                </span>
              </div>

              {(result.sessionFee > 0 || result.parkingFee > 0) && (
                <div className="flex justify-between items-center text-slate-300">
                  <span>Auxiliary (Session + Parking) Fees</span>
                  <span className="font-mono font-bold text-amber-300">
                    +{currencySymbol}{(result.sessionFee + result.parkingFee).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Comparative Tariff Scenarios */}
          <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-emerald-600" /> Compare Other Tariff Windows
            </h4>

            <div className="space-y-2.5">
              {scenarios.map((sc, i) => {
                const scCost = (requiredEnergyKwh / (efficiencyPercent / 100)) * sc.tariff + sc.fee;
                const isSelected = Math.abs(sc.tariff - electricityTariff) < 0.005;

                return (
                  <div
                    key={i}
                    onClick={() => {
                      setElectricityTariff(sc.tariff);
                      setIsVerifiedPrice(sc.verified);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{sc.name}</span>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                          {sc.badge}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {currencySymbol}{sc.tariff.toFixed(2)}/kWh • {sc.desc}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-black text-slate-900 text-sm">
                        {currencySymbol}{scCost.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-slate-400">Total</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
