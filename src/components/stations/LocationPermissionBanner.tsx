import React from 'react';
import { UserLocation, GeolocationStatus } from '../../services/locationService';
import {
  MapPin,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Compass,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { getGoogleMapsNavigationUrl } from '../../utils/geoUtils';

interface LocationPermissionBannerProps {
  status: GeolocationStatus;
  userLocation: UserLocation | null;
  nearestStation: { name: string; distanceKm: number; latitude: number; longitude: number } | null;
  onRequestLocation: () => void;
  isLoadingStations: boolean;
}

export const LocationPermissionBanner: React.FC<LocationPermissionBannerProps> = ({
  status,
  userLocation,
  nearestStation,
  onRequestLocation,
  isLoadingStations,
}) => {
  if (status === 'granted' && userLocation) {
    const mapsUrl = nearestStation
      ? getGoogleMapsNavigationUrl(
          nearestStation.latitude,
          nearestStation.longitude,
          userLocation.latitude,
          userLocation.longitude
        )
      : null;

    return (
      <div className="bg-gradient-to-r from-emerald-900 via-forest to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
            <Navigation className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Live GPS Granted
              </span>
              {userLocation.accuracyMeters && (
                <span className="text-[11px] text-slate-300 font-mono">
                  Accurate to ±{userLocation.accuracyMeters}m
                </span>
              )}
            </div>

            <div className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5">
              <span>{userLocation.addressLabel || `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`}</span>
            </div>

            {nearestStation && (
              <div className="text-xs text-emerald-300 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                <span>
                  Nearest station: <strong className="text-white">{nearestStation.name}</strong> is just{' '}
                  <strong className="text-white font-mono text-sm">{nearestStation.distanceKm} km</strong> away from you!
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-forest-dark font-bold text-xs transition-all shadow-md flex items-center gap-1.5"
            >
              <Compass className="w-4 h-4" />
              <span>Drive in Google Maps</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          )}

          <button
            onClick={onRequestLocation}
            disabled={isLoadingStations}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors border border-white/10"
            title="Recalculate GPS location"
          >
            <RotateCw className={`w-4 h-4 ${isLoadingStations ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-amber-950">Location Permission Currently Blocked</h4>
            <p className="text-amber-800 leading-relaxed max-w-2xl">
              To find EV stations nearest to your real-world location, please allow location access by clicking the lock or tune icon (🔒) on the left of your browser address bar and changing Location to <strong>"Allow"</strong>.
            </p>
          </div>
        </div>

        <button
          onClick={onRequestLocation}
          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-all shadow-xs shrink-0"
        >
          Retry Permission Request
        </button>
      </div>
    );
  }

  // Idle, prompt, or requesting state
  return (
    <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-2 border-emerald-300/80 rounded-3xl p-6 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in">
      <div className="flex items-start gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0 mt-0.5">
          <MapPin className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
            Real GPS Geolocation
          </span>
          <h3 className="text-lg font-black text-slate-900">
            Find EV Stations Around Your Current Location
          </h3>
          <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
            Allow browser location permission so ChargeSmart can detect your actual GPS coordinates, query nearby real-world charging hubs from OpenStreetMap, and calculate exact driving distances.
          </p>
        </div>
      </div>

      <button
        onClick={onRequestLocation}
        disabled={status === 'requesting'}
        className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 group hover:scale-[1.02] shrink-0"
      >
        <Navigation className="w-4 h-4 transition-transform group-hover:rotate-45" />
        <span>{status === 'requesting' ? 'Acquiring GPS Signal...' : 'Enable Live GPS Location'}</span>
      </button>
    </div>
  );
};
