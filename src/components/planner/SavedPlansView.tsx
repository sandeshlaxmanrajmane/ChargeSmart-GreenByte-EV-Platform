import React, { useState, useEffect } from 'react';
import { SavedPlan } from '../../types';
import { storageService } from '../../services/storageService';
import { showToast } from '../common/Toast';
import {
  CalendarClock,
  Zap,
  Leaf,
  DollarSign,
  TrendingDown,
  Trash2,
  Edit3,
  Download,
  RotateCw,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  MapPin,
  X,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface SavedPlansViewProps {
  currencySymbol: string;
  setActiveTab: (tab: string) => void;
  onRecalculatePlan?: (plan: SavedPlan) => void;
}

export const SavedPlansView: React.FC<SavedPlansViewProps> = ({
  currencySymbol,
  setActiveTab,
  onRecalculatePlan,
}) => {
  const [plans, setPlans] = useState<SavedPlan[]>(() => storageService.getSavedPlans());
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPlan, setEditingPlan] = useState<SavedPlan | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState<'scheduled' | 'charging' | 'completed'>('scheduled');

  useEffect(() => {
    const handleUpdate = () => {
      setPlans(storageService.getSavedPlans());
    };
    window.addEventListener('chargesmart_data_updated', handleUpdate);
    return () => window.removeEventListener('chargesmart_data_updated', handleUpdate);
  }, []);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete charging plan for "${name}"?`)) {
      storageService.deletePlan(id);
      showToast('info', 'Plan Deleted', `Deleted plan for ${name}.`);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all saved charging plans?')) {
      storageService.clearAllPlans();
      showToast('info', 'All Plans Cleared', 'All saved charging sessions removed.');
    }
  };

  const handleOpenEdit = (plan: SavedPlan) => {
    setEditingPlan(plan);
    setEditNotes(plan.notes || '');
    setEditStatus(plan.status);
  };

  const handleSaveEdit = () => {
    if (!editingPlan) return;
    storageService.updatePlan(editingPlan.id, {
      notes: editNotes,
      status: editStatus,
    });
    setEditingPlan(null);
    showToast('success', 'Plan Updated', 'Plan notes and status updated successfully.');
  };

  const handleRecalculate = (plan: SavedPlan) => {
    if (onRecalculatePlan) {
      onRecalculatePlan(plan);
    }
    setActiveTab('planner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('info', 'Recalculating', `Loaded ${plan.vehicleName} into Smart Planner for today's grid.`);
  };

  const filteredPlans = plans.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.vehicleName.toLowerCase().includes(q) ||
      p.locationName.toLowerCase().includes(q) ||
      (p.notes && p.notes.toLowerCase().includes(q)) ||
      p.priority.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-0.5 rounded-full border border-emerald-300">
              Personal Charging Itinerary
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Zero Login Required • HTML5 LocalStorage & SQLite
            </span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
            Saved Charging Schedules
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            View, modify, export, and recalculate your scheduled EV charging sessions.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            onClick={() => {
              setActiveTab('planner');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Plan</span>
          </button>

          {plans.length > 0 && (
            <>
              <button
                onClick={() => storageService.exportAllPlansAsJson()}
                className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 transition-colors shadow-xs flex items-center gap-1.5"
                title="Export all plans as JSON"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Export All</span>
              </button>

              <button
                onClick={handleClearAll}
                className="px-3 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 font-bold text-xs border border-rose-200 transition-colors shadow-xs"
                title="Clear all saved plans"
              >
                Clear All
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      {plans.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter saved plans by vehicle, location, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{filteredPlans.length}</strong> of{' '}
            <strong className="text-slate-900">{plans.length}</strong> saved plans
          </div>
        </div>
      )}

      {/* Empty State */}
      {plans.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CalendarClock className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Saved Plans Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Use the Smart Charging Planner to optimize your vehicle's charging window based on live solar, wind, and electricity tariffs, then save the schedule to track it here.
          </p>
          <button
            onClick={() => {
              setActiveTab('planner');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Launch Smart Planner</span>
          </button>
        </div>
      ) : (
        /* Plans Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlans.map((plan) => {
            const statusColor =
              plan.status === 'completed'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : plan.status === 'charging'
                ? 'bg-sky-100 text-sky-800 border-sky-300 animate-pulse'
                : 'bg-amber-100 text-amber-800 border-amber-300';

            return (
              <div
                key={plan.id}
                className="bg-white rounded-3xl p-6 shadow-card border border-slate-200 flex flex-col justify-between hover:border-emerald-300 transition-all group"
              >
                <div>
                  {/* Top Bar: Vehicle & Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {plan.priority.replace('_', ' ')}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${statusColor}`}
                    >
                      {plan.status}
                    </span>
                  </div>

                  {/* Vehicle Name */}
                  <h4 className="font-bold text-slate-900 text-base group-hover:text-emerald-800 transition-colors line-clamp-1">
                    {plan.vehicleName}
                  </h4>

                  {/* Location & Time */}
                  <div className="space-y-1 mt-2 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-700">
                        {plan.startTime} → {plan.endTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 line-clamp-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{plan.locationName}</span>
                    </div>
                  </div>

                  {/* Core Metrics: Energy, Cost, Renewable % */}
                  <div className="grid grid-cols-3 gap-2 my-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Energy</div>
                      <div className="font-mono font-bold text-slate-900 text-xs">
                        {plan.energyKwh} <span className="text-[10px] font-normal text-slate-500">kWh</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Cost</div>
                      <div className="font-mono font-bold text-emerald-700 text-xs">
                        {plan.currency}{plan.cost.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Clean %</div>
                      <div className="font-mono font-bold text-emerald-600 text-xs">
                        {plan.renewableShare}%
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {plan.notes && (
                    <p className="text-[11px] text-slate-500 italic bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100 mb-3">
                      "{plan.notes}"
                    </p>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleRecalculate(plan)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] transition-colors flex items-center gap-1 border border-emerald-200"
                      title="Recalculate plan with today's live grid"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>Recalculate</span>
                    </button>
                    <button
                      onClick={() => handleOpenEdit(plan)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      title="Edit Plan"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => storageService.exportPlanAsJson(plan)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      title="Export Plan JSON"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleDelete(plan.id, plan.vehicleName)}
                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                    title="Delete Plan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-600" />
                <span>Edit Charging Plan</span>
              </h3>
              <button
                onClick={() => setEditingPlan(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Vehicle</label>
                <div className="font-semibold text-slate-900 p-2.5 rounded-xl bg-slate-100">
                  {editingPlan.vehicleName}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="charging">Charging In Progress</option>
                  <option value="completed">Completed Session</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes / Reminders</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add notes about charger bay, solar absorption, or departure reminders..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditingPlan(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
