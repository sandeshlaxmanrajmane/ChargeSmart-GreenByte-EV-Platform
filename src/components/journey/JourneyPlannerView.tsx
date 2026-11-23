import React, { useState, useEffect } from 'react';
import { VEHICLE_PRESETS } from '../../data/mockData';
import { ChargingStation, RouteResult, RouteChargingStop, JourneyPlan, VehicleProfile } from '../../types';
import { routingService } from '../../services/routingService';
import { locationService, GeocodeResult, UserLocation } from '../../services/locationService';
import { stationService } from '../../services/stationService';
import { storageService } from '../../services/storageService';
import { JourneyMap } from './JourneyMap';
import { showToast } from '../common/Toast';
import {
  Compass,
  MapPin,
  Navigation,
  Car,
  Battery,
  Zap,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Clock,
  DollarSign,
  Download,
  BookmarkCheck,
  RotateCw,
  Search,
  CheckCircle2,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react';

interface JourneyPlannerViewProps {
  currencySymbol: string;
}

export const JourneyPlannerView: React.FC<JourneyPlannerViewProps> = ({ currencySymbol }) => {
  // Start and Destination locations
  const [startQuery, setStartQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [startLocation, setStartLocation] = useState<{ name: string; latitude: number; longitude: number } | null>({
    name: 'Bengaluru Central, Karnataka',
    latitude: 12.9716,
    longitude: 77.5946,
  });
  const [destLocation, setDestLocation] = useState<{ name: string; latitude: number; longitude: number } | null>({
    name: 'Mysuru Palace, Karnataka',
    latitude: 12.3051,
    longitude: 76.6551,
  });

  const [startSuggestions, setStartSuggestions] = useState<GeocodeResult[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<GeocodeResult[]>([]);
  const [isSearchingStart, setIsSearchingStart] = useState(false);
  const [isSearchingDest, setIsSearchingDest] = useState(false);

  // Vehicle Parameters
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(VEHICLE_PRESETS[1].id); // Tata Nexon EV
  const [batteryCapacityKwh, setBatteryCapacityKwh] = useState<number>(40.5);
  const [ratedRangeKm, setRatedRangeKm] = useState<number>(325);
  const [vehicleName, setVehicleName] = useState<string>(VEHICLE_PRESETS[1].name);

  // Battery States
  const [currentSocPercent, setCurrentSocPercent] = useState<number>(55);
  const [targetArrivalBufferPercent, setTargetArrivalBufferPercent] = useState<number>(15);

  // Routing and Calculation States
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [corridorStations, setCorridorStations] = useState<ChargingStation[]>([]);
  const [selectedStops, setSelectedStops] = useState<RouteChargingStop[]>([]);
  const [activeJourneyPlan, setActiveJourneyPlan] = useState<JourneyPlan | null>(null);

  // Auto-fill vehicle specs on vehicle change
  const handleVehicleChange = (id: string) => {
    setSelectedVehicleId(id);
    const preset = VEHICLE_PRESETS.find((v: VehicleProfile) => v.id === id);
    if (preset) {
      setBatteryCapacityKwh(preset.batteryCapacityKwh);
      setVehicleName(preset.name);
      // Approximate range ~ 7.5 to 8 km per kWh for modern EVs
      const estRange = Math.round(preset.batteryCapacityKwh * 7.8);
      setRatedRangeKm(estRange);
    }
  };

  // Search start location
  const handleStartSearch = async (val: string) => {
    setStartQuery(val);
    if (val.trim().length >= 2) {
      setIsSearchingStart(true);
      try {
        const results = await locationService.searchLocations(val);
        setStartSuggestions(results);
      } catch {
        setStartSuggestions([]);
      } finally {
        setIsSearchingStart(false);
      }
    } else {
      setStartSuggestions([]);
    }
  };

  // Search destination location
  const handleDestSearch = async (val: string) => {
    setDestQuery(val);
    if (val.trim().length >= 2) {
      setIsSearchingDest(true);
      try {
        const results = await locationService.searchLocations(val);
        setDestSuggestions(results);
      } catch {
        setDestSuggestions([]);
      } finally {
        setIsSearchingDest(false);
      }
    } else {
      setDestSuggestions([]);
    }
  };

  const handleUseCurrentLocationForStart = async () => {
    try {
      showToast('info', 'GPS', 'Acquiring your location for journey start...');
      const loc = await locationService.requestCurrentLocation();
      setStartLocation({
        name: loc.addressLabel || `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`,
        latitude: loc.latitude,
        longitude: loc.longitude,
      });
      setStartQuery(loc.addressLabel || 'Current GPS Location');
      showToast('success', 'Origin Set', 'Current location set as route starting point.');
    } catch (e: any) {
      showToast('warning', 'GPS Error', e.message || 'Could not acquire GPS.');
    }
  };

  // Compute Route and Plan
  const calculateRouteAndPlan = async () => {
    if (!startLocation || !destLocation) {
      showToast('warning', 'Incomplete Route', 'Please select both start and destination points.');
      return;
    }

    setIsCalculatingRoute(true);
    try {
      showToast('info', 'Calculating Route', 'Finding optimal driving road path & charging corridor...');

      // 1. Calculate OSRM route
      const route = await routingService.calculateRoute(
        startLocation.latitude,
        startLocation.longitude,
        destLocation.latitude,
        destLocation.longitude
      );
      setRouteResult(route);

      // 2. Fetch or filter candidate stations situated along route
      const allStations = stationService.getAllStations();
      const corridor = routingService.findStationsAlongRoute(route.coordinates, allStations, 15.0);
      setCorridorStations(corridor);

      // 3. Generate Complete Journey Plan
      const plan = routingService.planJourney({
        startLocation,
        destLocation,
        vehicleName,
        batteryCapacityKwh,
        ratedRangeKm,
        currentSocPercent,
        targetArrivalBufferPercent,
        routeResult: route,
        availableStations: corridor.length > 0 ? corridor : allStations,
      });

      setActiveJourneyPlan(plan);
      setSelectedStops(plan.chargingStops);

      showToast(
        'success',
        'Route Planned',
        `Route calculated: ${route.distanceKm} km (${route.durationFormatted}).`
      );
    } catch (err: any) {
      showToast('warning', 'Routing Error', err.message || 'Route calculation failed.');
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  // Initial calculation on mount
  useEffect(() => {
    calculateRouteAndPlan();
  }, []);

  // Toggle or Select station stop manually
  const handleToggleStationStop = (station: ChargingStation) => {
    const exists = selectedStops.find((s) => s.station.id === station.id);
    if (exists) {
      setSelectedStops(selectedStops.filter((s) => s.station.id !== station.id));
      showToast('info', 'Stop Removed', `Removed ${station.name} from charging stops.`);
    } else {
      // Calculate stop metrics
      const energyNeeded = Number((batteryCapacityKwh * 0.5).toFixed(1));
      const effectiveKw = Math.min(station.maxPowerKw, 100);
      const mins = Math.round((energyNeeded / effectiveKw) * 60);
      const cost = Number((energyNeeded * (station.pricePerKwh || 0.18)).toFixed(2));

      const newStop: RouteChargingStop = {
        station,
        distanceFromStartKm: routeResult ? Number((routeResult.distanceKm * 0.5).toFixed(1)) : 50,
        estimatedArrivalSocPercent: 25,
        targetDepartureSocPercent: 80,
        energyNeededKwh: energyNeeded,
        chargingDurationMinutes: mins,
        estimatedCost: cost,
      };

      setSelectedStops([...selectedStops, newStop]);
      showToast('success', 'Stop Added', `Added ${station.name} (${station.maxPowerKw}kW) as a charging stop.`);
    }
  };

  const handleSaveJourney = () => {
    if (!activeJourneyPlan) return;
    const planToSave = {
      ...activeJourneyPlan,
      chargingStops: selectedStops,
    };
    storageService.saveJourneyPlan(planToSave);
    showToast('success', 'Journey Saved', 'Journey itinerary saved to your local storage.');
  };

  const handleExportJourney = () => {
    if (!activeJourneyPlan) return;
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify({ ...activeJourneyPlan, chargingStops: selectedStops }, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `ChargeSmart_Journey_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Usable range computation
  const usableSoc = Math.max(0, currentSocPercent - targetArrivalBufferPercent);
  const currentUsableRangeKm = Math.round(ratedRangeKm * (usableSoc / 100.0));
  const requiresStop = routeResult ? routeResult.distanceKm > currentUsableRangeKm : false;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      {/* Page Title & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-0.5 rounded-full border border-emerald-300">
              Long-Distance Navigation
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Routing Provider: OSRM Driving Engine
            </span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
            EV Journey Planner
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Plot long-distance routes, discover verified charging stations along highway corridors, and calculate required stop times.
          </p>
        </div>

        {activeJourneyPlan && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveJourney}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1.5"
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>Save Itinerary</span>
            </button>
            <button
              onClick={handleExportJourney}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 transition-colors shadow-xs flex items-center gap-1.5"
              title="Export as JSON"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Inputs vs Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Route Origins Card */}
          <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-emerald-600" /> Route Waypoints
            </h3>

            {/* Starting Location Input */}
            <div className="relative">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Start Origin
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Enter starting city or address..."
                  value={startQuery || (startLocation ? startLocation.name : '')}
                  onChange={(e) => handleStartSearch(e.target.value)}
                  className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
                />
                <button
                  type="button"
                  onClick={handleUseCurrentLocationForStart}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200"
                >
                  Use GPS
                </button>
              </div>

              {/* Start Suggestions Dropdown */}
              {startSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 z-50 max-h-48 overflow-y-auto">
                  {startSuggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setStartLocation({
                          name: s.displayName,
                          latitude: s.latitude,
                          longitude: s.longitude,
                        });
                        setStartQuery(s.city || s.displayName.split(',')[0]);
                        setStartSuggestions([]);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 text-xs border-b border-slate-100 last:border-none"
                    >
                      <div className="font-bold text-slate-900">{s.city || s.displayName.split(',')[0]}</div>
                      <div className="text-[10px] text-slate-400 truncate">{s.displayName}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Destination Input */}
            <div className="relative">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Destination Point
              </label>
              <div className="relative">
                <Navigation className="w-4 h-4 text-sky-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Enter destination city or landmark..."
                  value={destQuery || (destLocation ? destLocation.name : '')}
                  onChange={(e) => handleDestSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50/50"
                />
              </div>

              {/* Destination Suggestions Dropdown */}
              {destSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 z-50 max-h-48 overflow-y-auto">
                  {destSuggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setDestLocation({
                          name: s.displayName,
                          latitude: s.latitude,
                          longitude: s.longitude,
                        });
                        setDestQuery(s.city || s.displayName.split(',')[0]);
                        setDestSuggestions([]);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-sky-50 text-xs border-b border-slate-100 last:border-none"
                    >
                      <div className="font-bold text-slate-900">{s.city || s.displayName.split(',')[0]}</div>
                      <div className="text-[10px] text-slate-400 truncate">{s.displayName}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 2. Vehicle & Battery Specs */}
          <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-emerald-600" /> Vehicle Model & Battery Specs
            </h3>

            {/* Vehicle Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Select EV</label>
              <select
                value={selectedVehicleId}
                onChange={(e) => handleVehicleChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {VEHICLE_PRESETS.map((v: VehicleProfile) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.batteryCapacityKwh} kWh • {v.maxChargingPowerKw} kW max)
                  </option>
                ))}
              </select>
            </div>

            {/* Battery Capacity and Estimated Range */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Battery Pack (kWh)
                </label>
                <input
                  type="number"
                  min="2"
                  max="200"
                  step="0.5"
                  value={batteryCapacityKwh}
                  onChange={(e) => setBatteryCapacityKwh(parseFloat(e.target.value) || 40)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Full Range (km)
                </label>
                <input
                  type="number"
                  min="30"
                  max="1000"
                  value={ratedRangeKm}
                  onChange={(e) => setRatedRangeKm(parseInt(e.target.value) || 300)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 bg-slate-50/50"
                />
              </div>
            </div>

            {/* Current SoC Slider */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <Battery className="w-3.5 h-3.5 text-emerald-600" /> Current Battery Level
                </span>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  {currentSocPercent}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={currentSocPercent}
                onChange={(e) => setCurrentSocPercent(parseInt(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                <span>5% (Low)</span>
                <span>Usable range now: ~{currentUsableRangeKm} km</span>
                <span>100% (Full)</span>
              </div>
            </div>

            {/* Recalculate Button */}
            <button
              onClick={calculateRouteAndPlan}
              disabled={isCalculatingRoute}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RotateCw className={`w-4 h-4 ${isCalculatingRoute ? 'animate-spin' : ''}`} />
              <span>{isCalculatingRoute ? 'Calculating Driving Route...' : 'Calculate Route & Charging Stops'}</span>
            </button>
          </div>
        </div>

        {/* Right Map & Results Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Interactive Leaflet Route Map */}
          <JourneyMap
            startLocation={startLocation}
            destLocation={destLocation}
            routeResult={routeResult}
            chargingStops={selectedStops}
            corridorStations={corridorStations}
            onSelectStation={handleToggleStationStop}
            currencySymbol={currencySymbol}
          />

          {/* Route Metrics Summary Cards */}
          {routeResult && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  Road Distance
                </div>
                <div className="text-xl font-black text-slate-900 font-mono">
                  {routeResult.distanceKm} <span className="text-xs font-normal text-slate-500">km</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{routeResult.durationFormatted} drive</div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  Est. Energy
                </div>
                <div className="text-xl font-black text-teal-700 font-mono">
                  {activeJourneyPlan ? activeJourneyPlan.estimatedEnergyKwh : '--'}{' '}
                  <span className="text-xs font-normal text-slate-500">kWh</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">@ ~7.8 km/kWh</div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  Usable Range
                </div>
                <div className="text-xl font-black text-slate-900 font-mono">
                  {currentUsableRangeKm} <span className="text-xs font-normal text-slate-500">km</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">To {targetArrivalBufferPercent}% buffer</div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  Charging Stops
                </div>
                <div className="text-xl font-black font-mono">
                  {selectedStops.length > 0 ? (
                    <span className="text-amber-600">{selectedStops.length} Stop{selectedStops.length > 1 ? 's' : ''}</span>
                  ) : requiresStop ? (
                    <span className="text-rose-600">Stop Needed</span>
                  ) : (
                    <span className="text-emerald-600">0 Stops</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {requiresStop ? 'Range exceeded' : 'Single charge OK'}
                </div>
              </div>
            </div>
          )}

          {/* Range Feasibility Banner */}
          {routeResult && (
            <div
              className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                requiresStop
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              {requiresStop ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <h4 className="font-bold text-sm">
                  {requiresStop
                    ? 'Intermediate Charging Stop Recommended'
                    : 'Feasible on Current Battery Charge'}
                </h4>
                <p className="leading-relaxed text-[11px]">
                  {requiresStop
                    ? `Your road trip distance (${routeResult.distanceKm} km) exceeds your vehicle's current safe range (${currentUsableRangeKm} km before ${targetArrivalBufferPercent}% reserve). ChargeSmart has mapped candidate charging stations situated along your highway corridor below.`
                    : `Your safe battery range (~${currentUsableRangeKm} km) is sufficient to reach ${destLocation?.name} with a ${targetArrivalBufferPercent}% reserve cushion.`}
                </p>
              </div>
            </div>
          )}

          {/* Selected Charging Stops Table */}
          {selectedStops.length > 0 && (
            <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" /> Planned Charging Stops Along Route ({selectedStops.length})
                </h4>
                <span className="text-xs text-slate-500">
                  Total Charging Time:{' '}
                  <strong className="text-slate-900 font-mono">
                    {selectedStops.reduce((a, b) => a + b.chargingDurationMinutes, 0)} mins
                  </strong>
                </span>
              </div>

              <div className="space-y-2.5">
                {selectedStops.map((stop, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                          Stop #{i + 1}
                        </span>
                        <strong className="text-slate-900 text-sm">{stop.station.name}</strong>
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        {stop.station.operator} • {stop.station.maxPowerKw} kW Speed • {stop.station.renewableInfo.greenSharePercent}% Clean Energy
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="text-[11px] text-slate-400">Charge to 80%</div>
                        <div className="font-mono font-bold text-slate-900">
                          +{stop.energyNeededKwh} kWh (~{stop.chargingDurationMinutes}m)
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400">Est. Cost</div>
                        <div className="font-mono font-bold text-emerald-700">
                          {currencySymbol}{stop.estimatedCost.toFixed(2)}
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleStationStop(stop.station)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-bold p-1"
                        title="Remove Stop"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mandatory Model Disclaimer Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-[11px] flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              <strong>Model Disclaimer:</strong> Road distance and drive times are provided by OSRM. Range and energy consumption are model estimates. Real-world EV range varies with cruising speeds, payload weight, ambient temperature, elevation changes, and climate control.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
