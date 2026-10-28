import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { storageService } from '../../services/storageService';
import { generateHourlyGridForecast } from '../../data/mockData';
import { SavedPlan, HourlyGridPoint } from '../../types';
import { BarChart3, TrendingDown, Leaf, DollarSign, CalendarCheck } from 'lucide-react';

interface AnalyticsViewProps {
  currencySymbol: string;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ currencySymbol }) => {
  const [plans, setPlans] = useState<SavedPlan[]>(() => storageService.getSavedPlans());
  const [forecast] = useState<HourlyGridPoint[]>(() => generateHourlyGridForecast(24));

  useEffect(() => {
    const refresh = () => setPlans(storageService.getSavedPlans());
    window.addEventListener('chargesmart_data_updated', refresh);
    return () => window.removeEventListener('chargesmart_data_updated', refresh);
  }, []);

  // Aggregated totals
  const totalKwh = plans.reduce((acc, p) => acc + p.energyKwh, 0);
  const totalCost = plans.reduce((acc, p) => acc + p.cost, 0);
  const totalEmissionsKg = plans.reduce((acc, p) => acc + p.emissionsKg, 0);
  const avgGreenPct = plans.length > 0 ? Math.round(plans.reduce((acc, p) => acc + p.renewableShare, 0) / plans.length) : 0;

  // Chart data: Cost vs Renewable across 24h
  const hourlyCorrelations = forecast.map((f) => ({
    hour: f.timeLabel,
    tariff: f.gridTariff,
    renewablePct: f.renewableSharePercent,
    emissions: f.gridEmissionFactorKg,
  }));

  // Chart data from saved plans
  const planChartData = plans.map((p, i) => ({
    name: p.vehicleName.split(' ')[0] + ` #${i + 1}`,
    energyKwh: p.energyKwh,
    cost: p.cost,
    renewableShare: p.renewableShare,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
          Analytics & Insights
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2">
          Fleet & Grid Intelligence
        </h2>
        <p className="text-sm sm:text-base text-slate-600 mt-2">
          Track emissions avoidance, electricity cost distributions, and renewable correlation trends across scheduled sessions.
        </p>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" /> Total Energy Scheduled
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {totalKwh.toFixed(1)} <span className="text-xs font-normal text-slate-500">kWh</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{plans.length} total sessions tracked</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-amber-600" /> Total Charging Expense
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
            {currencySymbol}{totalCost.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Avg {currencySymbol}{plans.length > 0 ? (totalCost / plans.length).toFixed(2) : '0.00'} / session
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Leaf className="w-3.5 h-3.5 text-emerald-600" /> Avg Renewable Share
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
            {avgGreenPct}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Solar + Wind generation intake</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5 text-teal-600" /> Total Lifecycle CO₂e
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-800 font-mono">
            {totalEmissionsKg.toFixed(2)} <span className="text-xs font-normal text-slate-500">kg</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">vs ~48 kg on unmanaged grid</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Chart 1: Time of Day Cost vs Green Share Correlation */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-200">
          <div className="mb-4">
            <h3 className="font-bold text-slate-900 text-base">
              Time-of-Use Tariff vs. Renewable Share (24h)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Notice the inverse relationship: When renewable generation spikes, wholesale price plummets.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyCorrelations} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="renPctGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="#cbd5e1" />
                <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#cbd5e1" />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 0.40]}
                  tickFormatter={(v) => `${currencySymbol}${v.toFixed(2)}`}
                  tick={{ fontSize: 10 }}
                  stroke="#cbd5e1"
                />
                <Tooltip
                  formatter={(val: any, name: any) =>
                    name.includes('Tariff')
                      ? [`${currencySymbol}${Number(val).toFixed(2)} / kWh`, 'Tariff']
                      : [`${val}%`, 'Renewable Mix']
                  }
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="renewablePct"
                  name="Renewable Share (%)"
                  stroke="#10B981"
                  fill="url(#renPctGrad)"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="tariff"
                  name={`Tariff (${currencySymbol}/kWh)`}
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Saved Plans Energy & Cost Comparison */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-200">
          <div className="mb-4">
            <h3 className="font-bold text-slate-900 text-base">
              Energy Stored vs. Session Cost by Plan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparison across your saved charging sessions.
            </p>
          </div>

          <div className="h-64 w-full">
            {planChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={planChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#cbd5e1" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#cbd5e1" />
                  <Tooltip
                    formatter={(val: any, name: any) =>
                      name.includes('Cost')
                        ? [`${currencySymbol}${Number(val).toFixed(2)}`, 'Cost']
                        : [`${val} kWh`, 'Energy']
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="energyKwh" name="Energy (kWh)" fill="#0D9488" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cost" name={`Cost (${currencySymbol})`} fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No saved plans yet. Generate and save plans to view comparative charts.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
