import React from 'react';
import { Sliders, Activity, Cpu, CheckCircle, ArrowRight } from 'lucide-react';

export const HowItWorksSection: React.FC<{ onExplorePlanner: () => void }> = ({
  onExplorePlanner,
}) => {
  const steps = [
    {
      step: '01',
      title: 'Specify Vehicle & Target',
      icon: Sliders,
      description:
        'Enter battery capacity, current charge, desired state of charge, and your required departure time.',
      highlight: 'Scooter, Motorcycle, Car, or Fleet',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    {
      step: '02',
      title: 'Grid & Renewable Forecast',
      icon: Activity,
      description:
        'ChargeSmart ingests hourly solar generation curves, wind availability profiles, and time-varying electricity tariffs.',
      highlight: 'Avoids Dirty Thermal Peakers',
      color: 'bg-teal-100 text-teal-800 border-teal-300',
    },
    {
      step: '03',
      title: 'Constraint-Aware Optimization',
      icon: Cpu,
      description:
        'Sliding candidate windows are evaluated for deadline feasibility, charging power limits, budget constraints, and emissions.',
      highlight: 'Mathematical Multi-Objective Ranking',
      color: 'bg-sky-100 text-sky-800 border-sky-300',
    },
    {
      step: '04',
      title: 'Execute Clean Charging',
      icon: CheckCircle,
      description:
        'Review transparent trade-offs between urgent charging, lowest cost, and highest green percentage. Save or sync your schedule.',
      highlight: 'Up to 55% Cost & 70% CO₂e Saved',
      color: 'bg-amber-100 text-amber-800 border-amber-300',
    },
  ];

  return (
    <section className="py-16 bg-[#F4FBF7] border-y border-emerald-950/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-200">
            Transparent Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            How ChargeSmart Optimizes Every Session
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Moving beyond simple map pins to intelligent, renewable-energy-synchronized charging.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-card transition-all border border-slate-200/80 hover:border-emerald-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-slate-300 font-mono group-hover:text-emerald-600 transition-colors">
                      {item.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <span
                    className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-md border ${item.color}`}
                  >
                    {item.highlight}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <button
            onClick={onExplorePlanner}
            className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-5 py-2.5 rounded-xl border border-emerald-300 transition-all shadow-xs"
          >
            <span>Try the Smart Planner Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
