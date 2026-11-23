import React, { useState } from 'react';
import { ChargerBay, OwnerStation } from '../../types';
import { ownerService } from '../../services/ownerService';
import { showToast } from '../common/Toast';
import {
  Zap,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wrench,
  PowerOff,
  DollarSign,
  Edit2,
  Trash2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface ChargerControlBoardProps {
  stations: OwnerStation[];
  onRefresh: () => void;
  currencySymbol: string;
}

export const ChargerControlBoard: React.FC<ChargerControlBoardProps> = ({
  stations,
  onRefresh,
  currencySymbol,
}) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editPriceVal, setEditPriceVal] = useState<string>('');

  const allChargersWithStation: { charger: ChargerBay; station: OwnerStation }[] = [];
  stations.forEach((st) => {
    (st.chargers || []).forEach((c) => {
      allChargersWithStation.push({ charger: c, station: st });
    });
  });

  const handleStatusChange = async (
    chargerId: string,
    newStatus: 'Available' | 'Occupied' | 'Out of Service' | 'Maintenance' | 'Offline'
  ) => {
    setUpdatingId(chargerId);
    try {
      await ownerService.updateChargerStatus(
        chargerId,
        newStatus,
        `Owner updated status to ${newStatus}`
      );
      showToast('success', 'Status Broadcasted', `Charger marked as ${newStatus}. Live on public map.`);
      onRefresh();
    } catch (err: any) {
      showToast('warning', 'Update Failed', err.message || 'Could not update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSavePrice = async (chargerId: string) => {
    const p = parseFloat(editPriceVal);
    if (isNaN(p) || p < 0) {
      showToast('warning', 'Invalid Tariff', 'Please enter a valid price per kWh.');
      return;
    }

    try {
      await ownerService.updateCharger(chargerId, { price_per_kwh: p });
      showToast('success', 'Tariff Updated', `New price: ${currencySymbol}${p.toFixed(2)}/kWh`);
      setEditingPriceId(null);
      onRefresh();
    } catch (err: any) {
      showToast('warning', 'Failed', err.message || 'Could not update price');
    }
  };

  const handleDeleteCharger = async (chargerId: string, label: string) => {
    if (!window.confirm(`Are you sure you want to delete charger '${label}'?`)) return;
    try {
      await ownerService.deleteCharger(chargerId);
      showToast('info', 'Charger Removed', `Deleted ${label}`);
      onRefresh();
    } catch (err: any) {
      showToast('warning', 'Delete Failed', err.message);
    }
  };

  const formatRelativeTime = (isoString: string) => {
    if (!isoString) return 'Just now';
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

  if (allChargersWithStation.length === 0) {
    return (
      <div className="p-8 text-center rounded-3xl bg-white border border-slate-200">
        <Zap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h4 className="text-base font-bold text-slate-700">No Chargers Configured</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          Add individual charging bays to your stations using the "+ Add Charger" button.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">
            Real-Time Charger Availability Control Board
          </h3>
          <p className="text-xs text-slate-500">
            Click any status to instantly update live driver feeds, map pins, and public station details.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-slate-100 transition-colors"
          title="Refresh chargers"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {allChargersWithStation.map(({ charger, station }) => {
          const isBusy = updatingId === charger.id;
          const status = charger.availability_status;

          const getStatusBadge = () => {
            switch (status) {
              case 'Available':
                return 'bg-emerald-100 text-emerald-800 border-emerald-300';
              case 'Occupied':
                return 'bg-amber-100 text-amber-800 border-amber-300';
              case 'Maintenance':
                return 'bg-orange-100 text-orange-800 border-orange-300';
              case 'Out of Service':
                return 'bg-rose-100 text-rose-800 border-rose-300';
              default:
                return 'bg-slate-100 text-slate-700 border-slate-300';
            }
          };

          return (
            <div
              key={charger.id}
              className={`p-4 rounded-2xl bg-white border transition-all ${
                status === 'Available'
                  ? 'border-emerald-200 shadow-xs'
                  : status === 'Occupied'
                  ? 'border-amber-200 shadow-xs'
                  : 'border-slate-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-600">
                    {station.name}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                    {charger.charger_identifier}
                  </h4>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge()}`}
                  >
                    {status}
                  </span>
                  <button
                    onClick={() => handleDeleteCharger(charger.id, charger.charger_identifier)}
                    className="p-1 text-slate-300 hover:text-rose-600 transition-colors"
                    title="Delete Charger"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Hardware Specs */}
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 mb-3 bg-slate-50 p-2 rounded-xl">
                <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {charger.connector_type}
                </span>
                <span className="font-mono font-bold text-emerald-800">
                  {charger.power_kw} kW {charger.charging_type}
                </span>
                <span className="text-slate-300">•</span>
                <span>{charger.total_connectors || 1} Plug(s)</span>
                <span className="text-slate-300">•</span>

                {/* Inline Price Editor */}
                {editingPriceId === charger.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      value={editPriceVal}
                      onChange={(e) => setEditPriceVal(e.target.value)}
                      className="w-16 px-1.5 py-0.5 text-[11px] rounded border border-emerald-400 font-mono"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSavePrice(charger.id)}
                      className="px-1.5 py-0.5 bg-emerald-600 text-white rounded font-bold text-[10px]"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingPriceId(null)}
                      className="text-[10px] text-slate-400 hover:text-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingPriceId(charger.id);
                      setEditPriceVal(String(charger.price_per_kwh));
                    }}
                    className="flex items-center gap-0.5 font-mono font-bold text-slate-700 hover:text-emerald-700"
                    title="Click to edit tariff"
                  >
                    <span>
                      {currencySymbol}{charger.price_per_kwh.toFixed(2)}/kWh
                    </span>
                    <Edit2 className="w-2.5 h-2.5 text-slate-400" />
                  </button>
                )}
              </div>

              {/* Interactive Status Switcher Buttons */}
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Switch Live Status</span>
                  <span className="font-normal font-sans text-slate-500">
                    Updated {formatRelativeTime(charger.last_status_updated)}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1 text-[10px] font-bold">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleStatusChange(charger.id, 'Available')}
                    className={`py-1.5 rounded-lg border transition-all ${
                      status === 'Available'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    Available
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleStatusChange(charger.id, 'Occupied')}
                    className={`py-1.5 rounded-lg border transition-all ${
                      status === 'Occupied'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 hover:bg-amber-50 text-slate-700 border-slate-200 hover:border-amber-300'
                    }`}
                  >
                    Occupied
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleStatusChange(charger.id, 'Maintenance')}
                    className={`py-1.5 rounded-lg border transition-all ${
                      status === 'Maintenance'
                        ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                        : 'bg-slate-50 hover:bg-orange-50 text-slate-700 border-slate-200 hover:border-orange-300'
                    }`}
                  >
                    Maint.
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleStatusChange(charger.id, 'Out of Service')}
                    className={`py-1.5 rounded-lg border transition-all ${
                      status === 'Out of Service'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 hover:bg-rose-50 text-slate-700 border-slate-200 hover:border-rose-300'
                    }`}
                  >
                    Out of Svc
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleStatusChange(charger.id, 'Offline')}
                    className={`py-1.5 rounded-lg border transition-all ${
                      status === 'Offline'
                        ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    Offline
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
