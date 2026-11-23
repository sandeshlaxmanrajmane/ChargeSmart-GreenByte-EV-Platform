import React, { useState, useEffect } from 'react';
import { ownerService } from '../../services/ownerService';
import { OwnerStation, StationOwner, OwnerAnalytics, ChargingStation } from '../../types';
import { AddStationModal } from './AddStationModal';
import { AddChargerModal } from './AddChargerModal';
import { ChargerControlBoard } from './ChargerControlBoard';
import { showToast } from '../common/Toast';
import {
  Building2,
  Zap,
  PlusCircle,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  LogOut,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  Phone,
  Mail,
  Trash2,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface OwnerDashboardViewProps {
  currencySymbol: string;
  setActiveTab: (tab: string) => void;
  onSelectStationForPlan?: (station: ChargingStation) => void;
}

export const OwnerDashboardView: React.FC<OwnerDashboardViewProps> = ({
  currencySymbol,
  setActiveTab,
  onSelectStationForPlan,
}) => {
  const [owner, setOwner] = useState<StationOwner | null>(() => ownerService.getOwner());
  const [stations, setStations] = useState<OwnerStation[]>([]);
  const [analytics, setAnalytics] = useState<OwnerAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'stations' | 'chargers' | 'analytics'>('overview');

  // Modals
  const [isAddStationOpen, setIsAddStationOpen] = useState(false);
  const [isAddChargerOpen, setIsAddChargerOpen] = useState(false);
  const [targetStationForCharger, setTargetStationForCharger] = useState<string | undefined>();

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedStations, fetchedAnalytics] = await Promise.all([
        ownerService.getStations(),
        ownerService.getAnalytics(),
      ]);
      setStations(fetchedStations);
      setAnalytics(fetchedAnalytics);
    } catch (err: any) {
      console.warn('Could not load owner dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = ownerService.subscribe(() => {
      loadData();
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await ownerService.logout();
    showToast('info', 'Logged Out', 'You have been safely signed out of the Station Owner Portal.');
    setActiveTab('home');
  };

  const handleDeleteStation = async (stationId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove station '${name}' and all its chargers?`)) {
      return;
    }
    try {
      await ownerService.deleteStation(stationId);
      showToast('info', 'Station Deleted', `Removed ${name}`);
      loadData();
    } catch (err: any) {
      showToast('warning', 'Delete Failed', err.message);
    }
  };

  // Pie chart data
  const statusPieData = [
    { name: 'Available', value: analytics?.availableChargers || 0, color: '#10B981' },
    { name: 'Occupied', value: analytics?.occupiedChargers || 0, color: '#F59E0B' },
    { name: 'Maintenance/Offline', value: analytics?.offlineChargers || 0, color: '#EF4444' },
  ].filter((d) => d.value > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-forest via-emerald-950 to-slate-900 text-white shadow-xl relative overflow-hidden">
        {/* Soft background ambient glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
            </span>
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
              Verified Station Operator Portal
            </span>
            <span className="text-xs text-slate-400">• SQLite Database Synced</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {owner?.business_name || 'Station Owner Dashboard'}
          </h1>

          <p className="text-xs text-slate-300 flex items-center gap-2">
            <span>Operator: <strong>{owner?.full_name || 'Verified Owner'}</strong></span>
            <span>•</span>
            <span>{owner?.email}</span>
            {owner?.phone && (
              <>
                <span>•</span>
                <span>{owner.phone}</span>
              </>
            )}
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2 relative z-10">
          <button
            onClick={() => setIsAddStationOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Station</span>
          </button>

          <button
            onClick={() => {
              setTargetStationForCharger(stations.length > 0 ? stations[0].id : undefined);
              setIsAddChargerOpen(true);
            }}
            disabled={stations.length === 0}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-40"
          >
            <Zap className="w-4 h-4" />
            <span>Add Charger</span>
          </button>

          <button
            onClick={() => setActiveTab('stations')}
            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-1.5"
            title="View Public Discovery Map"
          >
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Public Map</span>
          </button>

          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-white/10 transition-colors"
            title="Log Out of Owner Portal"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Stations */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="text-slate-400 font-bold text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-emerald-600" /> Stations
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {analytics?.totalStations || stations.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Active public charging locations
          </div>
        </div>

        {/* Total Chargers */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="text-slate-400 font-bold text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-teal-600" /> Total Chargers
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {analytics?.totalChargers || 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Registered bay dispensers
          </div>
        </div>

        {/* Available Plugs */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-emerald-200 shadow-xs bg-emerald-50/20">
          <div className="text-emerald-700 font-bold text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Available
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
            {analytics?.availableChargers || 0}
          </div>
          <div className="text-[10px] text-emerald-600 mt-1">
            Ready for instant driver plug-in
          </div>
        </div>

        {/* Occupied Plugs */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-amber-200 shadow-xs bg-amber-50/20">
          <div className="text-amber-700 font-bold text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Occupied
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700 font-mono">
            {analytics?.occupiedChargers || 0}
          </div>
          <div className="text-[10px] text-amber-600 mt-1">
            Active charging sessions
          </div>
        </div>

        {/* Utilization Rate */}
        <div className="col-span-2 lg:col-span-1 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="text-slate-400 font-bold text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-forest" /> Utilization
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {analytics?.utilizationRatePercent || 0}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Current network occupancy load
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`pb-3 px-3 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'overview'
              ? 'border-emerald-600 text-emerald-900 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveSubTab('stations')}
          className={`pb-3 px-3 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'stations'
              ? 'border-emerald-600 text-emerald-900 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>My Stations ({stations.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('chargers')}
          className={`pb-3 px-3 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'chargers'
              ? 'border-emerald-600 text-emerald-900 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Charger Availability Control</span>
        </button>

        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`pb-3 px-3 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'analytics'
              ? 'border-emerald-600 text-emerald-900 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Audit Log & Telemetry</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Charger Control Board */}
          <ChargerControlBoard
            stations={stations}
            onRefresh={loadData}
            currencySymbol={currencySymbol}
          />

          {/* Quick Stations List */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Your Charging Station Hubs</h3>
              <button
                onClick={() => setActiveSubTab('stations')}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1"
              >
                <span>View all stations</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {stations.length === 0 ? (
              <div className="p-8 text-center rounded-3xl bg-white border border-slate-200">
                <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-800">No Stations Registered</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  Add your first charging station to broadcast real-time availability to thousands of EV drivers.
                </p>
                <button
                  onClick={() => setIsAddStationOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Register First Station</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stations.map((st) => (
                  <div
                    key={st.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {st.network_operator}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 font-mono">
                          {st.chargers?.length || 0} Bay{st.chargers?.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-2">{st.name}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{st.address}, {st.city}</span>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">
                        {st.operating_hours || '24/7 Access'}
                      </span>
                      <button
                        onClick={() => {
                          setTargetStationForCharger(st.id);
                          setIsAddChargerOpen(true);
                        }}
                        className="text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Add Charger</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY STATIONS */}
      {activeSubTab === 'stations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              Station Management ({stations.length} Locations)
            </h3>
            <button
              onClick={() => setIsAddStationOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Register New Station</span>
            </button>
          </div>

          <div className="space-y-4">
            {stations.map((st) => (
              <div
                key={st.id}
                className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                        {st.network_operator}
                      </span>
                      <span className="text-xs font-bold text-slate-500 font-mono">
                        GPS: {st.latitude.toFixed(4)}, {st.longitude.toFixed(4)}
                      </span>
                      {st.is_public ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Public Listing
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          Private
                        </span>
                      )}
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 mt-1">{st.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {st.address}, {st.city}, {st.state} {st.postal_code} ({st.country})
                    </p>
                    {st.description && (
                      <p className="text-xs text-slate-600 mt-2 max-w-2xl leading-relaxed">
                        {st.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setTargetStationForCharger(st.id);
                        setIsAddChargerOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-teal-600" />
                      <span>Add Charger</span>
                    </button>

                    <button
                      onClick={() => handleDeleteStation(st.id, st.name)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Station"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Facilities Badges */}
                {st.facilities && st.facilities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {st.facilities.map((fac) => (
                      <span
                        key={fac}
                        className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200"
                      >
                        {fac}
                      </span>
                    ))}
                  </div>
                )}

                {/* Station Charger Bays Table */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-600" /> Installed Chargers (
                    {st.chargers?.length || 0})
                  </div>

                  {(!st.chargers || st.chargers.length === 0) ? (
                    <div className="text-xs text-slate-400 italic py-2">
                      No chargers configured for this station yet. Click 'Add Charger' above.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {st.chargers.map((c) => (
                        <div
                          key={c.id}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-slate-900">{c.charger_identifier}</div>
                            <div className="text-[11px] text-slate-500">
                              {c.connector_type} • {c.power_kw} kW • {currencySymbol}
                              {c.price_per_kwh.toFixed(2)}/kWh
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              c.availability_status === 'Available'
                                ? 'bg-emerald-100 text-emerald-800'
                                : c.availability_status === 'Occupied'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {c.availability_status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CHARGER CONTROL BOARD */}
      {activeSubTab === 'chargers' && (
        <ChargerControlBoard
          stations={stations}
          onRefresh={loadData}
          currencySymbol={currencySymbol}
        />
      )}

      {/* TAB 4: AUDIT LOG & ANALYTICS */}
      {activeSubTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Breakdown Chart */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>Charger Status Distribution</span>
            </h3>

            {statusPieData.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      innerRadius={45}
                      paddingAngle={4}
                    >
                      {statusPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-xs text-slate-400">
                No active chargers to display
              </div>
            )}

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-emerald-800 font-bold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available
                </span>
                <span>{analytics?.availableChargers || 0}</span>
              </div>
              <div className="flex items-center justify-between text-amber-800 font-bold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Occupied
                </span>
                <span>{analytics?.occupiedChargers || 0}</span>
              </div>
              <div className="flex items-center justify-between text-rose-800 font-bold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Maintenance / Offline
                </span>
                <span>{analytics?.offlineChargers || 0}</span>
              </div>
            </div>
          </div>

          {/* Real-time Status Audit Trail */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-forest" />
              <span>Station Availability Audit Trail</span>
            </h3>
            <p className="text-xs text-slate-500">
              Audit log of status updates, connector transitions, and hardware telemetry.
            </p>

            {(!analytics?.recentActivity || analytics.recentActivity.length === 0) ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No status changes recorded yet. Status switches on the Charger Control Board appear here.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {analytics.recentActivity.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-slate-800">
                        {log.charger_identifier} •{' '}
                        <span className="text-slate-500 font-normal">{log.station_name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Status transitioned from{' '}
                        <strong className="text-slate-700">{log.old_status || 'None'}</strong> to{' '}
                        <strong className="text-emerald-700">{log.new_status}</strong>
                        {log.notes && ` (${log.notes})`}
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono shrink-0">
                      {new Date(log.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Station Modal */}
      <AddStationModal
        isOpen={isAddStationOpen}
        onClose={() => setIsAddStationOpen(false)}
        onSuccess={loadData}
      />

      {/* Add Charger Modal */}
      <AddChargerModal
        isOpen={isAddChargerOpen}
        onClose={() => setIsAddChargerOpen(false)}
        onSuccess={loadData}
        stations={stations}
        defaultStationId={targetStationForCharger}
        currencySymbol={currencySymbol}
      />
    </div>
  );
};
