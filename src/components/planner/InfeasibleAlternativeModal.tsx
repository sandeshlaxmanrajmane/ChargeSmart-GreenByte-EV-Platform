import React from 'react';
import { AlertTriangle, Lightbulb, Check, X, ArrowRight } from 'lucide-react';
import { RecommendationResponse, PlanInput } from '../../types';

interface InfeasibleAlternativeModalProps {
  result: RecommendationResponse;
  onApplyAdjustment: (adjusted: Partial<PlanInput>) => void;
  onClose: () => void;
}

export const InfeasibleAlternativeModal: React.FC<InfeasibleAlternativeModalProps> = ({
  result,
  onApplyAdjustment,
  onClose,
}) => {
  if (!result.isEntirelyInfeasible || !result.infeasibilitySummary) return null;

  const { primaryReason, suggestions } = result.infeasibilitySummary;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-rose-200 space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Schedule Constraint Alert</h3>
              <p className="text-xs text-rose-700 font-semibold">
                No charging window satisfies all specified limits
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary limitation explanation */}
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-xs sm:text-sm text-rose-900 leading-relaxed">
          <span className="font-bold">Constraint Conflict: </span>
          {primaryReason}
        </div>

        {/* Actionable Suggestions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>Recommended Practical Adjustments:</span>
          </div>

          <ul className="space-y-2 text-xs text-slate-600">
            {suggestions.map((sug, i) => (
              <li key={i} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <span>{sug}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Dismiss
          </button>

          <button
            onClick={() => {
              // Automatically relax constraints: e.g. lower desired charge or double power
              onApplyAdjustment({
                desiredBatteryPercent: Math.max(
                  result.input.currentBatteryPercent + 20,
                  Math.min(75, result.input.desiredBatteryPercent - 15)
                ),
                maxChargingPowerKw: Math.max(result.input.maxChargingPowerKw, 22.0),
              });
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
          >
            <span>Auto-Relax Target & Power</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
