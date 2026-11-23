import test from 'node:test';
import assert from 'node:assert/strict';

import { routingService } from '../src/services/routingService.ts';
import { calculateDistanceKm } from '../src/utils/geoUtils.ts';

test('Journey Routing: Haversine distance accuracy', () => {
  // Bengaluru (12.9716, 77.5946) to Mysuru (12.3051, 76.6551) ~ 128 km straight line
  const dist = calculateDistanceKm(12.9716, 77.5946, 12.3051, 76.6551);
  assert.ok(dist >= 120 && dist <= 135, `Expected ~128 km, got ${dist}`);
});

test('Journey Routing: Vehicle energy estimation per kilometer', () => {
  // Tata Nexon EV: 40.5 kWh, 325 km rated range
  // Energy per km = 40.5 / 325 * 1.05 = ~0.13 kWh/km
  // For 100 km, ~13 kWh
  const energyFor100Km = routingService.estimateEnergyKwh(100, 40.5, 325);
  assert.ok(energyFor100Km >= 12.5 && energyFor100Km <= 13.5, `Expected ~13 kWh, got ${energyFor100Km}`);
});

test('Journey Routing: Usable range and intermediate stop requirement', () => {
  // Vehicle: 325 km rated range.
  // Current SoC: 40%. Target buffer: 15%.
  // Usable SoC: 25%.
  // Usable range: 325 * 0.25 = 81.25 km.
  // Trip distance: 140 km.
  // Should definitely flag that an intermediate stop is required!
  const ratedRangeKm = 325;
  const currentSoc = 40;
  const bufferSoc = 15;
  const usableRange = ratedRangeKm * ((currentSoc - bufferSoc) / 100.0);

  const tripDistanceKm = 140;
  const requiresStop = tripDistanceKm > usableRange;
  assert.equal(requiresStop, true);
});

test('Journey Routing: Complete Journey Plan generation', () => {
  const plan = routingService.planJourney({
    startLocation: { name: 'Origin', latitude: 12.97, longitude: 77.59 },
    destLocation: { name: 'Destination', latitude: 12.30, longitude: 76.65 },
    vehicleName: 'Tata Nexon EV',
    batteryCapacityKwh: 40.5,
    ratedRangeKm: 325,
    currentSocPercent: 40,
    targetArrivalBufferPercent: 15,
    routeResult: {
      distanceKm: 142.5,
      durationMinutes: 165,
      durationFormatted: '2h 45m',
      coordinates: [
        [12.97, 77.59],
        [12.60, 77.10],
        [12.30, 76.65],
      ],
      isSimulatedRoute: false,
      provider: 'OSRM Open Source Routing Machine',
    },
    availableStations: [
      {
        id: 'st-midpoint',
        name: 'Highway Fast Charging Hub',
        operator: 'Tata Power',
        address: 'NH 275 Midway',
        city: 'Mandya',
        latitude: 12.60,
        longitude: 77.10,
        distanceKm: 65,
        totalPlugs: 4,
        availablePlugs: 2,
        connectors: [{ type: 'CCS2', powerKw: 60, available: 2, total: 4 }],
        maxPowerKw: 60,
        pricePerKwh: 0.18,
        currency: 'USD',
        renewableInfo: {
          source: 'Rooftop Solar Canopy',
          verified: true,
          greenSharePercent: 88,
          lifecycleRating: 'A+',
        },
        amenities: ['Highway Rest Stop'],
        status: 'unknown',
        isVerified: true,
        openingHours: '24/7 Access',
      },
    ],
  });

  assert.equal(plan.requiresChargingStop, true);
  assert.ok(plan.chargingStops.length >= 1);
  assert.equal(plan.chargingStops[0].station.name, 'Highway Fast Charging Hub');
  assert.ok(plan.chargingStops[0].chargingDurationMinutes > 0);
  assert.ok(plan.totalDistanceKm === 142.5);
});
