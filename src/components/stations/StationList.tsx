import React from 'react';
import { ChargingStation } from '../../types';
import { TiltCard3D } from '../3d/TiltCard3D';
import { MapPin, Zap, Leaf, ShieldCheck, ArrowRight, Clock, Info, AlertCircle, CheckCircle2 } from 'lucide-react';

interface StationListProps {
  stations: ChargingStation[];
  selectedStationId: string | null;
  onSelectStation: (station: ChargingStation) => void;
  currencySymbol: string;
}

export const StationList: React.FC<StationListProps> = ({
  stations,
  selectedStationId,
  onSelectStation,
  currencySymbol,
}) => {
  if (stations.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-3xl bg-white border border-slate-200">
        <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <h4 className="font-bold text-slate-700 text-sm">No Stations Match Your Filters</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Try expanding your search radius, selecting all connector types, or adjusting power filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {stations.map((st) => {
        const isSelected = st.id === selectedStationId;

        // Strict status label as required by Section 5 & 16
        const renderStatusBadge = () => {
          if (st.dataProvider?.includes('Owner') || st.liveStatus === 'operator_reported') {
            return (
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Operator Reported ({st.availablePlugs}/{st.totalPlugs} Available)
              </span>
            );
          } else if (st.isLiveStatusAvailable && st.liveStatus === 'available') {
            return (
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Available ({st.availablePlugs} free)
              </span>
            );
          } else if (st.isLiveStatusAvailable && st.liveStatus === 'occupied') {
            return (
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Occupied
              </span>
            );
          } else if (st.isLiveStatusAvailable && st.liveStatus === 'out_of_service') {
            return (
              <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Out of service
              </span>
            );
          } else {
            return (
              <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200 flex items-center gap-1">
                <Info className="w-3 h-3 text-slate-400" />
                Live availability unavailable
              </span>
            );
          }
        };

        return (
          <TiltCard3D
            key={st.id}
            maxTilt={7}
            scale={1.015}
            onClick={() => onSelectStation(st)}
            className={`rounded-3xl p-5 border cursor-pointer bg-white flex flex-col justify-between group shadow-3d-card ${
              isSelected
                ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-neon-emerald'
                : 'border-slate-200 hover:border-emerald-300'
            }`}
          >
            <div>
              {/* Top Meta: Operator & Distance */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {st.operator}
                </span>
                <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                  {st.distanceKm} km
                </span>
              </div>

              {/* Station Name & Address */}
              <h4 className="font-bold text-slate-900 text-base group-hover:text-emerald-800 transition-colors line-clamp-1">
                {st.name}
              </h4>
              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{st.address}</span>
              </p>

              {/* Power and Tariff Info */}
              <div className="flex items-center justify-between my-3 py-2 border-y border-slate-100 text-xs">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="font-mono font-bold text-slate-800">{st.maxPowerKw} kW</span>
                  <span className="text-[11px] text-slate-400">Max</span>
                </div>

                <div className="text-right">
                  {st.isVerifiedPrice ? (
                    <div className="font-mono font-bold text-emerald-700">
                      {currencySymbol}{st.pricePerKwh.toFixed(2)}
                      <span className="text-[10px] font-normal text-slate-500"> / kWh</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 font-medium italic">
                      Tariff on-site / app
                    </div>
                  )}
                </div>
              </div>

              {/* Live Status and Renewable Info */}
              <div className="flex flex-col gap-1.5 mb-3 text-xs">
                <div className="flex items-center justify-between">
                  {renderStatusBadge()}
                  <span className="text-[10px] text-slate-400 font-mono">
                    {st.openingHours || '24/7'}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-emerald-700 font-semibold text-[11px] pt-1">
                  <Leaf className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{st.renewableInfo.greenSharePercent}% Clean Mix ({st.renewableInfo.source})</span>
                </div>
              </div>

              {/* Connector Pills */}
              <div className="flex flex-wrap gap-1 mb-3">
                {st.connectors.map((c, i) => (
                  <span
                    key={i}
                    className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium border border-slate-200"
                  >
                    {c.type} • {c.powerKw}kW
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Footer: Data Source & Inspect Action */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span className="truncate max-w-[170px]">
                Src: {st.dataProvider || 'OpenStreetMap'}
              </span>
              <button className="text-emerald-700 font-bold hover:text-emerald-900 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>Details</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </TiltCard3D>
        );
      })}
    </div>
  );
};
