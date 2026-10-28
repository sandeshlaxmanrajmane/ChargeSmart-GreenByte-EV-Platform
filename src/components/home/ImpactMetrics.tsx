import React from 'react';
import { TrendingDown, Zap, Trees, ShieldCheck } from 'lucide-react';

export const ImpactMetrics: React.FC = () => {
  const stats = [
    {
      value: '46.4%',
      label: 'Average Charging Cost Reduction',
      sub: 'via solar soak & off-peak overnight synchronization',
      icon: TrendingDown,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      value: '84.2%',
      label: 'Peak Renewable Energy Utilization',
      sub: 'maximizing direct solar canopy & wind farm absorption',
      icon: Zap,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
    },
    {
      value: '1.82M kg',
      label: 'Simulated CO₂e Emissions Avoided',
      sub: 'calculated via full lifecycle assessment formulas',
      icon: Trees,
      color: 'text-teal-700 bg-teal-50 border-teal-200',
    },
    {
      value: '99.8%',
      label: 'Deadline Delivery Reliability',
      sub: 'hard algorithmic boundary preventing uncharged departures',
      icon: ShieldCheck,
      color: 'text-sky-700 bg-sky-50 border-sky-200',
    },
  ];

  return (
    <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-card border border-emerald-950/10 mb-16">
      <div className="text-center max-w-xl mx-auto mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
          Clean Mobility Impact
        </span>
        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
          Measured System Performance
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Benchmark comparison across 10,000 simulated smart-scheduled EV sessions.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl border ${s.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div>
                <div className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                  {s.value}
                </div>
                <div className="text-xs font-bold text-slate-800 mt-1">{s.label}</div>
                <div className="text-[11px] text-slate-500 mt-1 leading-normal">{s.sub}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
