import React, { useState, useEffect } from 'react';
import { stationService, StationFilterParams } from '../services/stationService';
import {
  locationService,
  UserLocation,
  GeolocationStatus,
} from '../services/locationService';
import { ChargingStation } from '../types';
import { StationMap } from '../components/stations/StationMap';
import { StationList } from '../components/stations/StationList';
import { StationFilterBar } from '../components/stations/StationFilterBar';
import { StationDetailModal } from '../components/stations/StationDetailModal';
import { LocationPermissionBanner } from '../components/stations/LocationPermissionBanner';
import { showToast } from '../components/common/Toast';
import { MapPin, Info, ShieldCheck, Sparkles, Navigation, RotateCw } from 'lucide-react';

interface StationsPageProps {
  currencySymbol: string;
  setActiveTab: (tab: string) => void;
}

export const StationsPage: React.FC<StationsPageProps> = ({
  currencySymbol,
  setActiveTab,
}) => {
  const [filters, setFilters] = useState<StationFilterParams>({
    searchQuery: '',
    connectorType: 'ALL',
    onlyVerifiedRenewable: false,
    sortBy: 'distance',
  });

  const [stations, setStations] = useState<ChargingStation[]>(() => stationService.getAllStations());
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);
  const [modalStation, setModalStation] = useState<ChargingStation | null>(null);

  // Real Geolocation States
  const [userLocation, setUserLocation] = useState<UserLocation | null>(() =>
    locationService.getUserLocation()
  );
  const [locationStatus, setLocationStatus] = useState<GeolocationStatus>(() =>
    locationService.getStatus()
  );
  const [isLoadingStations, setIsLoadingStations] = useState(false);

  useEffect(() => {
    const unsubscribe = locationService.subscribe((loc, status) => {
      setUserLocation(loc);
      setLocationStatus(status);
      if (loc) {
        // Recalculate distances for existing stations
        const updated = locationService.recalculateDistances(stationService.getAllStations(), loc);
        setStations(updated);
      }
    });

    // Auto-prompt location if idle or prompt
    if (locationStatus === 'idle' || locationStatus === 'prompt') {
      handleRequestLocation();
    }

    return () => {
      unsubscribe();
    };
  }, []);

  const handleRequestLocation = async () => {
    setIsLoadingStations(true);
    try {
      showToast('info', 'Requesting Location', 'Acquiring GPS satellite position from your device...');
      const loc = await locationService.requestCurrentLocation();
      setUserLocation(loc);
      setLocationStatus('granted');

      // Fetch real OSM stations near user's GPS coordinates
      const realOsmStations = await locationService.fetchRealNearbyStations(
        loc.latitude,
        loc.longitude,
        25000
      );

      let allStations: ChargingStation[] = [];
      if (realOsmStations.length > 0) {
        allStations = realOsmStations;
        showToast(
          'success',
          'Live Stations Located',
          `Discovered ${realOsmStations.length} real EV charging stations near ${loc.city || 'you'}!`
        );
      } else {
        // Fallback to demo stations with real recalculated distances
        allStations = locationService.recalculateDistances(stationService.getAllStations(), loc);
        showToast(
          'success',
          'GPS Location Acquired',
          `Positioned at ${loc.addressLabel || 'your area'}. Nearest charger is ${allStations[0]?.distanceKm} km away.`
        );
      }

      setStations(allStations);
      if (allStations.length > 0) {
        setSelectedStation(allStations[0]);
      }
    } catch (err: any) {
      showToast('warning', 'Location Restricted', err.message || 'Please enable GPS permission.');
    } finally {
      setIsLoadingStations(false);
    }
  };

  // Filter stations based on current state
  let filteredStations = [...stations];

  if (filters.searchQuery && filters.searchQuery.trim() !== '') {
    const q = filters.searchQuery.toLowerCase();
    filteredStations = filteredStations.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.operator.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q)
    );
  }

  if (filters.connectorType && filters.connectorType !== 'ALL') {
    filteredStations = filteredStations.filter((s) =>
      s.connectors.some((c) => c.type === filters.connectorType && c.available > 0)
    );
  }

  if (filters.onlyVerifiedRenewable) {
    filteredStations = filteredStations.filter(
      (s) => s.renewableInfo.verified && s.renewableInfo.greenSharePercent >= 70
    );
  }

  // Sort
  const sort = filters.sortBy || 'distance';
  filteredStations.sort((a, b) => {
    if (sort === 'distance') return a.distanceKm - b.distanceKm;
    if (sort === 'price') return a.pricePerKwh - b.pricePerKwh;
    if (sort === 'power') return b.maxPowerKw - a.maxPowerKw;
    if (sort === 'renewable') return b.renewableInfo.greenSharePercent - a.renewableInfo.greenSharePercent;
    return 0;
  });

  const nearestStation = filteredStations.length > 0 ? filteredStations[0] : null;

  const handleSelectStation = (station: ChargingStation) => {
    setSelectedStation(station);
    setModalStation(station);
  };

  const handlePlanAtStation = (station: ChargingStation) => {
    setActiveTab('planner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Title & Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-0.5 rounded-full border border-emerald-300">
              Clean Infrastructure Discovery
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {userLocation
                ? `Active GPS Area: ${userLocation.city || 'Detected'}`
                : 'Demo Region: Bengaluru EcoGrid'}
            </span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
            EV Charging Station Finder
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Find fast DC and AC chargers with transparent, verified renewable energy supply badges.
          </p>
        </div>

        {/* Total found badge */}
        <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-emerald-950 text-xs font-bold self-start sm:self-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{filteredStations.length} Stations Found</span>
        </div>
      </div>

      {/* Geolocation Permission Banner */}
      <LocationPermissionBanner
        status={locationStatus}
        userLocation={userLocation}
        nearestStation={nearestStation}
        onRequestLocation={handleRequestLocation}
        isLoadingStations={isLoadingStations}
      />

      {/* Filter Bar */}
      <StationFilterBar
        filters={filters}
        onFilterChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
        currencySymbol={currencySymbol}
      />

      {/* Interactive Leaflet Map with Real User Pin */}
      <StationMap
        stations={filteredStations}
        selectedStationId={selectedStation ? selectedStation.id : null}
        onSelectStation={handleSelectStation}
        currencySymbol={currencySymbol}
        userLocation={userLocation}
      />

      {/* Station List Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <span>
              {userLocation ? 'Charging Hubs Sorted by Distance from You' : 'Available Charging Locations'} ({filteredStations.length})
            </span>
          </h3>

          {userLocation && (
            <span className="text-xs text-emerald-700 font-semibold font-mono">
              GPS Position: {userLocation.latitude.toFixed(3)}°N, {userLocation.longitude.toFixed(3)}°E
            </span>
          )}
        </div>

        <StationList
          stations={filteredStations}
          selectedStationId={selectedStation ? selectedStation.id : null}
          onSelectStation={handleSelectStation}
          currencySymbol={currencySymbol}
        />
      </div>

      {/* Station Details Modal */}
      {modalStation && (
        <StationDetailModal
          station={modalStation}
          currencySymbol={currencySymbol}
          onClose={() => setModalStation(null)}
          onPlanAtStation={handlePlanAtStation}
          userLocation={userLocation}
        />
      )}
    </div>
  );
};
