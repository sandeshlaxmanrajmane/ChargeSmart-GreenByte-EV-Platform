export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.status(200).json({
    status: 'healthy',
    backend: 'ChargeSmart Real-Time Cloud Engine (Vercel Serverless)',
    ml_models: {
      solar_wind_regressor: 'GreenByte-SolarWind-v2.1',
      battery_degradation_model: 'LiFePO4-NMC-Degradation-ML',
      ai_energy_copilot: 'Active',
    },
    server_time: new Date().toISOString(),
  });
}
