import React from 'react';
import { HeroSection } from '../components/home/HeroSection';
import { ImpactMetrics } from '../components/home/ImpactMetrics';
import { HowItWorksSection } from '../components/home/HowItWorksSection';
import { FeaturesSection } from '../components/home/FeaturesSection';
import { CalendarClock, MapPin, ArrowRight } from 'lucide-react';

interface HomePageProps {
  setActiveTab: (tab: string) => void;
  currencySymbol: string;
}

export const HomePage: React.FC<HomePageProps> = ({ setActiveTab, currencySymbol }) => {
  return (
    <div className="space-y-4">
      {/* Hero section with dynamic visualizer and slider */}
      <HeroSection setActiveTab={setActiveTab} currencySymbol={currencySymbol} />

      {/* Measured Impact Metrics */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ImpactMetrics />
      </div>

      {/* How it Works Pipeline */}
      <HowItWorksSection onExplorePlanner={() => setActiveTab('planner')} />

      {/* Architectural Features */}
      <FeaturesSection setActiveTab={setActiveTab} />

      {/* Final Call to Action Banner */}
      <section className="py-16 bg-gradient-to-br from-forest via-[#0F453B] to-slate-900 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3.5 py-1 rounded-full border border-emerald-500/30">
            DSU Ideathon 2026 Demonstration Ready
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
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-forest-dark font-black text-sm shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 group"
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
