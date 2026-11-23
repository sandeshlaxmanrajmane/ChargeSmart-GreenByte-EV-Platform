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
import { MapPin, Info, ShieldCheck, Sparkles, Navigation, RotateCw, RefreshCw, CheckCircle2 } from 'lucide-react';

interface StationsPageProps {
  currencySymbol: string;
  setActiveTab: (tab: string) => void;
  onSelectStationForPlan?: (station: ChargingStation) => void;
}

export const StationsPage: React.FC<StationsPageProps> = ({
  currencySymbol,
  setActiveTab,
  onSelectStationForPlan,
}) => {
  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [filters, setFilters] = useState<StationFilterParams>({
    searchQuery: '',
    connectorType: 'ALL',
    minPowerKw: 0,
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
    // Initial sync with backend to fetch verified owner stations
    stationService.syncWithBackend();

    const unsubscribeLocation = locationService.subscribe((loc, status) => {
      setUserLocation(loc);
      setLocationStatus(status);
      if (loc) {
        const updated = locationService.recalculateDistances(stationService.getAllStations(), loc);
        setStations(updated);
      }
    });

    const unsubscribeStations = stationService.subscribe(() => {
      const all = stationService.getAllStations();
      if (userLocation) {
        setStations(locationService.recalculateDistances(all, userLocation));
      } else {
        setStations(all);
      }
    });

    return () => {
      unsubscribeLocation();
      unsubscribeStations();
    };
  }, [userLocation]);

  const fetchStationsForCoordinates = async (lat: number, lon: number, radiusM: number, locationName: string) => {
    setIsLoadingStations(true);
    try {
      showToast('info', 'Searching Stations', `Querying charging stations near ${locationName}...`);
      const realStations = await locationService.fetchRealNearbyStations(lat, lon, radiusM);

      if (realStations.length > 0) {
        stationService.setStations(realStations);
        setStations(realStations);
        setSelectedStation(realStations[0]);
        showToast(
          'success',
          'Stations Discovered',
          `Found ${realStations.length} EV charging stations within ${radiusM / 1000}km of ${locationName}!`
        );
      } else {
        const updated = locationService.recalculateDistances(stationService.getAllStations(), {
          latitude: lat,
          longitude: lon,
          timestamp: Date.now(),
          source: 'manual',
        });
        setStations(updated);
        showToast(
          'info',
          'Search Results',
          `No charging stations were mapped in this radius. Showing regional stations.`
        );
      }
    } catch (err: any) {
      showToast('warning', 'Query Warning', 'Could not retrieve live stations from network. Showing cached stations.');
    } finally {
      setIsLoadingStations(false);
    }
  };

  const handleRequestLocation = async () => {
    setIsLoadingStations(true);
    try {
      showToast('info', 'Acquiring GPS', 'Requesting satellite coordinates from your device...');
      const loc = await locationService.requestCurrentLocation();
      setUserLocation(loc);
      setLocationStatus('granted');

      await fetchStationsForCoordinates(
        loc.latitude,
        loc.longitude,
        radiusKm * 1000,
        loc.city || loc.addressLabel || 'your location'
      );
    } catch (err: any) {
      showToast('warning', 'Location Not Available', err.message || 'Please enable GPS permission or search manually.');
    } finally {
      setIsLoadingStations(false);
    }
  };

  const handleSelectManualLocation = async (manualLoc: UserLocation) => {
    setUserLocation(manualLoc);
    await fetchStationsForCoordinates(
      manualLoc.latitude,
      manualLoc.longitude,
      radiusKm * 1000,
      manualLoc.city || manualLoc.addressLabel || 'selected area'
    );
  };

  const handleChangeRadius = (newRadiusKm: number) => {
    setRadiusKm(newRadiusKm);
    if (userLocation) {
      fetchStationsForCoordinates(
        userLocation.latitude,
        userLocation.longitude,
        newRadiusKm * 1000,
        userLocation.city || 'your area'
      );
    }
  };

  const handleRefresh = () => {
    if (userLocation) {
      fetchStationsForCoordinates(
        userLocation.latitude,
        userLocation.longitude,
        radiusKm * 1000,
        userLocation.city || 'your location'
      );
    } else {
      handleRequestLocation();
    }
  };

  // Filter stations based on current state
  const filteredStations = stationService.filterStations({
    ...filters,
    maxDistanceKm: radiusKm,
  });

  const nearestStation = filteredStations.length > 0 ? filteredStations[0] : null;

  const handleSelectStation = (station: ChargingStation) => {
    setSelectedStation(station);
    setModalStation(station);
  };

  const handlePlanAtStation = (station: ChargingStation) => {
    if (onSelectStationForPlan) {
      onSelectStationForPlan(station);
    }
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
                ? `${userLocation.source === 'gps' ? 'Live GPS Location' : 'Geocoded Search'}: ${userLocation.city || 'Detected'}`
                : 'ChargeSmart Unified Network'}
            </span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
            EV Charging Station Finder
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Locate real public EV chargers globally with verified connectors, speeds, and clean energy provenance.
          </p>
        </div>

        {/* Global GPS / Refresh Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRequestLocation}
            disabled={isLoadingStations}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Use My Location</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={isLoadingStations}
            className="p-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors"
            title="Refresh Station Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingStations ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Location Permission & Manual Search Banner */}
      <LocationPermissionBanner
        status={locationStatus}
        userLocation={userLocation}
        nearestStation={
          nearestStation
            ? {
                name: nearestStation.name,
                distanceKm: nearestStation.distanceKm,
                latitude: nearestStation.latitude,
                longitude: nearestStation.longitude,
              }
            : null
        }
        onRequestLocation={handleRequestLocation}
        onSelectManualLocation={handleSelectManualLocation}
        radiusKm={radiusKm}
        onChangeRadius={handleChangeRadius}
        isLoadingStations={isLoadingStations}
      />

      {/* Filter Bar */}
      <StationFilterBar
        filters={filters}
        onFilterChange={(partial) => setFilters((prev) => ({ ...prev, ...partial }))}
        currencySymbol={currencySymbol}
      />

      {/* Interactive Map */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
          <span className="flex items-center gap-1.5 font-bold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Interactive Station Map & Road Navigation
          </span>
          <span>Click any marker to inspect hardware specifications</span>
        </div>

        <StationMap
          stations={filteredStations}
          selectedStationId={selectedStation?.id || null}
          onSelectStation={handleSelectStation}
          currencySymbol={currencySymbol}
          userLocation={userLocation}
        />
      </div>

      {/* Stations List View */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            Nearby Charging Hubs ({filteredStations.length})
          </h3>
          <span className="text-xs text-slate-400">
            Sorted by: <strong className="text-slate-700 uppercase font-mono">{filters.sortBy || 'distance'}</strong>
          </span>
        </div>

        <StationList
          stations={filteredStations}
          selectedStationId={selectedStation?.id || null}
          onSelectStation={handleSelectStation}
          currencySymbol={currencySymbol}
        />
      </div>

      {/* Station Detail Modal */}
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
