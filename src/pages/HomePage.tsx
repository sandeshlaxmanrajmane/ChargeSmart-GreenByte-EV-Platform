import React from 'react';
import { HeroSection } from '../components/home/HeroSection';
import { ImpactMetrics } from '../components/home/ImpactMetrics';
import { HowItWorksSection } from '../components/home/HowItWorksSection';
import { FeaturesSection } from '../components/home/FeaturesSection';
import { CalendarClock, MapPin, ArrowRight, Building2, Zap, CheckCircle2 } from 'lucide-react';

interface HomePageProps {
  setActiveTab: (tab: string) => void;
  currencySymbol: string;
  onOpenOwnerPortal?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  setActiveTab,
  currencySymbol,
  onOpenOwnerPortal,
}) => {
  return (
    <div className="space-y-4">
      {/* Hero section with dynamic visualizer and slider */}
      <HeroSection
        setActiveTab={setActiveTab}
        currencySymbol={currencySymbol}
        onOpenOwnerPortal={onOpenOwnerPortal}
      />

      {/* Measured Impact Metrics */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ImpactMetrics />
      </div>

      {/* How it Works Pipeline */}
      <HowItWorksSection onExplorePlanner={() => setActiveTab('planner')} />

      {/* EV Station Owner Section Featurette */}
      <section className="py-12 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Station Operators & Fleet Infrastructure</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Own an EV Charging Station? Broadcast Live Availability.
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Connect your charging hubs directly to ChargeSmart. Register your station locations, manage individual chargers, update live occupancy status (Available, Occupied, Maintenance), and adjust transparent tariffs with real-time database synchronization.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-600 font-medium">
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Instant Map Synchronization
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-teal-700 font-bold">
                  <Zap className="w-3.5 h-3.5 text-teal-600" /> Multi-Bay Charger Hardware Control
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-700 font-bold">
                  Audit Logging & Analytics
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 w-full sm:w-auto">
              <button
                onClick={onOpenOwnerPortal}
                className="px-6 py-3.5 rounded-xl bg-forest hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 hover:scale-105"
              >
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Open Station Owner Portal</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Architectural Features */}
      <FeaturesSection setActiveTab={setActiveTab} />

      {/* Final Call to Action Banner */}
      <section className="py-16 bg-gradient-to-br from-forest via-[#0F453B] to-slate-900 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3.5 py-1 rounded-full border border-emerald-500/30">
            Real-Time Clean Energy Platform
          </span>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Ready to Experience Truly Clean EV Charging?
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Stop charging on fossil-heavy peak power. Calculate your personalized vehicle charging schedule in under 15 seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setActiveTab('planner');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-forest font-black text-sm shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 group"
            >
              <CalendarClock className="w-4 h-4" />
              <span>Launch Smart Planner</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={() => {
                setActiveTab('stations');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Find Green Stations</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
