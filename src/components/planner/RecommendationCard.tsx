import React from 'react';
import { RecommendationResponse, ChargingWindowCandidate } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import {
  CalendarClock,
  Zap,
  DollarSign,
  Leaf,
  CheckCircle2,
  Clock,
  Sparkles,
  BookmarkCheck,
  RotateCcw,
  TrendingDown,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface RecommendationCardProps {
  result: RecommendationResponse;
  currencySymbol: string;
  onSavePlan: (candidate: ChargingWindowCandidate) => void;
  onRecalculate: () => void;
  isSaved: boolean;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  result,
  currencySymbol,
  onSavePlan,
  onRecalculate,
  isSaved,
}) => {
  const plan = result.recommendedOption;
  if (!plan) return null;

  const isAsapWindow = plan.startHour === 0;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border-2 border-emerald-500/40 relative overflow-hidden">
      {/* Top green accent banner */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-forest" />

      {/* Header with Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pt-2">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border border-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>ChargeSmart Optimal Match</span>
            </span>
            <StatusBadge type="priority" value={result.input.priority} />
            {result.isEntirelyInfeasible && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Infeasible with Current Constraints
              </span>
            )}
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Recommended Charging Window
          </h3>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRecalculate}
            className="p-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors"
            title="Recalculate with adjusted parameters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSavePlan(plan)}
            disabled={isSaved}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
              isSaved
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-[1.02]'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>{isSaved ? 'Plan Saved!' : 'Save Plan'}</span>
          </button>
        </div>
      </div>

      {/* Key Hero Time Box */}
      <div className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white rounded-2xl p-5 border border-emerald-200/80 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Scheduled Session
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {plan.startTimeFormatted} <span className="text-emerald-600">→</span> {plan.endTimeFormatted}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Duration: <span className="font-bold text-slate-800">{plan.durationHours} hours</span> • Required Battery Energy:{' '}
              <span className="font-bold text-slate-800">{plan.requiredEnergyKwh} kWh</span> (drawn:{' '}
              <span className="font-mono text-emerald-700 font-semibold">{plan.energyDrawnKwh} kWh</span> from wall)
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-white px-4 py-2.5 rounded-xl border border-emerald-200 shadow-xs text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Est. Total Cost</div>
              <div className="text-2xl font-black text-emerald-700 font-mono">
                {currencySymbol}{plan.totalCost.toFixed(2)}
              </div>
            </div>

            <div className="bg-white px-4 py-2.5 rounded-xl border border-emerald-200 shadow-xs text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Clean Energy Share</div>
              <div className="text-2xl font-black text-emerald-600 font-mono">
                {plan.avgRenewablePercent}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row: Cost, Carbon, Duration, Feasibility */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Effective Tariff */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Average Tariff</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 font-mono">
            {currencySymbol}{plan.avgTariff.toFixed(3)}
            <span className="text-xs font-normal text-slate-500"> / kWh</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            vs peak rate {currencySymbol}0.32/kWh
          </div>
        </div>

        {/* Total Emissions */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Estimated Emissions</span>
            <Leaf className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 font-mono">
            {plan.totalEmissionsKg}
            <span className="text-xs font-normal text-slate-500"> kg CO₂e</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {plan.emissionsPerKwh} kg/kWh lifecycle
          </div>
        </div>

        {/* Budget Check */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Budget Status</span>
            <Zap className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
            {plan.withinBudget ? (
              <span className="text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Within Budget
              </span>
            ) : (
              <span className="text-rose-700 flex items-center gap-1">
                <AlertCircle className="w-4 h-4 text-rose-600" /> Exceeds Budget
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Max budget: {currencySymbol}{result.input.budgetMax?.toFixed(2) || 'None'}
          </div>
        </div>

        {/* Deadline Check */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Deadline Check</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
            {plan.completesBeforeDeadline ? (
              <span className="text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Deadline Met
              </span>
            ) : (
              <span className="text-rose-700 flex items-center gap-1">
                <AlertCircle className="w-4 h-4 text-rose-600" /> Violates Deadline
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Finishes before departure
          </div>
        </div>
      </div>

      {/* Savings vs Baseline Highlight */}
      {(result.baselineMetrics.costSavingsAmount > 0 || result.baselineMetrics.emissionsSavedKg > 0) && (
        <div className="p-4 rounded-2xl bg-emerald-900 text-white mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-800 text-emerald-300 border border-emerald-700">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm">Quantified Savings vs Immediate Peak Charging</div>
              <div className="text-xs text-slate-300">
                Optimization delta computed against charging immediately at peak tariff:
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            {result.baselineMetrics.costSavingsAmount > 0 && (
              <div className="bg-emerald-800/80 px-3 py-1.5 rounded-xl border border-emerald-700">
                <span className="text-emerald-300 block text-[10px] uppercase font-semibold">Cost Saved</span>
                <span className="text-white font-mono text-base">
                  {currencySymbol}{result.baselineMetrics.costSavingsAmount.toFixed(2)} ({result.baselineMetrics.costSavingsPercent}%)
                </span>
              </div>
            )}
            {result.baselineMetrics.emissionsSavedKg > 0 && (
              <div className="bg-emerald-800/80 px-3 py-1.5 rounded-xl border border-emerald-700">
                <span className="text-teal-300 block text-[10px] uppercase font-semibold">CO₂e Avoided</span>
                <span className="text-white font-mono text-base">
                  {result.baselineMetrics.emissionsSavedKg.toFixed(2)} kg ({result.baselineMetrics.emissionsSavedPercent}%)
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transparent Rationale Section */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>Why this option was selected (Multi-Objective Weights)</span>
        </h4>
        <ul className="space-y-1.5 text-xs text-slate-600">
          {result.explanation.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {/* Weight breakdown pill */}
        <div className="mt-3 pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex flex-wrap items-center gap-3">
          <span className="font-semibold text-slate-700">Scoring Weights Applied:</span>
          <span>Cost: <strong>{result.weightsUsed.cost * 100}%</strong></span>
          <span>Renewable: <strong>{result.weightsUsed.renewable * 100}%</strong></span>
          <span>Emissions: <strong>{result.weightsUsed.emissions * 100}%</strong></span>
          <span>Urgency: <strong>{result.weightsUsed.urgency * 100}%</strong></span>
        </div>
      </div>
    </div>
  );
};
