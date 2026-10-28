import React, { useState, useEffect } from 'react';
import { storageService } from '../../services/storageService';
import { UserSettings } from '../../types';
import { VEHICLE_PRESETS, CURRENCY_SYMBOLS } from '../../data/mockData';
import { showToast } from '../common/Toast';
import { Settings, RotateCcw, Save, ShieldCheck, Database, HardDrive, DollarSign, Car } from 'lucide-react';

interface SettingsViewProps {
  onCurrencyChange: (currency: 'USD' | 'EUR' | 'INR' | 'GBP') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onCurrencyChange }) => {
  const [settings, setSettings] = useState<UserSettings>(() => storageService.getSettings());

  useEffect(() => {
    const refresh = () => setSettings(storageService.getSettings());
    window.addEventListener('chargesmart_data_updated', refresh);
    return () => window.removeEventListener('chargesmart_data_updated', refresh);
  }, []);

  const handleSave = () => {
    storageService.saveSettings(settings);
    onCurrencyChange(settings.currency);
    showToast('success', 'Settings Saved', 'Preferences have been persisted to local storage.');
  };

  const handleReset = () => {
    if (window.confirm('Reset all saved plans and settings to default demo state?')) {
      storageService.resetDemoData();
      setSettings(storageService.getSettings());
      onCurrencyChange('USD');
      showToast('info', 'Demo Data Reset', 'Platform has been restored to clean demo state.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
          Configuration & Storage
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2">
          Platform Settings
        </h2>
        <p className="text-sm text-slate-600 mt-2">
          Manage currency, default vehicle profiles, local persistence, and demo environment settings.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-200 space-y-8">
        {/* Currency & Tariff */}
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-emerald-600" /> Regional Currency & Electricity Pricing
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Display Currency
              </label>
              <select
                value={settings.currency}
                onChange={(e) => {
                  const curr = e.target.value as any;
                  setSettings({
                    ...settings,
                    currency: curr,
                    currencySymbol: CURRENCY_SYMBOLS[curr] || '$',
                  });
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="USD">$ USD (United States Dollar)</option>
                <option value="EUR">€ EUR (Euro)</option>
                <option value="INR">₹ INR (Indian Rupee)</option>
                <option value="GBP">£ GBP (British Pound)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Default Base Tariff ({settings.currencySymbol} / kWh)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={settings.defaultTariffPerKwh}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultTariffPerKwh: parseFloat(e.target.value) || 0.18,
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Vehicle & Charger Defaults */}
        <div className="pt-6 border-t border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Car className="w-5 h-5 text-emerald-600" /> Default Vehicle Profile & Home Charger
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Default Vehicle Preset
              </label>
              <select
                value={settings.defaultVehicleId}
                onChange={(e) => setSettings({ ...settings, defaultVehicleId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {VEHICLE_PRESETS.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.batteryCapacityKwh} kWh)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Home AC Charger Rating (kW)
              </label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                value={settings.homeChargerPowerKw}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    homeChargerPowerKw: parseFloat(e.target.value) || 7.4,
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Data Persistence Transparency */}
        <div className="pt-6 border-t border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-2">
            <HardDrive className="w-5 h-5 text-emerald-600" /> Persistence Architecture
          </h3>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed space-y-2">
            <p>
              <strong>Local Browser Storage:</strong> All saved charging plans, vehicle settings, and tariff baselines are safely persisted directly inside your client browser via HTML5 <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">localStorage</code>. No private telemetry is transmitted to third-party ad networks.
            </p>
            <p className="text-[11px] text-slate-500">
              For production cloud sync, ChargeSmart includes REST service adapters ready to integrate with PostgreSQL or FastAPI backends.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-100">
          <button
            onClick={handleReset}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-rose-300 text-xs font-bold text-rose-700 hover:bg-rose-50 flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset All Demo Data</span>
          </button>

          <button
            onClick={handleSave}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
