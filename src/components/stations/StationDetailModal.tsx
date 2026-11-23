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
  Info,
  CalendarClock,
  AlertTriangle,
  Building2,
  Database,
  Phone,
  Mail,
  Layers,
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

  const osmUrl = `https://www.openstreetmap.org/?mlat=${station.latitude}&mlon=${station.longitude}#map=16/${station.latitude}/${station.longitude}`;

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Recently';
    try {
      const d = new Date(isoString);
      const diffMins = Math.round((Date.now() - d.getTime()) / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins === 1) return '1 minute ago';
      if (diffMins < 60) return `${diffMins} minutes ago`;
      const diffHours = Math.round(diffMins / 60);
      if (diffHours === 1) return '1 hour ago';
      return `${diffHours} hours ago`;
    } catch {
      return 'Recently';
    }
  };

  const isOperatorReported = station.liveStatus === 'operator_reported' || station.dataProvider?.includes('Owner');
  const availableBays = station.availablePlugs;
  const occupiedBays = station.occupiedPlugs || (station.totalPlugs - station.availablePlugs);
  const outOfServiceBays = station.outOfServicePlugs || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                {station.operator}
              </span>

              {station.isLiveStatusAvailable ? (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {isOperatorReported ? 'Operator Verified Live Feed' : 'Live Operator Feed'}
                </span>
              ) : (
                <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  Live availability not provided by operator
                </span>
              )}
            </div>

            <h3 className="text-2xl font-black text-slate-900 mt-1">{station.name}</h3>

            <p className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                {station.address}, {station.city} ({station.distanceKm} km away)
              </span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-time Status Card & Availability Breakdown (Section 8 Requirement) */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>Station Availability Summary</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Last updated: <strong>{formatRelativeTime(station.lastUpdated)}</strong>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="text-lg font-black text-emerald-700 font-mono">{availableBays}</div>
              <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-tight">Available</div>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
              <div className="text-lg font-black text-amber-700 font-mono">{occupiedBays}</div>
              <div className="text-[10px] font-bold text-amber-800 uppercase tracking-tight">Occupied</div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200">
              <div className="text-lg font-black text-slate-600 font-mono">{outOfServiceBays}</div>
              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">Maintenance</div>
            </div>
          </div>

          {!station.isLiveStatusAvailable && (
            <div className="text-[11px] text-amber-800 bg-amber-50/80 p-2 rounded-lg border border-amber-200 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>Live availability not provided by operator for this external node. Physical verification recommended.</span>
            </div>
          )}
        </div>

        {/* Clean Energy Supply */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
            <span className="flex items-center gap-1.5">
              <Leaf className="w-4 h-4 text-emerald-600" /> Clean Energy Supply
            </span>
            <span className="text-emerald-700 font-mono text-sm">
              {station.renewableInfo.greenSharePercent}% Clean Mix
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Energy Profile: <strong className="text-slate-900">{station.renewableInfo.source}</strong>.{' '}
            {station.renewableInfo.verified
              ? 'Station backed by on-site solar canopy or verified green certificates.'
              : 'Estimations derived from regional grid mix.'}
          </p>
        </div>

        {/* Connectors & Charging Speeds */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-600" /> Connectors & Speeds ({station.totalPlugs} Total Bays)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {station.connectors.map((c, i) => (
              <div
                key={i}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{c.type}</div>
                  <div className="text-[11px] text-slate-500">
                    Max Speed: <strong className="text-slate-700 font-mono">{c.powerKw} kW</strong>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                    {c.total} Bay{c.total > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing, Operating Hours, Provider */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/40">
            <div className="text-slate-400 font-medium text-[11px] mb-1">Pricing / Tariff</div>
            <div className="font-bold text-slate-900">
              {station.isVerifiedPrice ? (
                <span className="font-mono text-emerald-700 font-black">
                  {currencySymbol}{station.pricePerKwh.toFixed(2)} / kWh
                </span>
              ) : (
                <span className="text-slate-600 text-[11px]">Check on-site / app</span>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/40">
            <div className="text-slate-400 font-medium text-[11px] mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Operating Hours
            </div>
            <div className="font-bold text-slate-900">{station.openingHours || '24/7 Access'}</div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/40 col-span-2 sm:col-span-1">
            <div className="text-slate-400 font-medium text-[11px] mb-1 flex items-center gap-1">
              <Database className="w-3 h-3" /> Data Source
            </div>
            <div className="font-bold text-slate-900 truncate">
              {station.dataProvider || 'OpenStreetMap'}
            </div>
          </div>
        </div>

        {/* Contact info if provided */}
        {(station.contactPhone || station.contactEmail) && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-wrap items-center gap-4 text-slate-600">
            {station.contactPhone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>{station.contactPhone}</span>
              </div>
            )}
            {station.contactEmail && (
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-teal-600" />
                <span>{station.contactEmail}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
          <button
            onClick={() => {
              onPlanAtStation(station);
              onClose();
              showToast('success', 'Station Selected', `Loaded ${station.name} into Smart Planner.`);
            }}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
          >
            <CalendarClock className="w-4 h-4" />
            <span>Plan Charging at this Station</span>
          </button>

          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors border border-slate-200 flex items-center justify-center gap-1.5"
            >
              <Compass className="w-4 h-4 text-emerald-700" />
              <span>Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          )}

          <a
            href={osmUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors border border-slate-200 flex items-center justify-center gap-1"
            title="View on OpenStreetMap"
          >
            <span>OSM</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>
      </div>
    </div>
  );
};
