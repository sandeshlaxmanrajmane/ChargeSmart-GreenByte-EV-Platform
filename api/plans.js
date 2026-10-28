// In-memory demo plans for Vercel serverless environment
let savedPlans = [
  {
    id: 'plan-demo-1',
    created_at: new Date().toISOString(),
    vehicle_name: 'Tata Nexon EV Long Range',
    vehicle_type: 'car',
    start_time: 'Today, 11:30 AM',
    end_time: 'Today, 01:15 PM',
    energy_kwh: 24.3,
    cost: 2.67,
    currency: '$',
    renewable_share: 89.0,
    emissions_kg: 1.84,
    priority: 'max_renewable',
    location_name: 'Home Rooftop Solar (Smart Inverter)',
    status: 'scheduled',
    notes: 'Scheduled for maximum solar irradiance peak window.'
  },
  {
    id: 'plan-demo-2',
    created_at: new Date().toISOString(),
    vehicle_name: 'Ather 450X Gen 3',
    vehicle_type: 'scooter',
    start_time: 'Yesterday, 02:00 AM',
    end_time: 'Yesterday, 03:10 AM',
    energy_kwh: 2.2,
    cost: 0.26,
    currency: '$',
    renewable_share: 78.0,
    emissions_kg: 0.21,
    priority: 'lowest_cost',
    location_name: 'Home Off-Peak Tariff',
    status: 'completed',
    notes: 'Off-peak overnight wind tariff savings realized.'
  }
];

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ plans: savedPlans, total: savedPlans.length });
  }

  if (req.method === 'POST') {
    const plan = req.body || {};
    if (!plan.id) {
      plan.id = `plan-${Date.now()}`;
    }
    savedPlans = [plan, ...savedPlans];
    return res.status(201).json({ message: 'Plan saved', plan });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    savedPlans = savedPlans.filter((p) => p.id !== id);
    return res.status(200).json({ message: 'Plan deleted', id });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
