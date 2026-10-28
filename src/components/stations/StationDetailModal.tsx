import React from 'react';
import { ChargingStation } from '../../types';
import { UserLocation } from '../../services/locationService';
import { getGoogleMapsNavigationUrl } from '../../utils/geoUtils';
import {
  X,
  MapPin,
  Zap,
  Leaf,
  ShieldCheck,
  Clock,
  Compass,
  CheckCircle2,
  ExternalLink,
  Coffee,
  Wifi,
} from 'lucide-react';
import { showToast } from '../common/Toast';

interface StationDetailModalProps {
  station: ChargingStation | null;
  currencySymbol: string;
  onClose: () => void;
  onPlanAtStation: (station: ChargingStation) => void;
  userLocation?: UserLocation | null;
}

export const StationDetailModal: React.FC<StationDetailModalProps> = ({
  station,
  currencySymbol,
  onClose,
  onPlanAtStation,
  userLocation,
}) => {
  if (!station) return null;

  const mapsUrl = getGoogleMapsNavigationUrl(
    station.latitude,
    station.longitude,
    userLocation?.latitude,
    userLocation?.longitude
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                {station.operator}
              </span>
              {station.isVerified ? (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Clean Source
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  Simulated Demo Station
                </span>
              )}
            </div>
            <h3 className="text-2xl font-black text-slate-900">{station.name}</h3>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{station.address}, {station.city} ({station.distanceKm} km away)</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Renewable Energy Provenance Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
            <span className="flex items-center gap-1.5">
              <Leaf className="w-4 h-4 text-emerald-600" /> Clean Energy Source
            </span>
            <span className="text-emerald-700 font-mono text-sm">
              {station.renewableInfo.greenSharePercent}% Green Mix (Rating: {station.renewableInfo.lifecycleRating})
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Powered by: <strong className="text-slate-900">{station.renewableInfo.source}</strong>. Station telemetry is verified against regional renewable certificate registries.
          </p>
        </div>

        {/* Plugs and Connectors */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-600" /> Available Connectors & Power Output
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {station.connectors.map((c, i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between"
              >
                <div>
                  <div className="font-extrabold text-sm text-slate-900">{c.type}</div>
                  <div className="text-xs font-mono font-bold text-emerald-700 mt-0.5">
                    {c.powerKw} kW Max
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Available:</span>
                  <span className="font-bold text-slate-800">
                    {c.available} / {c.total}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing & Hours */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Electricity Rate</span>
            <span className="text-xl font-black text-slate-900 font-mono">
              {currencySymbol}{station.pricePerKwh.toFixed(2)}
            </span>
            <span className="text-slate-500 text-[11px]"> / kWh drawn</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Operating Hours</span>
            <span className="text-sm font-bold text-slate-900 flex items-center gap-1 mt-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" /> {station.openingHours}
            </span>
          </div>
        </div>

        {/* Amenities */}
        {station.amenities && (
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
              Site Amenities
            </span>
            <div className="flex flex-wrap gap-1.5">
              {station.amenities.map((am, i) => (
                <span
                  key={i}
                  className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200 flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{am}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Compass className="w-4 h-4 text-emerald-600" />
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={() => {
              onPlanAtStation(station);
              onClose();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <Zap className="w-4 h-4" />
            <span>Plan Charge at this Station</span>
          </button>
        </div>
      </div>
    </div>
  );
};
