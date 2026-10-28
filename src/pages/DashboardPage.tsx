import React, { useState } from 'react';
import { ActiveSessionWidget } from '../components/dashboard/ActiveSessionWidget';
import { EnergyGridChart } from '../components/dashboard/EnergyGridChart';
import { RecentPlansWidget } from '../components/dashboard/RecentPlansWidget';
import { SavedPlan } from '../types';
import {
  CalendarClock,
  Zap,
  Leaf,
  DollarSign,
  TrendingDown,
  Info,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface DashboardPageProps {
  currencySymbol: string;
  setActiveTab: (tab: string) => void;
  onSelectPlanForInspection?: (plan: SavedPlan) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  currencySymbol,
  setActiveTab,
  onSelectPlanForInspection,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title & Simulation Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-0.5 rounded-full border border-emerald-300">
              Active Dashboard
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Simulation Mode: Deterministic Real-time Model
            </span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
            Smart Charging Command Center
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time status of scheduled vehicles, active solar absorption windows, and grid pricing forecasts.
          </p>
        </div>

        {/* Quick Action Button */}
        <button
          onClick={() => setActiveTab('planner')}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <CalendarClock className="w-4 h-4" />
          <span>New Charge Plan</span>
        </button>
      </div>

      {/* Simulated Live Notice Banner */}
      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Simulated Environment:</strong> Measurements and station states are simulated for demonstration at DSU Ideathon 2026. All algorithms and formulas run deterministically without fabricated telemetry.
          </span>
        </div>
      </div>

      {/* Active Session Monitor Widget */}
      <ActiveSessionWidget currencySymbol={currencySymbol} />

      {/* 24-Hour Energy Grid Forecasting Chart */}
      <EnergyGridChart currencySymbol={currencySymbol} />

      {/* Quick Insights Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Today's Optimal Window
            </span>
            <Leaf className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">11:30 AM — 02:00 PM</div>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            92% solar canopy capacity expected. Charging now minimizes wholesale carbon intensity to 0.18 kg CO₂e/kWh.
          </p>
          <button
            onClick={() => setActiveTab('planner')}
            className="mt-4 text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
          >
            <span>Schedule Session</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              Peak Tariff Alert
            </span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 font-mono">06:00 PM — 09:30 PM</div>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Evening grid peak: Rates surge to {currencySymbol}0.32/kWh and thermal gas peakers are dispatched. ChargeSmart pauses non-essential charging.
          </p>
          <button
            onClick={() => setActiveTab('cost-calc')}
            className="mt-4 text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1"
          >
            <span>Compare Tariffs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
              Overnight Wind Window
            </span>
            <Zap className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">01:00 AM — 04:30 AM</div>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            High baseload wind energy at reduced night rates ({currencySymbol}0.12/kWh). Ideal for overnight residential home charging.
          </p>
          <button
            onClick={() => setActiveTab('eco-calc')}
            className="mt-4 text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
          >
            <span>View CO₂e Breakdown</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recent Saved Plans Table Widget */}
      <RecentPlansWidget
        onNavigateToPlanner={() => setActiveTab('planner')}
        onPlanSelect={onSelectPlanForInspection}
      />
    </div>
  );
};
