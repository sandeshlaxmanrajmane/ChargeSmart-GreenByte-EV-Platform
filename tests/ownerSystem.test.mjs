import test from 'node:test';
import assert from 'node:assert/strict';
import { ownerService } from '../src/services/ownerService.ts';
import { stationService } from '../src/services/stationService.ts';

test('Owner System: Transform OwnerStation to public ChargingStation model', () => {
  const mockOwnerStations = [
    {
      id: 'st-test-01',
      owner_id: 'owner-test',
      name: 'EcoHub Flagship Center',
      description: 'Ultra-fast solar backed hub',
      address: '100 Innovation Blvd',
      city: 'Metropolis',
      state: 'CA',
      postal_code: '94016',
      country: 'USA',
      latitude: 37.7749,
      longitude: -122.4194,
      operating_hours: '24/7 Access',
      facilities: ['Solar Canopy', 'Restrooms', 'Free WiFi'],
      network_operator: 'ChargeSmart Verified',
      is_public: true,
      chargers: [
        {
          id: 'ch-1',
          charger_identifier: 'Bay 1 — 150kW CCS2',
          connector_type: 'CCS2',
          charging_type: 'DC Fast',
          power_kw: 150.0,
          total_connectors: 2,
          price_per_kwh: 0.25,
          currency: 'USD',
          availability_status: 'Available',
          operating_status: 'Online',
          last_status_updated: new Date().toISOString(),
        },
        {
          id: 'ch-2',
          charger_identifier: 'Bay 2 — 60kW CCS2',
          connector_type: 'CCS2',
          charging_type: 'DC Fast',
          power_kw: 60.0,
          total_connectors: 1,
          price_per_kwh: 0.20,
          currency: 'USD',
          availability_status: 'Occupied',
          operating_status: 'Online',
          last_status_updated: new Date().toISOString(),
        },
        {
          id: 'ch-3',
          charger_identifier: 'Bay 3 — 22kW Type 2',
          connector_type: 'Type 2',
          charging_type: 'AC Level 2',
          power_kw: 22.0,
          total_connectors: 2,
          price_per_kwh: 0.15,
          currency: 'USD',
          availability_status: 'Maintenance',
          operating_status: 'Online',
          last_status_updated: new Date().toISOString(),
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const publicStations = ownerService.mapOwnerStationsToPublic(mockOwnerStations, 37.7750, -122.4195);
  assert.equal(publicStations.length, 1);

  const st = publicStations[0];
  assert.equal(st.name, 'EcoHub Flagship Center');
  assert.equal(st.dataProvider, 'ChargeSmart Verified Owner');
  assert.equal(st.isLiveStatusAvailable, true);
  assert.equal(st.liveStatus, 'operator_reported');

  // Total plugs: 2 (Bay 1) + 1 (Bay 2) + 2 (Bay 3) = 5
  assert.equal(st.totalPlugs, 5);
  // Available plugs: 2 (Bay 1) = 2
  assert.equal(st.availablePlugs, 2);
  // Occupied plugs: 1 (Bay 2) = 1
  assert.equal(st.occupiedPlugs, 1);
  // Maintenance plugs: 2 (Bay 3) = 2
  assert.equal(st.outOfServicePlugs, 2);

  // Max power should be 150 kW
  assert.equal(st.maxPowerKw, 150.0);
  // Min price should be 0.15
  assert.equal(st.pricePerKwh, 0.15);
  assert.equal(st.isVerifiedPrice, true);

  // Solar canopy check
  assert.equal(st.renewableInfo.source, 'On-Site Solar Canopy & BESS');
  assert.equal(st.renewableInfo.verified, true);
  assert.equal(st.renewableInfo.lifecycleRating, 'A+');
});

test('Station Service: Filter and sort stations', () => {
  const mockStations = [
    {
      id: 'st-1',
      name: 'Alpha Fast Hub',
      operator: 'Alpha Charge',
      address: '1st St',
      city: 'Metro',
      latitude: 10.0,
      longitude: 10.0,
      distanceKm: 4.5,
      totalPlugs: 4,
      availablePlugs: 2,
      connectors: [{ type: 'CCS2', powerKw: 150, available: 2, total: 2 }],
      maxPowerKw: 150,
      pricePerKwh: 0.22,
      isVerifiedPrice: true,
      currency: 'USD',
      renewableInfo: { source: 'Solar', verified: true, greenSharePercent: 90, lifecycleRating: 'A+' },
      amenities: [],
      status: 'available',
      isVerified: true,
      openingHours: '24/7',
    },
    {
      id: 'st-2',
      name: 'Beta AC Station',
      operator: 'Beta Power',
      address: '2nd St',
      city: 'Metro',
      latitude: 10.1,
      longitude: 10.1,
      distanceKm: 12.0,
      totalPlugs: 2,
      availablePlugs: 1,
      connectors: [{ type: 'Type 2', powerKw: 22, available: 1, total: 2 }],
      maxPowerKw: 22,
      pricePerKwh: 0.12,
      isVerifiedPrice: true,
      currency: 'USD',
      renewableInfo: { source: 'Grid', verified: false, greenSharePercent: 40, lifecycleRating: 'B' },
      amenities: [],
      status: 'available',
      isVerified: true,
      openingHours: '24/7',
    },
  ];

  stationService.setStations(mockStations);

  // Filter by connector CCS2
  const ccs2Stations = stationService.filterStations({ connectorType: 'CCS2' });
  assert.equal(ccs2Stations.length, 1);
  assert.equal(ccs2Stations[0].id, 'st-1');

  // Filter by min power 50kW
  const fastStations = stationService.filterStations({ minPowerKw: 50 });
  assert.equal(fastStations.length, 1);
  assert.equal(fastStations[0].id, 'st-1');

  // Sort by price
  const cheapStations = stationService.filterStations({ sortBy: 'price' });
  assert.equal(cheapStations[0].id, 'st-2'); // 0.12 is cheaper than 0.22

  // Sort by power
  const powerfulStations = stationService.filterStations({ sortBy: 'power' });
  assert.equal(powerfulStations[0].id, 'st-1'); // 150kW > 22kW
});
