import React, { useState } from 'react';
import { calculateDetailedChargingCost } from '../../services/calculatorService';
import { DollarSign, Zap, HelpCircle, ArrowRight, ShieldCheck, Scale } from 'lucide-react';

interface CostCalculatorViewProps {
  currencySymbol: string;
}

export const CostCalculatorView: React.FC<CostCalculatorViewProps> = ({ currencySymbol }) => {
  const [requiredEnergyKwh, setRequiredEnergyKwh] = useState<number>(30);
  const [electricityTariff, setElectricityTariff] = useState<number>(0.18);
  const [efficiencyPercent, setEfficiencyPercent] = useState<number>(90);
  const [sessionFee, setSessionFee] = useState<number>(1.0);
  const [parkingFeePerHour, setParkingFeePerHour] = useState<number>(0.5);
  const [chargingDurationHours, setChargingDurationHours] = useState<number>(2.0);

  const result = calculateDetailedChargingCost({
    requiredEnergyKwh,
    electricityTariffPerKwh: electricityTariff,
    chargingEfficiencyPercent: efficiencyPercent,
    sessionFee,
    parkingFeePerHour,
    chargingDurationHours,
  });

  // Preset comparative tariff scenarios
  const scenarios = [
    {
      name: 'ChargeSmart Solar Soak (12-2 PM)',
      tariff: 0.10,
      fee: 0,
      desc: 'Midday solar generation surplus',
      badge: 'Recommended',
    },
    {
      name: 'Residential Overnight Wind',
      tariff: 0.12,
      fee: 0,
      desc: 'Off-peak scheduled home charging',
      badge: 'Economical',
    },
    {
      name: 'Standard Flat Grid Tariff',
      tariff: 0.18,
      fee: 0.5,
      desc: 'Average daytime residential rate',
      badge: 'Average',
    },
    {
      name: 'Commercial Evening Peak (6-9 PM)',
      tariff: 0.34,
      fee: 2.0,
      desc: 'Heavy grid peaker surcharge',
      badge: 'Expensive',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
          Wall-to-Battery Transparency
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2">
          EV Charging Cost Calculator
        </h2>
        <p className="text-sm sm:text-base text-slate-600 mt-2">
          Calculate actual energy bills by factoring in charger efficiency losses, auxiliary fees, and multi-tariff variations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* Controls Column (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-200 space-y-6">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-600" /> Session Inputs
          </h3>

          {/* Required Energy */}
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
              value={requiredEnergyKwh}
              onChange={(e) => setRequiredEnergyKwh(parseFloat(e.target.value))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
          </div>

          {/* Electricity Tariff */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Electricity Tariff Rate
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
              onChange={(e) => setElectricityTariff(parseFloat(e.target.value))}
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
              {100 - efficiencyPercent}% loss is dissipated as heat during AC-to-DC rectification.
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

        {/* Results Column (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-emerald-900 via-forest to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30">
                Calculated Supply Cost
              </span>
              <div className="text-4xl sm:text-5xl font-black font-mono text-white mt-3">
                {currencySymbol}{result.totalEstimatedCost.toFixed(2)}
              </div>
              <div className="text-xs text-slate-300 mt-1">
                Effective cost per kWh in battery:{' '}
                <strong className="text-emerald-300 font-mono">
                  {currencySymbol}{result.effectiveCostPerKwhStored.toFixed(3)}/kWh
                </strong>
              </div>
            </div>

            {/* Line-item breakdown */}
            <div className="space-y-3 pt-4 border-t border-emerald-500/20 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>Stored in Battery:</span>
                <span className="font-mono font-bold text-white">{result.energyStoredInBatteryKwh} kWh</span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span>Drawn from Grid ({result.efficiencyLossPercent}% loss):</span>
                <span className="font-mono font-bold text-emerald-400">{result.energyDrawnFromGridKwh} kWh</span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span>Electricity Commodity Cost:</span>
                <span className="font-mono font-bold text-white">
                  {currencySymbol}{result.electricityEnergyCost.toFixed(2)}
                </span>
              </div>

              {result.sessionFee > 0 && (
                <div className="flex justify-between items-center text-slate-300">
                  <span>Session Initiation Fee:</span>
                  <span className="font-mono font-bold text-white">
                    {currencySymbol}{result.sessionFee.toFixed(2)}
                  </span>
                </div>
              )}

              {result.parkingFee > 0 && (
                <div className="flex justify-between items-center text-slate-300">
                  <span>Parking Surcharge ({chargingDurationHours}h):</span>
                  <span className="font-mono font-bold text-white">
                    {currencySymbol}{result.parkingFee.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-emerald-500/20 text-[11px] text-slate-400 leading-relaxed">
            Formula: Total Cost = ((Energy Stored / Efficiency) × Tariff) + Session Fee + Parking Fee.
          </div>
        </div>
      </div>

      {/* Comparative Tariffs Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
          <Scale className="w-5 h-5 text-emerald-600" /> Multi-Tariff Scenario Comparison
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          See how your {requiredEnergyKwh} kWh charging session costs under different grid conditions.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {scenarios.map((sc, i) => {
            const scResult = calculateDetailedChargingCost({
              requiredEnergyKwh,
              electricityTariffPerKwh: sc.tariff,
              chargingEfficiencyPercent: efficiencyPercent,
              sessionFee: sc.fee,
              parkingFeePerHour: 0,
              chargingDurationHours,
            });

            const diff = scResult.totalEstimatedCost - result.totalEstimatedCost;

            return (
              <div
                key={i}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {sc.badge}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {currencySymbol}{sc.tariff.toFixed(2)}/kWh
                    </span>
                  </div>

                  <div className="font-bold text-slate-900 text-sm">{sc.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{sc.desc}</div>

                  <div className="text-2xl font-black text-slate-900 font-mono my-3">
                    {currencySymbol}{scResult.totalEstimatedCost.toFixed(2)}
                  </div>
                </div>

                <div className="text-[11px] pt-2 border-t border-slate-200">
                  <span className="text-slate-400">Difference: </span>
                  <span
                    className={`font-bold ${
                      diff < 0 ? 'text-emerald-700' : diff === 0 ? 'text-slate-600' : 'text-rose-600'
                    }`}
                  >
                    {diff < 0
                      ? `-${currencySymbol}${Math.abs(diff).toFixed(2)}`
                      : diff === 0
                      ? 'Baseline (Current)'
                      : `+${currencySymbol}${diff.toFixed(2)}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
