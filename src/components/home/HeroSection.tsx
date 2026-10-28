import React from 'react';
import { CalendarClock, MapPin, Sparkles, ArrowRight, Sun, Wind, BatteryCharging, Leaf, ShieldCheck } from 'lucide-react';
import { InteractiveEnergySlider } from './InteractiveEnergySlider';

interface HeroSectionProps {
  setActiveTab: (tab: string) => void;
  currencySymbol: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ setActiveTab, currencySymbol }) => {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24">
      {/* Background soft ambient glowing circles */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-emerald-100/50 via-teal-50/30 to-transparent -z-10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-300/80 text-emerald-900 text-xs font-bold tracking-tight shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>GreenByte Intelligent EV Energy Orchestration</span>
          </div>
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
            <Leaf className="w-3.5 h-3.5 text-teal-600" />
            <span>DSU Ideathon 2026 Finalist Project</span>
          </div>
        </div>

        {/* Hero Headings */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
            Charge Smarter. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-forest">
              Drive Greener.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
            Discover smarter EV charging schedules based on renewable energy availability, charging costs, and your driving needs. Powered by a transparent, multi-objective optimization engine.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setActiveTab('planner')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm shadow-md hover:shadow-lg hover:shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 group hover:scale-[1.02]"
            >
              <CalendarClock className="w-4 h-4 transition-transform group-hover:rotate-12" />
              <span>Plan My Charge</span>
              <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={() => setActiveTab('stations')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-emerald-50/60 text-slate-800 font-bold text-sm border border-slate-300 hover:border-emerald-300 shadow-xs transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Explore Stations</span>
            </button>
          </div>
        </div>

        {/* Visual Showcase: Animated EV Charging & Renewable Eco-Grid Graphic */}
        <div className="relative max-w-4xl mx-auto mb-16">
          <div className="bg-gradient-to-br from-forest via-[#0F4238] to-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl border border-emerald-500/20 text-white overflow-hidden relative">
            {/* Background graphic grid lines */}
            <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

            {/* Glowing corner badges */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Left Column: Renewable Energy Source */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Primary Clean Source</div>
                    <div className="text-sm font-bold text-white">Distributed Solar Canopy</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-400/20 text-sky-300 flex items-center justify-center border border-sky-400/30">
                    <Wind className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Secondary Clean Source</div>
                    <div className="text-sm font-bold text-white">Overnight Wind PPA</div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-xs">
                  <div className="text-emerald-400 font-semibold flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Real-time Grid Optimization</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Continuously syncs with wholesale spot prices and generation mix to avoid fossil thermal peaker peaks.
                  </p>
                </div>
              </div>

              {/* Center: Dynamic EV Graphic & Power Flow Animation */}
              <div className="text-center flex flex-col items-center justify-center py-4 relative">
                {/* Central Vehicle & Charger SVG */}
                <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center">
                  {/* Concentric glowing energy waves */}
                  <div className="absolute inset-0 rounded-full border border-emerald-400/30 animate-ping opacity-25" />
                  <div className="absolute inset-4 rounded-full border border-teal-400/40 animate-pulse" />
                  <div className="absolute inset-8 rounded-full bg-gradient-to-tr from-emerald-600/40 via-teal-500/20 to-transparent blur-md" />

                  {/* EV Car & Plug Silhouette representation */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-emerald-500 to-forest p-3.5 shadow-glow-green border border-emerald-400/40 flex items-center justify-center">
                      <BatteryCharging className="w-12 h-12 text-white animate-soft-pulse" />
                    </div>
                    <div className="mt-3 text-xs font-mono font-bold text-emerald-300 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/40">
                      84% Clean Energy Mix
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-300 font-medium mt-1">
                  Optimal Window: <span className="text-emerald-400 font-bold">11:30 AM — 02:00 PM</span>
                </div>
              </div>

              {/* Right Column: Live Savings Metric Preview */}
              <div className="space-y-4">
                <div className="bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-emerald-500/20 space-y-3">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Smart Scheduling Impact
                  </div>

                  <div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-white flex items-baseline gap-1">
                      <span className="text-emerald-400">-46%</span>
                      <span className="text-xs text-slate-300 font-normal">Charging Cost</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Compared to standard evening peak tariff
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-700/80">
                    <div className="text-2xl sm:text-3xl font-extrabold text-white flex items-baseline gap-1">
                      <span className="text-teal-400">-71%</span>
                      <span className="text-xs text-slate-300 font-normal">CO₂e Emissions</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Lifecycle accounting vs standard thermal grid
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('planner')}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-forest-dark font-bold text-xs text-center transition-all shadow-md hover:shadow-emerald-400/30"
                >
                  Calculate Your Vehicle Schedule →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Energy Slider */}
        <div className="max-w-4xl mx-auto">
          <InteractiveEnergySlider currencySymbol={currencySymbol} />
        </div>
      </div>
    </section>
  );
};
