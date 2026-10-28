export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const now = new Date();
  const h = now.getHours() + now.getMinutes() / 60;
  
  // Real-time atmospheric curve
  let solar = 0;
  if (h >= 6 && h <= 18) {
    const dist = Math.abs(h - 12.5);
    solar = Math.round(Math.max(0, Math.cos((dist / 6.5) * (Math.PI / 2)) * 430));
  }

  const wind = Math.round(135 + 70 * Math.sin((h / 24) * 2 * Math.PI + 1.2));
  const total = solar + wind;
  const demand = Math.round(520 + 220 * Math.sin(((h - 8) / 24) * 2 * Math.PI));
  const cleanPct = Math.min(94, Math.max(18, Math.round((total / (demand + total * 0.25)) * 100)));

  const tariff = h >= 11 && h <= 14 ? 0.10 : h >= 18 && h <= 21 ? 0.32 : 0.18;
  const carbonFactor = Number(((1 - cleanPct / 100) * 0.76 + (cleanPct / 100) * 0.04).toFixed(3));
  const freqJitter = Number((50.0 + (Math.random() - 0.5) * 0.04).toFixed(3));

  res.status(200).json({
    timestamp: now.toISOString(),
    hour: Number(h.toFixed(2)),
    solar_generation_mw: solar,
    wind_generation_mw: wind,
    total_renewable_mw: total,
    grid_demand_mw: demand,
    clean_share_pct: cleanPct,
    spot_tariff_usd: tariff,
    carbon_intensity_kg_kwh: carbonFactor,
    grid_frequency_hz: freqJitter,
    grid_status: freqJitter >= 49.98 ? 'STABLE_DISPATCH' : 'PEAK_STRAIN',
  });
}
