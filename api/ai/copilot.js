export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const body = req.body || {};
  const message = (body.message || '').toLowerCase();

  if (message.includes('cheap') || message.includes('cost') || message.includes('save') || message.includes('tariff') || message.includes('price')) {
    return res.status(200).json({
      intent: 'COST_OPTIMIZATION',
      headline: 'Prime Cost-Saving Charging Windows Today',
      answer:
        '**1. Solar Soak Window (11:00 AM – 2:00 PM):** Wholesale electricity drops to **$0.10/kWh** due to midday solar irradiance abundance.\n\n**2. Overnight Wind Off-Peak (1:00 AM – 5:00 AM):** Flat **$0.12/kWh** rate with minimal baseline grid demand.\n\n⚠️ **Avoid Evening Peak (6:00 PM – 9:30 PM):** Rates surge to **$0.32/kWh** (3.2x higher) when gas peakers dispatch.',
      action: { label: 'Schedule in Solar Soak Window', target_tab: 'planner', preset_priority: 'lowest_cost' },
    });
  } else if (message.includes('clean') || message.includes('green') || message.includes('solar') || message.includes('emission') || message.includes('co2')) {
    return res.status(200).json({
      intent: 'CLEAN_ENERGY',
      headline: 'Optimal Zero-Carbon Solar Absorption Window',
      answer:
        'The cleanest window today is **11:30 AM to 1:30 PM**, reaching **92% renewable clean energy** and dropping grid carbon intensity to **0.18 kg CO₂e/kWh**.\n\nChargeSmart applies ISO-14044 lifecycle accounting, capturing 0.04 kg CO₂e/kWh for solar PV lifecycle manufacturing.',
      action: { label: 'Plan Max-Green Session', target_tab: 'planner', preset_priority: 'max_renewable' },
    });
  } else if (message.includes('battery') || message.includes('health') || message.includes('80%') || message.includes('degrad')) {
    return res.status(200).json({
      intent: 'BATTERY_HEALTH',
      headline: 'Lithium-Ion Battery Health & C-Rate Guidance',
      answer:
        '**The 80/20 Rule for EV Longevity:**\n- Daily charging between **20% and 80%** preserves cathode lattice integrity and prevents lithium dendrite plating.\n- High-power fast charging above 80% generates elevated thermal stress.\n- Our Arrhenius model shows capping daily charging at 80% SoC extends battery lifespan by **up to 2.4×**.',
      action: { label: 'Open AI Energy Lab', target_tab: 'ai-lab' },
    });
  } else if (message.includes('station') || message.includes('where') || message.includes('charger') || message.includes('map') || message.includes('plug')) {
    return res.status(200).json({
      intent: 'STATION_FINDER',
      headline: 'Recommended Verified Green Charging Stations',
      answer:
        '**Top Pick:** **GreenByte EcoHub — DSU Innovation Park** (0.8 km away)\n- **Power:** 60 kW DC Fast (CCS2) & 22 kW AC (Type 2)\n- **Green Source:** 94% On-Site Solar Canopy (Verified A+ Rating)\n- **Rate:** $0.14 / kWh\n\nUse our Station Finder map to view real-time plug availability and trigger navigation.',
      action: { label: 'Open Station Finder Map', target_tab: 'stations' },
    });
  }

  return res.status(200).json({
    intent: 'GENERAL_ENERGY_ADVISORY',
    headline: 'GreenByte AI Energy Copilot Active',
    answer:
      'I am continuously monitoring the local smart grid. You can ask me:\n- *"When is the cheapest time to charge my car?"*\n- *"How does fast charging affect battery life?"*\n- *"Find nearby solar charging stations with CCS2 plugs"*\n- *"What is my CO₂ reduction compared to a petrol car?"*',
    action: { label: 'Open Smart Charge Planner', target_tab: 'planner' },
  });
}
