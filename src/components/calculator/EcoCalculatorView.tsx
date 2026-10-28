import React, { useState } from 'react';
import { calculateDetailedEnvironmentalImpact } from '../../services/calculatorService';
import { Leaf, Trees, Fuel, ShieldCheck, HelpCircle, ArrowRight, Zap, Info } from 'lucide-react';

export const EcoCalculatorView: React.FC = () => {
  const [energyDrawnKwh, setEnergyDrawnKwh] = useState<number>(35);
  const [renewableSharePercent, setRenewableSharePercent] = useState<number>(85);
  const [gridEmissionFactor, setGridEmissionFactor] = useState<number>(0.72); // coal/gas mix
  const [renewableLifecycleFactor, setRenewableLifecycleFactor] = useState<number>(0.04); // PV & wind lifecycle

  const result = calculateDetailedEnvironmentalImpact({
    energyDrawnKwh,
    renewableSharePercent,
    gridEmissionFactorKgPerKwh: gridEmissionFactor,
    renewableLifecycleEmissionKgPerKwh: renewableLifecycleFactor,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
          Lifecycle Assessment (LCA)
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2">
          Environmental Impact & CO₂e Calculator
        </h2>
        <p className="text-sm sm:text-base text-slate-600 mt-2">
          Transparent greenhouse gas calculations based on ISO-aligned lifecycle accounting — comparing smart clean charging against standard thermal grids and petrol combustion engines.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* Sliders Column (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-200 space-y-6">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Leaf className="w-5 h-5 text-emerald-600" /> Emission Parameters
          </h3>

          {/* Energy Drawn */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Electricity Consumed from Supply
              </label>
              <span className="font-mono text-base font-black text-emerald-700">
                {energyDrawnKwh} kWh
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="120"
              step="1"
              value={energyDrawnKwh}
              onChange={(e) => setEnergyDrawnKwh(parseFloat(e.target.value))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
          </div>

          {/* Renewable Share */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Renewable Energy Mix (Solar & Wind)
              </label>
              <span className="font-mono text-base font-black text-emerald-600">
                {renewableSharePercent}% Clean
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={renewableSharePercent}
              onChange={(e) => setRenewableSharePercent(parseInt(e.target.value, 10))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>0% (100% Thermal Coal/Gas)</span>
              <span>50% (National Avg)</span>
              <span>100% (Pure Solar/Wind)</span>
            </div>
          </div>

          {/* Grid Emission Factor */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <span>Baseline Grid Carbon Factor</span>
                <span title="Average CO2 intensity of regional thermal coal and natural gas grid">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                </span>
              </label>
              <span className="font-mono text-base font-black text-slate-800">
                {gridEmissionFactor.toFixed(2)} kg CO₂e / kWh
              </span>
            </div>
            <input
              type="range"
              min="0.40"
              max="0.95"
              step="0.02"
              value={gridEmissionFactor}
              onChange={(e) => setGridEmissionFactor(parseFloat(e.target.value))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-700"
            />
          </div>

          {/* Renewable Lifecycle Factor */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <span>Solar/Wind Lifecycle Embodied Footprint</span>
                <span title="Emissions from manufacturing silicon, copper, glass, and steel over 25-year operational life">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                </span>
              </label>
              <span className="font-mono text-base font-black text-slate-800">
                {renewableLifecycleFactor.toFixed(3)} kg CO₂e / kWh
              </span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.08"
              step="0.005"
              value={renewableLifecycleFactor}
              onChange={(e) => setRenewableLifecycleFactor(parseFloat(e.target.value))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-700"
            />
          </div>
        </div>

        {/* Results Column (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-forest via-[#0A3B30] to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30">
                Estimated Session Footprint
              </span>
              <div className="text-4xl sm:text-5xl font-black font-mono text-white mt-3">
                {result.estimatedSessionEmissionsKg} <span className="text-xl text-slate-300">kg CO₂e</span>
              </div>
              <div className="text-xs text-slate-300 mt-1">
                Unoptimized thermal grid baseline:{' '}
                <strong className="text-slate-200 font-mono">
                  {result.unoptimizedGridEmissionsKg} kg CO₂e
                </strong>
              </div>
            </div>

            {/* Environmental Equivalents */}
            <div className="space-y-3 pt-4 border-t border-emerald-500/20 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/10 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-emerald-400" />
                  <span>Emissions Avoided vs Thermal Grid:</span>
                </div>
                <span className="font-mono font-bold text-emerald-300">
                  {result.emissionsAvoidedVsStandardGridKg} kg CO₂e
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/10 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-amber-400" />
                  <span>Displaced Gasoline Equivalent:</span>
                </div>
                <span className="font-mono font-bold text-amber-300">
                  ~{result.gasolineLitersEquivalentAvoided} Liters
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/10 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <Trees className="w-4 h-4 text-emerald-400" />
                  <span>Annual Tree Sequestration:</span>
                </div>
                <span className="font-mono font-bold text-emerald-300">
                  ~{result.equivalentTreesPlantedYears} Tree-Years
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-emerald-500/20 text-[11px] text-slate-400 leading-relaxed">
            Note: 100% renewable electricity is not counted as zero-impact. Lifecycle manufacturing footprints are preserved in accordance with ISO 14044.
          </div>
        </div>
      </div>

      {/* Methodology and Explanations Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-200 space-y-4">
        <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Info className="w-5 h-5 text-emerald-600" /> Methodology & Accounting Principles
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <strong className="text-slate-900 block mb-1">Time-Varying Marginal Grid Emissions</strong>
            Grid electricity emissions fluctuate throughout the day. When user demand surges during evening peaks (6 PM - 9 PM), utilities activate rapid-start fossil peaking plants with emissions exceeding 0.78 kg CO₂e/kWh. Timing sessions into solar peak hours absorbs zero-marginal-cost renewable surplus.
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <strong className="text-slate-900 block mb-1">Lifecycle Renewable Transparency</strong>
            Unlike naive calculators that assume solar/wind is "0 grams CO₂", ChargeSmart accounts for cradle-to-gate photovoltaic cell and wind turbine manufacturing (~0.04 kg CO₂e/kWh) to ensure scientifically defensible figures for ideathon juries and environmental compliance.
          </div>
        </div>
      </div>
    </div>
  );
};
