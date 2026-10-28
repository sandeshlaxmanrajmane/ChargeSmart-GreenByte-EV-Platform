import React, { useState } from 'react';
import { Sun, Wind, DollarSign, CloudRain, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';

export const InteractiveEnergySlider: React.FC<{ currencySymbol: string }> = ({
  currencySymbol,
}) => {
  const [hour, setHour] = useState(13); // Default 1:00 PM (solar peak)

  // Calculate dynamic metrics for this hour
  const timeFormatted = `${hour % 12 === 0 ? 12 : hour % 12}:00 ${hour >= 12 ? 'PM' : 'AM'}`;

  // Solar curve
  let solar = 0;
  if (hour >= 6 && hour <= 18) {
    const dist = Math.abs(hour - 12.5);
    solar = Math.round(Math.max(0, Math.cos((dist / 6.5) * (Math.PI / 2)) * 420));
  }

  // Wind curve
  const wind = Math.round(130 + 75 * Math.sin((hour / 24) * 2 * Math.PI + 1.2));

  // Renewable share
  const totalRen = solar + wind;
  const demand = Math.round(520 + 220 * Math.sin(((hour - 8) / 24) * 2 * Math.PI));
  const renewablePct = Math.min(92, Math.max(22, Math.round((totalRen / (demand + totalRen * 0.3)) * 100)));

  // Tariff
  let tariff = 0.18;
  let statusBadge = 'Normal Tariff';
  let badgeColor = 'bg-slate-100 text-slate-800 border-slate-200';
  let verdictTitle = 'Standard Charging Window';
  let verdictDesc = 'Acceptable charging window with average grid emissions and standard tariff rates.';
  let verdictIcon = Zap;
  let verdictColor = 'border-slate-300 bg-slate-50 text-slate-700';

  if (hour >= 11 && hour <= 14) {
    tariff = 0.10;
    statusBadge = 'Solar Soak Discount (Best)';
    badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    verdictTitle = 'Optimal Green Charging Window';
    verdictDesc = 'Solar irradiance at maximum capacity! Absorbing excess clean energy prevents curtailment and slashes your charging cost by up to 55%.';
    verdictIcon = CheckCircle2;
    verdictColor = 'border-emerald-300 bg-emerald-50 text-emerald-900';
  } else if (hour >= 18 && hour <= 21) {
    tariff = 0.32;
    statusBadge = 'Evening Peak Tariff (Dirty Grid)';
    badgeColor = 'bg-rose-100 text-rose-800 border-rose-300';
    verdictTitle = 'Avoid Charging Now: Peak Emissions';
    verdictDesc = 'Evening peak grid strain: Coal and gas peaker plants are firing. Costs are 3.2x higher and emissions are over 0.76 kg CO₂e/kWh.';
    verdictIcon = AlertTriangle;
    verdictColor = 'border-rose-300 bg-rose-50 text-rose-900';
  } else if (hour >= 1 && hour <= 5) {
    tariff = 0.12;
    statusBadge = 'Overnight Wind Off-Peak';
    badgeColor = 'bg-sky-100 text-sky-800 border-sky-300';
    verdictTitle = 'Clean Wind Overnight Window';
    verdictDesc = 'High overnight wind generation with low city demand. Excellent time for scheduled residential charging.';
    verdictIcon = Wind;
    verdictColor = 'border-sky-300 bg-sky-50 text-sky-900';
  }

  const emissionFactor = Number(
    ((1 - renewablePct / 100) * 0.78 + (renewablePct / 100) * 0.04).toFixed(2)
  );

  const VerdictIconComponent = verdictIcon;

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-card border border-emerald-950/10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              Live Interactive Simulator
            </span>
            <span className="text-xs text-slate-400">Simulated 24-Hour Grid</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Renewable Energy & Tariff Synchronizer
          </h3>
          <p className="text-xs sm:text-sm text-slate-500">
            Slide through the day to see why timing your EV charge changes everything.
          </p>
        </div>

        {/* Selected Hour Pill */}
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-emerald-950">
          <span className="text-xs uppercase font-semibold text-emerald-700">Selected Hour:</span>
          <span className="text-lg font-extrabold font-mono text-emerald-900">{timeFormatted}</span>
        </div>
      </div>

      {/* Slider Control */}
      <div className="space-y-2 mb-8">
        <div className="flex justify-between text-xs font-semibold text-slate-500">
          <span>12 AM (Midnight)</span>
          <span>6 AM</span>
          <span className="text-emerald-700 font-bold">12 PM (Solar Peak)</span>
          <span className="text-rose-700 font-bold">6 PM (Peak)</span>
          <span>11 PM</span>
        </div>
        <input
          type="range"
          min="0"
          max="23"
          value={hour}
          onChange={(e) => setHour(parseInt(e.target.value, 10))}
          className="w-full h-3 bg-gradient-to-r from-sky-200 via-amber-200 to-rose-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-none"
        />
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>Wind Active</span>
          <span>Sunrise</span>
          <span className="text-amber-600 font-medium">Solar Abundance</span>
          <span className="text-rose-600 font-medium">Fossil Peakers</span>
          <span>Wind Ramp</span>
        </div>
      </div>

      {/* Grid of Dynamic Indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Renewable Share */}
        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 transition-all">
          <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold mb-1">
            <span>Renewable Share</span>
            <Sun className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-900">
            {renewablePct}%
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-medium">
            <span>Solar: {solar} MW</span> • <span>Wind: {wind} MW</span>
          </div>
        </div>

        {/* Dynamic Grid Tariff */}
        <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 transition-all">
          <div className="flex items-center justify-between text-xs text-amber-700 font-semibold mb-1">
            <span>Grid Tariff</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-900">
            {currencySymbol}{tariff.toFixed(2)}
            <span className="text-xs font-normal text-amber-700"> / kWh</span>
          </div>
          <div className="text-[11px] font-medium text-amber-800 mt-1">
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
              {statusBadge}
            </span>
          </div>
        </div>

        {/* Carbon Intensity */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-1">
            <span>Grid Carbon Intensity</span>
            <CloudRain className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {emissionFactor}
            <span className="text-xs font-normal text-slate-500"> kg/kWh</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {renewablePct > 65 ? 'Clean low-carbon mix' : 'High fossil thermal mix'}
          </div>
        </div>

        {/* Total Generation Capacity */}
        <div className="bg-teal-50/60 border border-teal-200/80 rounded-xl p-4 transition-all">
          <div className="flex items-center justify-between text-xs text-teal-700 font-semibold mb-1">
            <span>Clean Energy Flow</span>
            <Wind className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-teal-900">
            {totalRen}
            <span className="text-xs font-normal text-teal-700"> MW</span>
          </div>
          <div className="text-[11px] text-teal-700 mt-1">
            Demand: {demand} MW
          </div>
        </div>
      </div>

      {/* ChargeSmart Recommendation Output Banner */}
      <div className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${verdictColor}`}>
        <VerdictIconComponent className="w-6 h-6 shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-sm sm:text-base">{verdictTitle}</div>
          <div className="text-xs sm:text-sm mt-0.5 leading-relaxed">{verdictDesc}</div>
        </div>
      </div>
    </div>
  );
};
