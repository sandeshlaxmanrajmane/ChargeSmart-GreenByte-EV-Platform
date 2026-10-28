import React, { useState, useEffect } from 'react';
import { BatteryCharging, Sun, Zap, Clock, ShieldCheck, Play, Pause } from 'lucide-react';
import { showToast } from '../common/Toast';

export const ActiveSessionWidget: React.FC<{ currencySymbol: string }> = ({
  currencySymbol,
}) => {
  const [chargingPercent, setChargingPercent] = useState(68);
  const [isCharging, setIsCharging] = useState(true);
  const [powerKw] = useState(22.0);

  // Simulated live charging tick
  useEffect(() => {
    if (!isCharging) return;
    const interval = setInterval(() => {
      setChargingPercent((prev) => {
        if (prev >= 90) return 90;
        return Number((prev + 0.2).toFixed(1));
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [isCharging]);

  const toggleCharging = () => {
    setIsCharging(!isCharging);
    showToast(
      isCharging ? 'warning' : 'success',
      isCharging ? 'Charging Paused' : 'Smart Charging Resumed',
      isCharging
        ? 'Session paused to avoid grid peak'
        : 'Smart charging resumed utilizing onsite rooftop solar'
    );
  };

  return (
    <div className="bg-gradient-to-br from-forest via-[#0e3b32] to-[#072620] rounded-3xl p-6 sm:p-8 text-white shadow-card border border-emerald-500/20 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Left Side: Session Details */}
        <div className="space-y-4 max-w-lg">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{isCharging ? 'Active Smart Charge Session' : 'Session Paused'}</span>
            </span>
            <span className="text-xs text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full">
              Tata Nexon EV Long Range
            </span>
          </div>

          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Solar Peak Absorption Window
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Currently drawing from on-site rooftop solar canopy at GreenByte Innovation Hub.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Current Power
              </div>
              <div className="text-lg font-bold text-white mt-0.5 font-mono">{powerKw} kW</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Sun className="w-3.5 h-3.5 text-emerald-400" /> Clean Energy
              </div>
              <div className="text-lg font-bold text-emerald-300 mt-0.5 font-mono">92% Solar</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-sky-400" /> Est. Complete
              </div>
              <div className="text-lg font-bold text-white mt-0.5 font-mono">1:15 PM</div>
            </div>
          </div>
        </div>

        {/* Right Side: Battery Gauge & Controls */}
        <div className="w-full lg:w-72 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 flex flex-col items-center">
          <div className="relative w-28 h-28 flex items-center justify-center mb-3">
            {/* SVG Circular Progress */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-white/20 fill-none"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-emerald-400 fill-none transition-all duration-500 ease-out"
                strokeWidth="8"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * chargingPercent) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <BatteryCharging className="w-6 h-6 text-emerald-300 animate-pulse" />
              <span className="text-xl font-black font-mono mt-0.5">{chargingPercent}%</span>
            </div>
          </div>

          <div className="w-full text-center space-y-2">
            <div className="text-xs text-slate-300 font-medium">
              Target: <span className="font-bold text-white">90%</span> (~8.9 kWh remaining)
            </div>

            <button
              onClick={toggleCharging}
              className={`w-full py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                isCharging
                  ? 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-forest-dark font-extrabold shadow-md'
              }`}
            >
              {isCharging ? (
                <>
                  <Pause className="w-3.5 h-3.5" /> Pause Session
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Resume Solar Charging
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
