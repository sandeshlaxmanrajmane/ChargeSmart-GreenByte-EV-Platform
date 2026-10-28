import React, { useState, useEffect } from 'react';
import { apiService, MLForecastResult, MLBatteryAnalysis } from '../../services/apiService';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  Cpu,
  Sun,
  Wind,
  Battery,
  Zap,
  Activity,
  ShieldCheck,
  Sparkles,
  Layers,
  Thermometer,
  CloudRain,
} from 'lucide-react';

export const AIEnergyLabView: React.FC<{ currencySymbol: string }> = ({ currencySymbol }) => {
  // ML Model 1: Solar & Wind Weather States
  const [hour, setHour] = useState(13);
  const [cloudCover, setCloudCover] = useState(25);
  const [temperature, setTemperature] = useState(30);
  const [windSpeed, setWindSpeed] = useState(8.5);
  const [mlForecast, setMlForecast] = useState<MLForecastResult | null>(null);

  // ML Model 2: Battery Degradation States
  const [batteryCapacity, setBatteryCapacity] = useState(50);
  const [currentSoc, setCurrentSoc] = useState(20);
  const [desiredSoc, setDesiredSoc] = useState(85);
  const [chargePower, setChargePower] = useState(60);
  const [ambientTemp, setAmbientTemp] = useState(32);
  const [batteryAnalysis, setBatteryAnalysis] = useState<MLBatteryAnalysis | null>(null);

  const [activeTab, setActiveTab] = useState<'generation_ml' | 'battery_ml'>('generation_ml');

  // Trigger Model 1 Inference
  useEffect(() => {
    let mounted = true;
    const runInference = async () => {
      const res = await apiService.runMLRenewableInference({
        hour,
        cloud_cover_pct: cloudCover,
        temperature_c: temperature,
        wind_speed_ms: windSpeed,
      });
      if (mounted) setMlForecast(res);
    };
    runInference();
    return () => {
      mounted = false;
    };
  }, [hour, cloudCover, temperature, windSpeed]);

  // Trigger Model 2 Inference
  useEffect(() => {
    let mounted = true;
    const runBattery = async () => {
      const res = await apiService.runMLBatteryAnalysis({
        battery_capacity_kwh: batteryCapacity,
        current_soc: currentSoc,
        desired_soc: desiredSoc,
        charge_power_kw: chargePower,
        ambient_temp_c: ambientTemp,
      });
      if (mounted) setBatteryAnalysis(res);
    };
    runBattery();
    return () => {
      mounted = false;
    };
  }, [batteryCapacity, currentSoc, desiredSoc, chargePower, ambientTemp]);

  const retentionData = batteryAnalysis
    ? [
        { cycles: '500 Cycles', retention: batteryAnalysis.projected_capacity_retention.cycles_500 },
        { cycles: '1000 Cycles', retention: batteryAnalysis.projected_capacity_retention.cycles_1000 },
        { cycles: '1500 Cycles', retention: batteryAnalysis.projected_capacity_retention.cycles_1500 },
        { cycles: '2000 Cycles', retention: batteryAnalysis.projected_capacity_retention.cycles_2000 },
      ]
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-300">
          <Cpu className="w-3.5 h-3.5 text-emerald-600" />
          <span>Real-time Predictive Intelligence</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          AI & Machine Learning Energy Lab
        </h2>
        <p className="text-sm sm:text-base text-slate-600 mt-2">
          Test interactive atmospheric solar/wind regression models and Arrhenius electrochemical battery health degradation predictors in real time.
        </p>

        {/* Tab Switcher */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setActiveTab('generation_ml')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'generation_ml'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Atmospheric Renewable ML Model</span>
          </button>

          <button
            onClick={() => setActiveTab('battery_ml')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'battery_ml'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'
            }`}
          >
            <Battery className="w-4 h-4" />
            <span>Battery Degradation & C-Rate Model</span>
          </button>
        </div>
      </div>

      {/* MODULE 1: Atmospheric Renewable ML Regressor */}
      {activeTab === 'generation_ml' && mlForecast && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          {/* Inputs Column */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-500" /> Weather Input Variables
              </h3>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded border border-emerald-200">
                R² = {mlForecast.model_metadata.r2_solar_accuracy}
              </span>
            </div>

            {/* Hour Slider */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="font-bold text-slate-700">Hour of Day</span>
                <span className="font-mono font-bold text-emerald-700">{hour}:00</span>
              </div>
              <input
                type="range"
                min="0"
                max="23"
                value={hour}
                onChange={(e) => setHour(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>

            {/* Cloud Cover Slider */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="font-bold text-slate-700">Cloud Cover Attenuation</span>
                <span className="font-mono font-bold text-sky-700">{cloudCover}% Cloud Cover</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={cloudCover}
                onChange={(e) => setCloudCover(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
              />
            </div>

            {/* Temperature Slider */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="font-bold text-slate-700">Ambient Temperature</span>
                <span className="font-mono font-bold text-amber-700">{temperature} °C</span>
              </div>
              <input
                type="range"
                min="10"
                max="48"
                step="1"
                value={temperature}
                onChange={(e) => setTemperature(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="text-[10px] text-slate-400 mt-1">
                Cell derating factor: -0.4% per °C above 25°C standard test condition.
              </div>
            </div>

            {/* Wind Speed Slider */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="font-bold text-slate-700">Anemometer Wind Speed</span>
                <span className="font-mono font-bold text-teal-700">{windSpeed} m/s</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="0.5"
                value={windSpeed}
                onChange={(e) => setWindSpeed(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <div className="text-[10px] text-slate-400 mt-1">
                Turbine cut-in at 3.0 m/s; rated power reached at 12.0 m/s.
              </div>
            </div>
          </div>

          {/* Inference Output Column */}
          <div className="lg:col-span-7 bg-gradient-to-br from-forest via-[#0e3b32] to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30">
                    Live ML Inference Output
                  </span>
                  <div className="text-3xl sm:text-4xl font-black font-mono mt-2">
                    {mlForecast.prediction.total_renewable_mw}{' '}
                    <span className="text-lg text-emerald-400 font-normal">MW Clean Power</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black font-mono text-emerald-300">
                    {mlForecast.prediction.clean_share_pct}%
                  </div>
                  <div className="text-xs text-slate-300">Grid Clean Share</div>
                </div>
              </div>

              {/* Grid of Predicted Components */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-emerald-500/20 text-xs">
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-1">
                  <div className="text-slate-400 flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-amber-400" /> Solar PV Output
                  </div>
                  <div className="text-2xl font-black font-mono text-amber-300">
                    {mlForecast.prediction.solar.predicted_mw} MW
                  </div>
                  <div className="text-[11px] text-slate-300">
                    95% CI: [{mlForecast.prediction.solar.ci_lower} – {mlForecast.prediction.solar.ci_upper}] MW
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Effective Irradiance: {mlForecast.prediction.solar.effective_irradiance_wm2} W/m²
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-1">
                  <div className="text-slate-400 flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5 text-sky-400" /> Aero Wind Output
                  </div>
                  <div className="text-2xl font-black font-mono text-sky-300">
                    {mlForecast.prediction.wind.predicted_mw} MW
                  </div>
                  <div className="text-[11px] text-slate-300">
                    95% CI: [{mlForecast.prediction.wind.ci_lower} – {mlForecast.prediction.wind.ci_upper}] MW
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Grid Demand: {mlForecast.prediction.grid_demand_mw} MW
                  </div>
                </div>
              </div>

              {/* Economic & Environmental Impact */}
              <div className="p-4 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Dynamic Spot Tariff</span>
                  <span className="text-lg font-bold text-amber-300 font-mono">
                    {currencySymbol}{mlForecast.prediction.spot_tariff_usd.toFixed(2)} / kWh
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Marginal Carbon Factor</span>
                  <span className="text-lg font-bold text-slate-200 font-mono">
                    {mlForecast.prediction.carbon_intensity_kg_kwh} kg CO₂e/kWh
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-emerald-500/20 text-[11px] text-slate-400">
              Model: {mlForecast.model_metadata.version} • Multivariate physics-guided regression engine.
            </div>
          </div>
        </div>
      )}

      {/* MODULE 2: Lithium-Ion Battery Degradation Model */}
      {activeTab === 'battery_ml' && batteryAnalysis && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          {/* Controls Column */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-200 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Battery className="w-5 h-5 text-emerald-600" /> Battery & Charger Parameters
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Arrhenius-based electrochemical cell aging simulation.
              </p>
            </div>

            {/* Battery Capacity */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="font-bold text-slate-700">Pack Capacity</span>
                <span className="font-mono font-bold text-slate-900">{batteryCapacity} kWh</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={batteryCapacity}
                onChange={(e) => setBatteryCapacity(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>

            {/* Charging Power */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="font-bold text-slate-700">Charging Power (kW)</span>
                <span className="font-mono font-bold text-amber-700">{chargePower} kW</span>
              </div>
              <input
                type="range"
                min="3.3"
                max="150"
                step="5"
                value={chargePower}
                onChange={(e) => setChargePower(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                <span>Calculated C-Rate: <strong>{batteryAnalysis.c_rate}C</strong></span>
                <span className={batteryAnalysis.c_rate > 1.2 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
                  {batteryAnalysis.risk_level} Stress
                </span>
              </div>
            </div>

            {/* Target SoC */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="font-bold text-slate-700">Target State of Charge</span>
                <span className="font-mono font-bold text-emerald-700">{desiredSoc}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                step="5"
                value={desiredSoc}
                onChange={(e) => setDesiredSoc(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="text-[10px] text-slate-400 mt-1">
                Charging above 80% increases high-voltage cathode phase stress.
              </div>
            </div>

            {/* Ambient Temperature */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="font-bold text-slate-700">Ambient Cell Temperature</span>
                <span className="font-mono font-bold text-slate-800">{ambientTemp} °C</span>
              </div>
              <input
                type="range"
                min="0"
                max="45"
                step="1"
                value={ambientTemp}
                onChange={(e) => setAmbientTemp(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-700"
              />
            </div>
          </div>

          {/* Retention Chart & Taper Output */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-200 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Projected Battery Capacity Retention
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                Cycle Life Degradation Forecast
              </h3>
            </div>

            {/* Retention Bar Chart */}
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={retentionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="cycles" tick={{ fontSize: 11 }} stroke="#cbd5e1" />
                  <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} stroke="#cbd5e1" />
                  <Tooltip formatter={(val) => [`${val}% Capacity`, 'Retention']} />
                  <Bar dataKey="retention" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* AI Diagnostics & Safe Taper Curve */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Optimal CC-CV Charging Power Curve (kW vs SoC)
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                {batteryAnalysis.optimal_taper_curve.map((pt, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-bold">{pt.soc_pct}% SoC</div>
                    <div className="text-sm font-black font-mono text-emerald-800 mt-0.5">
                      {pt.max_safe_power_kw} kW
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendations list */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-xs space-y-1.5 text-emerald-950">
                {batteryAnalysis.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
