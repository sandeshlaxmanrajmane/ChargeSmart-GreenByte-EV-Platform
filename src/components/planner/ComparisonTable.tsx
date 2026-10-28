import React from 'react';
import { RecommendationResponse, ChargingWindowCandidate } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import {
  Clock,
  DollarSign,
  Leaf,
  Sparkles,
  Check,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

interface ComparisonTableProps {
  result: RecommendationResponse;
  currencySymbol: string;
  onSelectOption: (option: ChargingWindowCandidate) => void;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  result,
  currencySymbol,
  onSelectOption,
}) => {
  const { asap, lowestCost, highestRenewable, selectedPriority } = result.comparisonOptions;

  const cards = [
    {
      title: 'Fastest / ASAP',
      subtitle: 'Earliest feasible charge',
      icon: Clock,
      cand: asap,
      theme: 'border-sky-300 bg-sky-50/40 text-sky-900',
      badge: 'bg-sky-100 text-sky-800',
    },
    {
      title: 'Lowest Cost Window',
      subtitle: 'Minimum electricity cost',
      icon: DollarSign,
      cand: lowestCost,
      theme: 'border-amber-300 bg-amber-50/40 text-amber-900',
      badge: 'bg-amber-100 text-amber-800',
    },
    {
      title: 'Highest Renewable Share',
      subtitle: 'Maximum solar & wind energy',
      icon: Leaf,
      cand: highestRenewable,
      theme: 'border-teal-300 bg-teal-50/40 text-teal-900',
      badge: 'bg-teal-100 text-teal-800',
    },
    {
      title: 'ChargeSmart Recommended',
      subtitle: 'Optimized for your priority',
      icon: Sparkles,
      cand: selectedPriority,
      theme: 'border-emerald-400 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/30',
      badge: 'bg-emerald-600 text-white font-bold',
      isPrimary: true,
    },
  ];

  const baselineCost = asap ? asap.totalCost : 0;
  const baselineEmissions = asap ? asap.totalEmissionsKg : 0;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-200 mt-8">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Trade-Off Matrix
          </span>
          <span className="text-xs text-slate-400">Baseline = Immediate Start</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
          Candidate Schedules Comparison
        </h3>
        <p className="text-xs sm:text-sm text-slate-500">
          Compare key feasible alternatives against the baseline of charging immediately.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => {
          const c = card.cand;
          const Icon = card.icon;

          if (!c) {
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-400 flex flex-col justify-center items-center text-center"
              >
                <AlertTriangle className="w-6 h-6 mb-2 text-slate-300" />
                <div className="font-bold text-xs">{card.title}</div>
                <div className="text-[11px] mt-1">Infeasible under constraints</div>
              </div>
            );
          }

          const costDiff = c.totalCost - baselineCost;
          const emDiff = c.totalEmissionsKg - baselineEmissions;

          return (
            <div
              key={idx}
              className={`rounded-2xl p-5 border flex flex-col justify-between transition-all ${card.theme} ${
                card.isPrimary ? 'shadow-md scale-[1.01]' : 'hover:shadow-sm'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${card.badge}`}>
                    {card.title}
                  </span>
                  <Icon className="w-4 h-4" />
                </div>

                {/* Scheduled Times */}
                <div className="font-mono font-bold text-sm text-slate-900">
                  {c.startTimeFormatted}
                </div>
                <div className="text-[11px] text-slate-500 mb-3">
                  until {c.endTimeFormatted} ({c.durationHours}h)
                </div>

                {/* Key KPIs */}
                <div className="space-y-2 py-3 border-y border-slate-200/60 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Total Cost:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {currencySymbol}{c.totalCost.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Clean Mix:</span>
                    <span className="font-bold text-emerald-700">
                      {c.avgRenewablePercent}% Green
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Emissions:</span>
                    <span className="font-mono text-slate-700">
                      {c.totalEmissionsKg} kg CO₂e
                    </span>
                  </div>
                </div>

                {/* Baseline Delta Badge */}
                <div className="mt-3 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cost vs Baseline:</span>
                    <span
                      className={`font-semibold ${
                        costDiff < 0
                          ? 'text-emerald-700 font-bold'
                          : costDiff === 0
                          ? 'text-slate-500'
                          : 'text-rose-600'
                      }`}
                    >
                      {costDiff < 0
                        ? `-${currencySymbol}${Math.abs(costDiff).toFixed(2)}`
                        : costDiff === 0
                        ? 'Baseline (0)'
                        : `+${currencySymbol}${costDiff.toFixed(2)}`}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">CO₂e vs Baseline:</span>
                    <span
                      className={`font-semibold ${
                        emDiff < 0
                          ? 'text-emerald-700 font-bold'
                          : emDiff === 0
                          ? 'text-slate-500'
                          : 'text-rose-600'
                      }`}
                    >
                      {emDiff < 0
                        ? `-${Math.abs(emDiff).toFixed(2)} kg`
                        : emDiff === 0
                        ? 'Baseline (0)'
                        : `+${emDiff.toFixed(2)} kg`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onSelectOption(c)}
                className={`mt-4 w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  c.isRecommended
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
                }`}
              >
                <span>{c.isRecommended ? 'Selected Option' : 'Switch to this Plan'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
