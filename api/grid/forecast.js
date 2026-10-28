export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const now = new Date();
  const currentHour = now.getHours();
  const hoursCount = 24;

  const points = [];
  for (let i = 0; i < hoursCount; i++) {
    const rawHour = (currentHour + i) % 24;
    const timeLabel = `${String(rawHour).padStart(2, '0')}:00`;
    
    let solarFraction = 0;
    if (rawHour >= 6 && rawHour <= 18) {
      const solarPeakDist = Math.abs(rawHour - 12.5);
      solarFraction = Math.max(0, Math.cos((solarPeakDist / 6.5) * (Math.PI / 2)));
    }
    const solarGenerationMw = Math.round(solarFraction * 450);
    const windGenerationMw = Math.max(40, Math.round(120 + 80 * Math.sin((rawHour / 24) * 2 * Math.PI + 1.2)));
    const totalRenewableMw = solarGenerationMw + windGenerationMw;
    const gridDemandMw = Math.round(500 + 250 * Math.sin(((rawHour - 8) / 24) * 2 * Math.PI));
    const renewableSharePercent = Math.min(92, Math.max(18, Math.round((totalRenewableMw / (gridDemandMw + totalRenewableMw * 0.3)) * 100)));

    let gridTariff = 0.18;
    if (rawHour >= 18 && rawHour <= 21) gridTariff = 0.32;
    else if (rawHour >= 11 && rawHour <= 14) gridTariff = 0.10;
    else if (rawHour >= 0 && rawHour <= 5) gridTariff = 0.12;

    const gridEmissionFactorKg = Number(((1 - renewableSharePercent / 100) * 0.78 + (renewableSharePercent / 100) * 0.04).toFixed(3));

    points.push({
      hour: rawHour,
      timeLabel,
      dayOffset: Math.floor((currentHour + i) / 24),
      solarGenerationMw,
      windGenerationMw,
      totalRenewableMw,
      gridDemandMw,
      renewableSharePercent,
      gridTariff,
      gridEmissionFactorKg,
      lifecycleRenewableEmissionKg: 0.04,
      isPeakTariff: gridTariff >= 0.30,
      isPeakSolar: rawHour >= 11 && rawHour <= 14,
    });
  }

  res.status(200).json({ forecast: points, generated_at: now.toISOString() });
}
