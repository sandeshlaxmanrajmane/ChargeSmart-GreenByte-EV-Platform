import React from 'react';
import { Zap, Sparkles, ShieldCheck } from 'lucide-react';

interface BatteryCell3DProps {
  currentSoc: number;
  targetSoc?: number;
  capacityKwh?: number;
  isCharging?: boolean;
}

export const BatteryCell3D: React.FC<BatteryCell3DProps> = ({
  currentSoc,
  targetSoc,
  capacityKwh = 40.5,
  isCharging = true,
}) => {
  const fillPct = Math.min(100, Math.max(0, currentSoc));
  const targetPct = targetSoc ? Math.min(100, Math.max(fillPct, targetSoc)) : fillPct;

  return (
    <div className="relative w-full p-4 rounded-3xl bg-gradient-to-br from-slate-900 via-forest to-slate-900 border border-emerald-500/30 text-white shadow-xl overflow-hidden preserve-3d">
      {/* 3D Volumetric Prismatic Battery Enclosure */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="font-bold text-emerald-300 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
          <Zap className="w-3.5 h-3.5 text-amber-400" /> 3D Prismatic Cell Module
        </span>
        <span className="font-mono font-bold text-slate-300 text-[11px]">
          {capacityKwh} kWh Li-Ion
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* The 3D Volumetric Cell Graphic */}
        <div className="relative w-24 h-36 rounded-2xl border-2 border-emerald-400/40 bg-slate-950/80 p-1 flex flex-col justify-end shadow-2xl overflow-hidden">
          {/* Positive Terminal Cap */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-2 rounded-t-md bg-gradient-to-r from-amber-400 to-amber-200 border border-amber-300 shadow-sm" />

          {/* Target Delta Glow Shadow */}
          {targetSoc && targetSoc > currentSoc && (
            <div
              className="absolute left-1 right-1 border-t-2 border-dashed border-amber-400/80 z-20 transition-all duration-500"
              style={{ bottom: `${targetPct}%` }}
            >
              <span className="absolute -right-0.5 -top-3 text-[9px] font-mono font-black text-amber-300 bg-black/60 px-1 rounded">
                {targetSoc}%
              </span>
            </div>
          )}

          {/* Liquid Electrolyte Fill */}
          <div
            className="w-full rounded-xl bg-gradient-to-t from-emerald-600 via-emerald-400 to-teal-300 transition-all duration-700 relative overflow-hidden shadow-neon-emerald"
            style={{ height: `${fillPct}%` }}
          >
            {/* Animated Electrolyte Wave Top */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-white/40 blur-[1px] animate-pulse" />

            {/* Micro Ion Bubbles */}
            {isCharging && (
              <>
                <div className="absolute w-1.5 h-1.5 rounded-full bg-white/80 bottom-1 left-2 animate-bounce" />
                <div className="absolute w-2 h-2 rounded-full bg-white/60 bottom-3 right-3 animate-ping" />
              </>
            )}
          </div>
        </div>

        {/* Live Metrics Column */}
        <div className="flex-1 space-y-2 text-xs">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Active State of Charge</div>
            <div className="text-3xl font-black font-mono text-emerald-300 tracking-tight">
              {currentSoc}%
            </div>
          </div>

          <div className="space-y-1 pt-1 border-t border-white/10 text-[11px] text-slate-300">
            <div className="flex justify-between">
              <span>Energy Stored:</span>
              <strong className="font-mono text-white">
                {((capacityKwh * fillPct) / 100).toFixed(1)} kWh
              </strong>
            </div>

            {targetSoc && (
              <div className="flex justify-between text-amber-300">
                <span>Target Buffer:</span>
                <strong className="font-mono">{targetSoc}%</strong>
              </div>
            )}

            <div className="flex justify-between text-emerald-400">
              <span>Cathode Health:</span>
              <strong className="font-mono">98.4% SOH</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
