import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { HourlyGridPoint } from '../../types';
import { generateHourlyGridForecast } from '../../data/mockData';
import { Sun, Wind, DollarSign, Activity } from 'lucide-react';

interface EnergyGridChartProps {
  currencySymbol: string;
}

export const EnergyGridChart: React.FC<EnergyGridChartProps> = ({ currencySymbol }) => {
  const [data] = useState<HourlyGridPoint[]>(() => generateHourlyGridForecast(24));
  const [activeMetric, setActiveMetric] = useState<'all' | 'renewable' | 'tariff'>('all');

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Grid Forecasting Engine
            </span>
            <span className="text-xs text-slate-400">24-Hour Lookahead</span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">
            Renewable Generation vs. Dynamic Tariff Profile
          </h3>
          <p className="text-xs sm:text-sm text-slate-500">
            Midday solar peaks correlate with reduced wholesale rates, presenting prime EV charging windows.
          </p>
        </div>

        {/* View toggles */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
          <button
            onClick={() => setActiveMetric('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeMetric === 'all' ? 'bg-white text-emerald-800 shadow-xs font-bold' : ''
            }`}
          >
            All Curves
          </button>
          <button
            onClick={() => setActiveMetric('renewable')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeMetric === 'renewable' ? 'bg-white text-emerald-800 shadow-xs font-bold' : ''
            }`}
          >
            Clean Share %
          </button>
          <button
            onClick={() => setActiveMetric('tariff')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeMetric === 'tariff' ? 'bg-white text-emerald-800 shadow-xs font-bold' : ''
            }`}
          >
            Price ({currencySymbol}/kWh)
          </button>
        </div>
      </div>

      {/* Recharts Container */}
      <div className="h-72 sm:h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="windGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284C7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="renShareGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="timeLabel" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
            <YAxis
              yAxisId="power"
              orientation="left"
              tick={{ fontSize: 11, fill: '#64748b' }}
              stroke="#cbd5e1"
              domain={[0, 600]}
              label={{ value: 'Generation (MW)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }}
            />
            <YAxis
              yAxisId="tariff"
              orientation="right"
              tick={{ fontSize: 11, fill: '#64748b' }}
              stroke="#cbd5e1"
              domain={[0, 0.40]}
              tickFormatter={(v) => `${currencySymbol}${v.toFixed(2)}`}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload as HourlyGridPoint;
                  return (
                    <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5">
                      <div className="font-bold text-sm text-emerald-300 border-b border-slate-700 pb-1">
                        Time: {label}
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1 text-amber-300">
                          <Sun className="w-3 h-3" /> Solar Generation:
                        </span>
                        <span className="font-mono font-bold">{pt.solarGenerationMw} MW</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1 text-sky-300">
                          <Wind className="w-3 h-3" /> Wind Generation:
                        </span>
                        <span className="font-mono font-bold">{pt.windGenerationMw} MW</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1 text-emerald-300">
                          <Activity className="w-3 h-3" /> Clean Share:
                        </span>
                        <span className="font-mono font-bold">{pt.renewableSharePercent}%</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-700">
                        <span className="flex items-center gap-1 text-slate-300">
                          <DollarSign className="w-3 h-3" /> Grid Tariff:
                        </span>
                        <span className="font-mono font-bold text-amber-400">
                          {currencySymbol}{pt.gridTariff.toFixed(2)} / kWh
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Carbon: {pt.gridEmissionFactorKg} kg CO₂e/kWh
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />

            {(activeMetric === 'all' || activeMetric === 'renewable') && (
              <>
                <Area
                  yAxisId="power"
                  type="monotone"
                  dataKey="solarGenerationMw"
                  name="Solar (MW)"
                  stroke="#F59E0B"
                  fill="url(#solarGrad)"
                  strokeWidth={2}
                />
                <Area
                  yAxisId="power"
                  type="monotone"
                  dataKey="windGenerationMw"
                  name="Wind (MW)"
                  stroke="#0284C7"
                  fill="url(#windGrad)"
                  strokeWidth={2}
                />
              </>
            )}

            {(activeMetric === 'all' || activeMetric === 'tariff') && (
              <Line
                yAxisId="tariff"
                type="stepAfter"
                dataKey="gridTariff"
                name={`Dynamic Tariff (${currencySymbol}/kWh)`}
                stroke="#E11D48"
                strokeWidth={2.5}
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          <span>Prime Charging Window: <strong>11:00 AM — 02:30 PM</strong> (High solar irradiance, low TOU tariff)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
          <span>Peak Grid Strain: <strong>06:00 PM — 09:30 PM</strong> (Fossil peakers active)</span>
        </div>
      </div>
    </div>
  );
};
