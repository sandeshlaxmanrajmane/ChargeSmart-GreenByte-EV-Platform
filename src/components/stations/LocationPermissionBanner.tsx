import React, { useState, useEffect, useRef } from 'react';
import { UserLocation, GeolocationStatus, GeocodeResult, locationService } from '../../services/locationService';
import {
  MapPin,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Compass,
  ExternalLink,
  ShieldAlert,
  Search,
  Sliders,
  Globe,
  Loader2,
  X,
} from 'lucide-react';
import { getGoogleMapsNavigationUrl } from '../../utils/geoUtils';

interface LocationPermissionBannerProps {
  status: GeolocationStatus;
  userLocation: UserLocation | null;
  nearestStation: { name: string; distanceKm: number; latitude: number; longitude: number } | null;
  onRequestLocation: () => void;
  onSelectManualLocation: (loc: UserLocation) => void;
  radiusKm: number;
  onChangeRadius: (radius: number) => void;
  isLoadingStations: boolean;
}

export const LocationPermissionBanner: React.FC<LocationPermissionBannerProps> = ({
  status,
  userLocation,
  nearestStation,
  onRequestLocation,
  onSelectManualLocation,
  radiusKm,
  onChangeRadius,
  isLoadingStations,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef<any>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (val.trim().length >= 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await locationService.searchLocations(val);
          setSearchResults(results);
          setShowDropdown(true);
        } catch {
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 350);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
      setIsSearching(false);
    }
  };

  const handleSelectResult = (item: GeocodeResult) => {
    const manualLoc = locationService.setManualLocation(
      item.latitude,
      item.longitude,
      item.displayName,
      item.city,
      item.country
    );
    onSelectManualLocation(manualLoc);
    setSearchQuery(item.city || item.displayName.split(',')[0]);
    setShowDropdown(false);
  };

  const mapsUrl =
    userLocation && nearestStation
      ? getGoogleMapsNavigationUrl(
          nearestStation.latitude,
          nearestStation.longitude,
          userLocation.latitude,
          userLocation.longitude
        )
      : null;

  return (
    <div className="space-y-4">
      {/* Main Location Status & Action Card */}
      <div className="bg-gradient-to-r from-emerald-950 via-forest to-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-emerald-500/30 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 animate-fade-in">
        {/* Left Information */}
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5 shadow-inner">
            {userLocation?.source === 'gps' ? (
              <Navigation className="w-6 h-6 animate-pulse text-emerald-300" />
            ) : (
              <MapPin className="w-6 h-6 text-teal-300" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              {userLocation ? (
                <>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {userLocation.source === 'gps' ? 'Live GPS Position' : 'Manual Search Location'}
                  </span>
                  {userLocation.accuracyMeters && userLocation.source === 'gps' && (
                    <span className="text-[11px] text-slate-300 font-mono">
                      ±{userLocation.accuracyMeters}m GPS precision
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400 font-mono">
                    {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                  </span>
                </>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Location Not Yet Set
                </span>
              )}
            </div>

            <div className="text-base sm:text-lg font-black text-white">
              {userLocation ? (
                userLocation.addressLabel || `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`
              ) : (
                'Find Real EV Charging Hubs Near You'
              )}
            </div>

            {userLocation && nearestStation ? (
              <div className="text-xs text-emerald-300 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
                <span>
                  Nearest charger: <strong className="text-white">{nearestStation.name}</strong> is{' '}
                  <strong className="text-emerald-300 font-mono text-sm">{nearestStation.distanceKm} km</strong> away
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                Click "Use My Current Location" or type any city, postal code, or landmark below to query real EV chargers from OpenStreetMap.
              </p>
            )}
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 justify-start lg:justify-end shrink-0">
          <button
            onClick={onRequestLocation}
            disabled={status === 'requesting' || isLoadingStations}
            className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-forest-dark font-extrabold text-xs transition-all shadow-md hover:shadow-emerald-500/25 flex items-center gap-2 group disabled:opacity-60"
          >
            <Navigation className={`w-4 h-4 transition-transform ${status === 'requesting' ? 'animate-spin' : 'group-hover:rotate-45'}`} />
            <span>{status === 'requesting' ? 'Acquiring GPS...' : 'Use My Current Location'}</span>
          </button>

          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors border border-white/20 flex items-center gap-1.5"
            >
              <Compass className="w-4 h-4 text-emerald-300" />
              <span>Route in Google Maps</span>
              <ExternalLink className="w-3 h-3 ml-0.5 text-slate-300" />
            </a>
          )}
        </div>
      </div>

      {/* Manual Search & Radius Toolbar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-card border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search input with autocomplete */}
        <div className="relative flex-1">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter city, street, PIN code, or landmark (e.g., London, Munich, Indiranagar, 94103)..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => {
                if (searchResults.length > 0) setShowDropdown(true);
              }}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/70"
            />
            {isSearching && (
              <Loader2 className="w-4 h-4 text-emerald-600 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
            )}
            {searchQuery && !isSearching && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowDropdown(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden max-h-60 overflow-y-auto">
              <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                OpenStreetMap Geocoded Places
              </div>
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectResult(item)}
                  className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 transition-colors border-b border-slate-50 last:border-none flex items-start gap-2.5 group"
                >
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-900">
                      {item.city || item.displayName.split(',')[0]}
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">
                      {item.displayName}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Radius Selector */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <span className="text-slate-500 font-semibold text-xs flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-emerald-600" /> Radius:
          </span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {[5, 10, 25, 50, 100].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onChangeRadius(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  radiusKm === r
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {r}km
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Permission Denied Notice (if triggered) */}
      {status === 'denied' && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 sm:p-5 text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="font-bold text-sm text-amber-950">Location Permission Blocked by Browser</h4>
              <p className="text-amber-800 leading-relaxed max-w-2xl">
                Your browser blocked location access. You can either enable location in browser settings or use the manual search box above to find EV chargers in any city or PIN code.
              </p>
            </div>
          </div>
          <button
            onClick={onRequestLocation}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-all shadow-xs shrink-0"
          >
            Retry GPS Access
          </button>
        </div>
      )}
    </div>
  );
};
