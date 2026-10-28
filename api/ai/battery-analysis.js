export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const body = req.body || {};
  const capacity = parseFloat(body.battery_capacity_kwh ?? 40.5);
  const currentSoc = parseFloat(body.current_soc ?? 20);
  const desiredSoc = parseFloat(body.desired_soc ?? 80);
  const chargePower = parseFloat(body.charge_power_kw ?? 50);
  const temp = parseFloat(body.ambient_temp_c ?? 28);

  const cRate = Number((chargePower / Math.max(1, capacity)).toFixed(2));
  const thermalStress = Number(Math.exp(Math.abs(temp - 25.0) / 18.0).toFixed(2));
  const highSocStress = Number((1.0 + 0.85 * (Math.max(0, desiredSoc - 80) / 20.0)).toFixed(2));
  const fadeFactor = Math.pow(cRate, 0.85) * thermalStress * highSocStress;

  return res.status(200).json({
    c_rate: cRate,
    thermal_stress_index: thermalStress,
    high_soc_stress_index: highSocStress,
    risk_level: cRate > 1.5 ? 'Elevated' : 'Optimal / Low',
    projected_capacity_retention: {
      cycles_500: Number(Math.max(50, 100 - 3.5 * fadeFactor).toFixed(1)),
      cycles_1000: Number(Math.max(50, 100 - 7.8 * fadeFactor).toFixed(1)),
      cycles_1500: Number(Math.max(50, 100 - 13.5 * fadeFactor).toFixed(1)),
      cycles_2000: Number(Math.max(50, 100 - 20.5 * fadeFactor).toFixed(1)),
    },
    recommendations: [
      cRate > 1.5
        ? 'High C-rate (>1.5C) accelerates anode micro-cracking and lithium plating.'
        : 'Moderate C-rate is optimal for preserving battery cathode structural integrity.',
      desiredSoc > 85
        ? 'Daily charging capped at 80-85% extends overall calendar life by up to 2.4x vs charging to 100%.'
        : 'Targeting 80% state of charge minimizes high-voltage electrolyte oxidation.',
    ],
    optimal_taper_curve: [
      { soc_pct: 20, max_safe_power_kw: Math.min(chargePower, capacity * 2.0) },
      { soc_pct: 50, max_safe_power_kw: Math.min(chargePower, capacity * 1.8) },
      { soc_pct: 75, max_safe_power_kw: Math.min(chargePower, capacity * 1.2) },
      { soc_pct: 85, max_safe_power_kw: Math.min(chargePower, capacity * 0.7) },
      { soc_pct: 95, max_safe_power_kw: Math.min(chargePower, capacity * 0.3) },
      { soc_pct: 100, max_safe_power_kw: 0 },
    ],
  });
}
