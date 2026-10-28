import React from 'react';
import {
  Sun,
  DollarSign,
  MapPin,
  Leaf,
  Scale,
  Clock,
  Sparkles,
  BarChart,
} from 'lucide-react';

export const FeaturesSection: React.FC<{ setActiveTab: (tab: string) => void }> = ({
  setActiveTab,
}) => {
  const features = [
    {
      icon: Sun,
      title: 'Renewable-First Optimization',
      desc: 'Synchronizes your charging window with hours of peak solar irradiance and nighttime wind generation, maximizing zero-carbon electron intake.',
      tag: 'Solar & Wind Synced',
      tab: 'planner',
    },
    {
      icon: DollarSign,
      title: 'Time-of-Use Cost Minimization',
      desc: 'Avoids aggressive commercial peak electricity tariffs by prioritizing low-rate solar-soak periods and overnight grid off-peaks.',
      tag: 'Dynamic Tariffs',
      tab: 'cost-calc',
    },
    {
      icon: Scale,
      title: 'Multi-Objective Trade-Offs',
      desc: 'Configurable weights let you prioritize between maximum savings, maximum green power, balanced optimization, or emergency rapid charging.',
      tag: 'Deterministic Math',
      tab: 'planner',
    },
    {
      icon: MapPin,
      title: 'Station Discovery with Green Badges',
      desc: 'Explore chargers with verified renewable origins, connector availability (CCS2, Type 2, Bharat AC), power outputs, and transparent per-kWh rates.',
      tag: 'Clean Mobility Map',
      tab: 'stations',
    },
    {
      icon: Leaf,
      title: 'Lifecycle Emissions Engine',
      desc: 'Rigorous calculation using ISO lifecycle factors (0.04 kg CO₂e/kWh for solar/wind) versus real-time grid carbon intensity.',
      tag: 'ISO Aligned CO₂e',
      tab: 'eco-calc',
    },
    {
      icon: BarChart,
      title: 'Historical Analytics & Plans',
      desc: 'Track aggregate carbon offsets, financial savings across past sessions, and download formatted JSON charging receipts.',
      tag: 'Persistent Data',
      tab: 'analytics',
    },
  ];

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-200">
            System Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            Why ChargeSmart Outperforms Basic Locators
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Most EV apps merely show pins on a map. ChargeSmart coordinates with the power grid to solve the clean energy dispatch challenge.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-card transition-all hover:border-emerald-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-100/80 border border-emerald-200 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6 text-emerald-700" />
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      {feat.tag}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-lg mb-2">{feat.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                    {feat.desc}
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab(feat.tab)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                >
                  <span>Explore Feature</span>
                  <span>→</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
