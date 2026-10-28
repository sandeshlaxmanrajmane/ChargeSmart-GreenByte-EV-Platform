import React from 'react';
import { BrandLogo } from './BrandLogo';
import { Leaf, Sun, Wind, ShieldCheck, Heart, ExternalLink } from 'lucide-react';

interface FooterProps {
  setActiveTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand info */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-slate-800/80 p-3 rounded-xl inline-block border border-slate-700">
              <BrandLogo size="md" showTagline={false} />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              ChargeSmart by GreenByte revolutionizes electric mobility by harmonizing EV charging schedules with real-time renewable energy availability, dynamic grid tariffs, and personal departure deadlines.
            </p>
            <div className="flex items-center gap-3 text-xs text-emerald-400 font-medium">
              <span className="flex items-center gap-1">
                <Sun className="w-3.5 h-3.5 text-amber-400" /> Solar Aware
              </span>
              <span className="flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-sky-400" /> Wind Synced
              </span>
              <span className="flex items-center gap-1">
                <Leaf className="w-3.5 h-3.5 text-emerald-400" /> Eco-First
              </span>
            </div>
          </div>

          {/* Quick Platform Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => setActiveTab('planner')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Smart Charge Planner
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Live Charging Dashboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('stations')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  EV Station Finder
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('cost-calc')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Supply Cost Calculator
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('eco-calc')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  CO₂e Emissions Engine
                </button>
              </li>
            </ul>
          </div>

          {/* Clean Energy & Ideathon Scope */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">DSU Ideathon 2026</h4>
            <p className="text-xs text-slate-400 mb-2">
              Track: Clean Mobility & EV Infrastructure.
            </p>
            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/80 text-[11px] text-slate-300 space-y-1">
              <div className="font-semibold text-emerald-400">GreenByte Core Hypothesis:</div>
              <div>
                Transitioning to EVs only achieves true net-zero mobility when charging occurs during solar/wind generation peaks rather than coal-heavy evening peak hours.
              </div>
            </div>
          </div>

          {/* Data Transparency & Integrity */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Integrity & Data</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span>Deterministic mathematical scheduling without fake telemetry.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span>ISO 14040/44 lifecycle emission accounting (0.04 kg CO₂e/kWh renewable baseline).</span>
              </li>
              <li className="flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span>All demo stations and grid profiles are clearly labeled simulated environments.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span>© 2026 GreenByte Technologies. Developed for DSU Ideathon 2026.</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-emerald-500 font-mono">Status: All Algorithms Active</span>
            <button
              onClick={() => setActiveTab('settings')}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Reset Demo Data
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
