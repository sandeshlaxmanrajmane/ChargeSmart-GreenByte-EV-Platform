import React, { useState, useEffect } from 'react';
import { SavedPlan } from '../../types';
import { storageService } from '../../services/storageService';
import { StatusBadge } from '../common/StatusBadge';
import { Download, Trash2, CalendarClock, ChevronRight, Car } from 'lucide-react';
import { showToast } from '../common/Toast';

interface RecentPlansWidgetProps {
  onPlanSelect?: (plan: SavedPlan) => void;
  onNavigateToPlanner: () => void;
}

export const RecentPlansWidget: React.FC<RecentPlansWidgetProps> = ({
  onPlanSelect,
  onNavigateToPlanner,
}) => {
  const [plans, setPlans] = useState<SavedPlan[]>(() => storageService.getSavedPlans());

  useEffect(() => {
    const refresh = () => setPlans(storageService.getSavedPlans());
    window.addEventListener('chargesmart_data_updated', refresh);
    return () => window.removeEventListener('chargesmart_data_updated', refresh);
  }, []);

  const handleDelete = (planId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    storageService.deletePlan(planId);
    showToast('info', 'Plan Deleted', 'The charging schedule has been removed from saved plans.');
  };

  const handleExport = (plan: SavedPlan, e: React.MouseEvent) => {
    e.stopPropagation();
    storageService.exportPlanAsJson(plan);
    showToast('success', 'Plan Exported', `Downloaded receipt for ${plan.vehicleName}.`);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Session Memory
            </span>
            <span className="text-xs text-slate-400">Locally Persisted</span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">
            Recent Charging Schedules
          </h3>
          <p className="text-xs text-slate-500">
            Smart plans saved to your browser storage.
          </p>
        </div>

        <button
          onClick={onNavigateToPlanner}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 transition-all shadow-xs"
        >
          <CalendarClock className="w-4 h-4 text-emerald-600" />
          <span>Generate New Plan</span>
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
          <CalendarClock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="font-bold text-slate-700 text-sm">No Saved Plans Yet</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Use the Smart Planner to calculate an optimal solar or off-peak charging schedule and save it here.
          </p>
          <button
            onClick={onNavigateToPlanner}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Open Smart Planner
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="pb-3 pl-2">Vehicle & Location</th>
                <th className="pb-3">Scheduled Window</th>
                <th className="pb-3">Energy</th>
                <th className="pb-3">Est. Cost</th>
                <th className="pb-3">Clean Mix</th>
                <th className="pb-3">Priority</th>
                <th className="pb-3 text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {plans.map((plan) => (
                <tr
                  key={plan.id}
                  onClick={() => onPlanSelect && onPlanSelect(plan)}
                  className="hover:bg-emerald-50/40 cursor-pointer transition-colors group"
                >
                  <td className="py-3 pl-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <Car className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                          {plan.vehicleName}
                        </div>
                        <div className="text-[10px] text-slate-400">{plan.locationName}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 text-slate-700 font-medium">
                    <div>{plan.startTime}</div>
                    <div className="text-[10px] text-slate-400">until {plan.endTime}</div>
                  </td>

                  <td className="py-3 font-mono font-bold text-slate-800">
                    {plan.energyKwh} kWh
                  </td>

                  <td className="py-3 font-mono font-bold text-emerald-700">
                    {plan.currency}{plan.cost.toFixed(2)}
                  </td>

                  <td className="py-3">
                    <StatusBadge type="renewable" value={plan.renewableShare} />
                  </td>

                  <td className="py-3">
                    <StatusBadge type="priority" value={plan.priority} />
                  </td>

                  <td className="py-3 pr-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => handleExport(plan, e)}
                        title="Download JSON receipt"
                        className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(plan.id, e)}
                        title="Delete plan"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
