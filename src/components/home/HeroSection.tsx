import React, { useState, useEffect } from 'react';
import {
  CalendarClock,
  MapPin,
  Sparkles,
  ArrowRight,
  Sun,
  Wind,
  BatteryCharging,
  Leaf,
  ShieldCheck,
  Building2,
  Zap,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { InteractiveEnergySlider } from './InteractiveEnergySlider';
import { EVHologram3D } from '../3d/EVHologram3D';

interface HeroSectionProps {
  setActiveTab: (tab: string) => void;
  currencySymbol: string;
  onOpenOwnerPortal?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  setActiveTab,
  currencySymbol,
  onOpenOwnerPortal,
}) => {
  const [soc, setSoc] = useState(74);

  // Animated SoC ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setSoc((prev) => (prev >= 98 ? 25 : prev + 1));
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24">
      {/* Background soft ambient glowing circles */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-emerald-100/60 via-teal-50/40 to-transparent -z-10 blur-3xl pointer-events-none" />

      {/* Subtle floating background energy grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:32px_32px] opacity-15 pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-300/80 text-emerald-900 text-xs font-bold tracking-tight shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Intelligent Clean EV Charging & Grid Optimization</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Verified Station Operator & Real OpenStreetMap Data</span>
          </div>
        </div>

        {/* Hero Headings */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
            Charge Smarter. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-forest">
              Power Cleaner. Drive Farther.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
            Find verified charging stations with live operator feeds, schedule charging during high solar and wind hours, and manage your station network with real-time availability.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <button
              onClick={() => setActiveTab('planner')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm shadow-md hover:shadow-lg hover:shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 group hover:scale-[1.02]"
            >
              <CalendarClock className="w-4 h-4 transition-transform group-hover:rotate-12" />
              <span>Plan Smart Charging</span>
              <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={() => setActiveTab('stations')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-emerald-50/60 text-slate-800 font-bold text-sm border border-slate-300 hover:border-emerald-300 shadow-xs transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Find Stations Near Me</span>
            </button>

            {onOpenOwnerPortal && (
              <button
                onClick={onOpenOwnerPortal}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs border border-emerald-300 transition-all flex items-center justify-center gap-1.5"
              >
                <Building2 className="w-4 h-4 text-emerald-700" />
                <span>Station Owner Portal</span>
              </button>
            )}
          </div>

          {/* Data Freshness Indicator */}
          <div className="pt-2">
            <div className="inline-flex flex-wrap items-center justify-center gap-3 px-4 py-2 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/80 text-[11px] text-slate-600 shadow-xs">
              <span className="flex items-center gap-1.5 font-bold text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Telemetry Active
              </span>
              <span className="text-slate-300">•</span>
              <span>OpenStreetMap & Verified Owners</span>
              <span className="text-slate-300">•</span>
              <span>Open-Meteo Radiation API</span>
              <span className="text-slate-300">•</span>
              <span>OSRM Highway Engine</span>
            </div>
          </div>
        </div>

        {/* 3D Holographic EV Charging & Clean Energy Digital Twin with Floating Interface Telemetry Cards */}
        <div className="relative max-w-5xl mx-auto mb-16">
          {/* Floating Telemetry Card 1 (Top Left) */}
          <div className="hidden lg:flex absolute -top-4 -left-6 z-20 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl max-w-xs space-y-2 animate-bounce-slow">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Live Session
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Fast Charging
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-xl font-black">
                {soc}%
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">150 kW DC Fast</div>
                <div className="text-[11px] text-slate-500">Tata Nexon EV Max • 40.5 kWh</div>
              </div>
            </div>

            <div className="text-[11px] text-emerald-800 bg-emerald-50/70 p-1.5 rounded-lg flex items-center gap-1">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Solar Canopy Absorption: <strong>100% Clean</strong></span>
            </div>
          </div>

          {/* Floating Telemetry Card 2 (Bottom Right) */}
          <div className="hidden lg:flex absolute -bottom-6 -right-6 z-20 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl max-w-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Leaf className="w-4 h-4 text-emerald-600" /> Clean Energy Mix
              </span>
              <span className="text-emerald-700 font-mono font-bold">89% Clean</span>
            </div>

            <p className="text-[11px] text-slate-500 leading-snug">
              Scheduled for Solar Soak Window (11:30 AM – 2:00 PM). Avoiding peak gas peaker plant carbon.
            </p>

            <div className="pt-1 flex items-center justify-between text-[11px] border-t border-slate-100">
              <span className="text-slate-400">Emissions Avoided:</span>
              <span className="font-bold font-mono text-emerald-700">12.4 kg CO₂e</span>
            </div>
          </div>

          {/* 3D Hologram Canvas */}
          <EVHologram3D initialChargeKw={150} currencySymbol={currencySymbol} />
        </div>

        {/* Interactive Energy Slider */}
        <div className="max-w-4xl mx-auto">
          <InteractiveEnergySlider currencySymbol={currencySymbol} />
        </div>
      </div>
    </section>
  );
};
