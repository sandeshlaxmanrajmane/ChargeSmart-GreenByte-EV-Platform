import React, { useState } from 'react';
import { ownerService } from '../../services/ownerService';
import { OwnerStation } from '../../types';
import { showToast } from '../common/Toast';
import { X, Zap, DollarSign, Layers, PlusCircle, AlertCircle } from 'lucide-react';

interface AddChargerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  stations: OwnerStation[];
  defaultStationId?: string;
  currencySymbol: string;
}

export const AddChargerModal: React.FC<AddChargerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  stations,
  defaultStationId,
  currencySymbol,
}) => {
  const [stationId, setStationId] = useState<string>(
    defaultStationId || (stations.length > 0 ? stations[0].id : '')
  );
  const [chargerIdentifier, setChargerIdentifier] = useState('');
  const [connectorType, setConnectorType] = useState('CCS2');
  const [chargingType, setChargingType] = useState('DC Fast');
  const [powerKw, setPowerKw] = useState<number>(150);
  const [totalConnectors, setTotalConnectors] = useState<number>(2);
  const [pricePerKwh, setPricePerKwh] = useState<number>(0.22);
  const [currency, setCurrency] = useState('USD');
  const [additionalFees, setAdditionalFees] = useState<number>(0);
  const [availabilityStatus, setAvailabilityStatus] = useState<string>('Available');
  const [operatingStatus, setOperatingStatus] = useState<string>('Online');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stationId) {
      setErrorMessage('Please select a station.');
      return;
    }
    if (!chargerIdentifier.trim()) {
      setErrorMessage('Please provide a charger identifier/bay name.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await ownerService.addCharger(stationId, {
        charger_identifier: chargerIdentifier.trim(),
        connector_type: connectorType,
        charging_type: chargingType,
        power_kw: Number(powerKw),
        total_connectors: Number(totalConnectors),
        price_per_kwh: Number(pricePerKwh),
        currency,
        additional_fees: Number(additionalFees),
        availability_status: availabilityStatus,
        operating_status: operatingStatus,
      });

      showToast('success', 'Charger Added', `Registered ${chargerIdentifier} to station!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add charger.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-teal-100 text-teal-800 border border-teal-300">
            <Zap className="w-6 h-6 text-teal-700" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">Add Charger Bay</h3>
            <p className="text-xs text-slate-500">
              Configure power ratings, connector hardware, and tariffs for a station.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Target Station */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Select Charging Hub <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white font-medium"
            >
              {stations.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.city})
                </option>
              ))}
            </select>
          </div>

          {/* Charger Name */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Bay / Charger Identifier <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={chargerIdentifier}
              onChange={(e) => setChargerIdentifier(e.target.value)}
              placeholder="e.g. Bay 1 — 150kW Ultra-Fast CCS2"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-500 text-slate-900"
            />
          </div>

          {/* Connector & Speed */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Connector Type</label>
              <select
                value={connectorType}
                onChange={(e) => setConnectorType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
              >
                <option value="CCS2">CCS2 (Combo 2)</option>
                <option value="Type 2">Type 2 (Mennekes)</option>
                <option value="CHAdeMO">CHAdeMO</option>
                <option value="GB/T">GB/T (Fast DC)</option>
                <option value="Bharat AC001">Bharat AC001 / Schuko</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Charging Type</label>
              <select
                value={chargingType}
                onChange={(e) => setChargingType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
              >
                <option value="DC Fast">DC Fast Charging</option>
                <option value="AC Level 2">AC Level 2 Standard</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Power Rating (kW)</label>
              <input
                type="number"
                min="3"
                max="500"
                step="1"
                required
                value={powerKw}
                onChange={(e) => setPowerKw(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Number of Plugs / Bays</label>
              <input
                type="number"
                min="1"
                max="8"
                step="1"
                required
                value={totalConnectors}
                onChange={(e) => setTotalConnectors(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-mono"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Tariff per kWh ({currencySymbol})
              </label>
              <input
                type="number"
                min="0"
                max="50"
                step="0.01"
                required
                value={pricePerKwh}
                onChange={(e) => setPricePerKwh(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Parking / Session Fee</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={additionalFees}
                onChange={(e) => setAdditionalFees(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-mono"
              />
            </div>
          </div>

          {/* Initial Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Initial Availability</label>
              <select
                value={availabilityStatus}
                onChange={(e) => setAvailabilityStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white font-medium"
              >
                <option value="Available">Available (Green)</option>
                <option value="Occupied">Occupied (Amber)</option>
                <option value="Maintenance">Maintenance (Orange)</option>
                <option value="Out of Service">Out of Service (Red)</option>
                <option value="Offline">Offline (Gray)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Operating Status</label>
              <select
                value={operatingStatus}
                onChange={(e) => setOperatingStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
              >
                <option value="Online">Online & Operational</option>
                <option value="Degraded">Degraded Speed</option>
                <option value="Offline">Offline Hardware</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? 'Adding...' : 'Register Charger'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
