import React from 'react';
import { ChargingStation } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { MapPin, Zap, Leaf, ShieldCheck, ArrowRight, Clock } from 'lucide-react';

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
        <p className="text-xs text-slate-500 mt-1">
          Try expanding your distance, adjusting connector types, or turning off the verified-only filter.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {stations.map((st) => {
        const isSelected = st.id === selectedStationId;

        return (
          <div
            key={st.id}
            onClick={() => onSelectStation(st)}
            className={`rounded-2xl p-5 border transition-all cursor-pointer bg-white flex flex-col justify-between group ${
              isSelected
                ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                : 'border-slate-200 hover:border-emerald-300 hover:shadow-card'
            }`}
          >
            <div>
              {/* Top Meta */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {st.operator}
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {st.distanceKm} km
                </span>
              </div>

              {/* Station Name */}
              <h4 className="font-bold text-slate-900 text-base group-hover:text-emerald-800 transition-colors line-clamp-1">
                {st.name}
              </h4>
              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{st.address}</p>

              {/* Power and Price info */}
              <div className="flex items-center justify-between my-3 py-2 border-y border-slate-100 text-xs">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-mono font-bold text-slate-800">{st.maxPowerKw} kW</span>
                  <span className="text-[11px] text-slate-400">Max DC/AC</span>
                </div>

                <div className="font-mono font-bold text-slate-900">
                  {currencySymbol}{st.pricePerKwh.toFixed(2)}
                  <span className="text-[10px] font-normal text-slate-500"> / kWh</span>
                </div>
              </div>

              {/* Renewable Provenance badge */}
              <div className="flex items-center justify-between text-xs mb-3">
                <div className="flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                  <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{st.renewableInfo.greenSharePercent}% {st.renewableInfo.source}</span>
                </div>
                {st.renewableInfo.verified && (
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold border border-emerald-200">
                    Verified
                  </span>
                )}
              </div>

              {/* Connector Pills */}
              <div className="flex flex-wrap gap-1 mb-2">
                {st.connectors.map((c, i) => (
                  <span
                    key={i}
                    className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium border border-slate-200"
                  >
                    {c.type} ({c.available}/{c.total})
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Card Action */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{st.availablePlugs} plugs free</span>
              </span>

              <span className="text-slate-400 group-hover:text-emerald-700 font-bold flex items-center gap-1 transition-colors">
                <span>View Details</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
