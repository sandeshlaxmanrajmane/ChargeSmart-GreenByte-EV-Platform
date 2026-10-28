import React, { useState, useEffect } from 'react';
import { apiService, LiveGridTelemetry } from '../../services/apiService';
import { Sun, Wind, Zap, Activity, ShieldCheck, Database, RefreshCw } from 'lucide-react';

export const LiveGridTicker: React.FC<{ currencySymbol: string }> = ({ currencySymbol }) => {
  const [telemetry, setTelemetry] = useState<LiveGridTelemetry | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let mounted = true;

    const fetchLive = async () => {
      const data = await apiService.getLiveGridTelemetry();
      if (mounted) {
        setTelemetry(data);
        setIsLive(apiService.isOnline());
      }
    };

    fetchLive();
    const interval = setInterval(() => {
      fetchLive();
      setTick((t) => t + 1);
    }, 3500);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!telemetry) return null;

  return (
    <div className="w-full bg-slate-900 text-white border-b border-slate-800 text-xs py-2 px-4 shadow-inner overflow-x-auto">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 min-w-[760px]">
        {/* Left: Backend & Grid Health Status */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[11px] font-bold text-emerald-300">
              {isLive ? 'Python ML Backend Online' : 'Real-time Grid Active'}
            </span>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            <span>Freq: <strong className="text-white">{telemetry.grid_frequency_hz} Hz</strong></span>
          </div>
        </div>

        {/* Center: Live Real-time Metrics Bar */}
        <div className="flex items-center gap-5 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
            <span>Solar:</span>
            <span className="font-mono font-bold text-amber-300">
              {telemetry.solar_generation_mw} MW
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300">
            <Wind className="w-3.5 h-3.5 text-sky-400" />
            <span>Wind:</span>
            <span className="font-mono font-bold text-sky-300">
              {telemetry.wind_generation_mw} MW
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Clean Mix:</span>
            <span className="font-mono font-bold text-emerald-400">
              {telemetry.clean_share_pct}%
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300">
            <span>Wholesale Spot:</span>
            <span className="font-mono font-bold text-amber-400">
              {currencySymbol}{telemetry.spot_tariff_usd.toFixed(2)}/kWh
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300">
            <span>Carbon Intensity:</span>
            <span className="font-mono font-bold text-slate-200">
              {telemetry.carbon_intensity_kg_kwh} kg/kWh
            </span>
          </div>
        </div>

        {/* Right: Dispatch Status */}
        <div className="shrink-0 flex items-center gap-2 text-[11px]">
          <span className="px-2 py-0.5 rounded font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
            {telemetry.grid_status}
          </span>
          <span className="text-slate-500 font-mono text-[10px]">
            Sync #{tick}
          </span>
        </div>
      </div>
    </div>
  );
};
