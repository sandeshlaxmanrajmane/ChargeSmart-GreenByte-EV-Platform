import type { ChargingStation, RouteResult, RouteChargingStop, JourneyPlan } from '../types/index.ts';
import { calculateDistanceKm } from '../utils/geoUtils.ts';

class RoutingService {
  /**
   * Calculates driving route between two GPS coordinates using OSRM or straight geodesic fallback
   */
  async calculateRoute(
    startLat: number,
    startLon: number,
    destLat: number,
    destLon: number
  ): Promise<RouteResult> {
    // 1. Try backend route endpoint
    try {
      const res = await fetch(
        `/api/route?startLat=${startLat}&startLon=${startLon}&destLat=${destLat}&destLon=${destLon}`,
        { signal: AbortSignal.timeout(6000) }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.coordinates && data.coordinates.length > 0) {
          return data;
        }
      }
    } catch {
      // Backend proxy fallback
    }

    // 2. Direct OSRM public API
    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${destLon},${destLat}?overview=full&geometries=geojson`;
      const res = await fetch(osrmUrl, { signal: AbortSignal.timeout(7000) });
      if (res.ok) {
        const data = await res.json();
        const routes = data.routes || [];
        if (routes.length > 0) {
          const route = routes[0];
          const distKm = Number((route.distance / 1000.0).toFixed(1));
          const durationMins = Math.round(route.duration / 60.0);
          const coords = route.geometry.coordinates || [];
          // OSRM returns [lon, lat], convert to [lat, lon]
          const latLonPoints: [number, number][] = coords.map((c: [number, number]) => [c[1], c[0]]);

          return {
            distanceKm: distKm,
            durationMinutes: durationMins,
            durationFormatted:
              durationMins >= 60
                ? `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`
                : `${durationMins}m`,
            coordinates: latLonPoints,
            isSimulatedRoute: false,
            provider: 'OSRM Open Source Routing Machine',
          };
        }
      }
    } catch (e) {
      console.warn('OSRM routing failed, using geodesic estimation', e);
    }

    // 3. Mathematical Geodesic Fallback
    const directDistKm = calculateDistanceKm(startLat, startLon, destLat, destLon);
    // Real road distance is typically 1.25x - 1.35x direct straight-line distance
    const estRoadDistKm = Number((directDistKm * 1.28).toFixed(1));
    const estDriveTimeMins = Math.round((estRoadDistKm / 60.0) * 60.0);

    const samplePoints: [number, number][] = [];
    const steps = 15;
    for (let i = 0; i <= steps; i++) {
      const frac = i / steps;
      samplePoints.push([
        Number((startLat + frac * (destLat - startLat)).toFixed(5)),
        Number((startLon + frac * (destLon - startLon)).toFixed(5)),
      ]);
    }

    return {
      distanceKm: estRoadDistKm,
      durationMinutes: estDriveTimeMins,
      durationFormatted:
        estDriveTimeMins >= 60
          ? `${Math.floor(estDriveTimeMins / 60)}h ${estDriveTimeMins % 60}m`
          : `${estDriveTimeMins}m`,
      coordinates: samplePoints,
      isSimulatedRoute: true,
      provider: 'Geodesic Road Model (OSRM Offline)',
    };
  }

  /**
   * Estimates energy consumption for a given road distance
   */
  estimateEnergyKwh(
    distanceKm: number,
    batteryCapacityKwh: number,
    ratedRangeKm: number
  ): number {
    const consumptionKwhPerKm = batteryCapacityKwh / Math.max(1, ratedRangeKm);
    // 5% auxiliary buffer for HVAC and elevation
    return Number((distanceKm * consumptionKwhPerKm * 1.05).toFixed(1));
  }

  /**
   * Filters stations that lie within a corridor near the route waypoints
   */
  findStationsAlongRoute(
    routeCoords: [number, number][],
    stations: ChargingStation[],
    maxCorridorKm: number = 8.0
  ): ChargingStation[] {
    if (routeCoords.length === 0 || stations.length === 0) return [];

    // Subsample route coordinates to prevent excessive checks (max 30 points)
    const stride = Math.max(1, Math.floor(routeCoords.length / 30));
    const sampledPoints = routeCoords.filter((_, idx) => idx % stride === 0);

    return stations.filter((station) => {
      // Find minimum distance from station to any sampled route point
      let minDistance = Infinity;
      for (const pt of sampledPoints) {
        const d = calculateDistanceKm(station.latitude, station.longitude, pt[0], pt[1]);
        if (d < minDistance) {
          minDistance = d;
        }
        if (minDistance <= maxCorridorKm) return true;
      }
      return minDistance <= maxCorridorKm;
    });
  }

  /**
   * Generates a complete Journey Plan with recommended charging stop calculations
   */
  planJourney(params: {
    startLocation: { name: string; latitude: number; longitude: number };
    destLocation: { name: string; latitude: number; longitude: number };
    vehicleName: string;
    batteryCapacityKwh: number;
    ratedRangeKm: number;
    currentSocPercent: number;
    targetArrivalBufferPercent: number;
    routeResult: RouteResult;
    availableStations: ChargingStation[];
  }): JourneyPlan {
    const {
      startLocation,
      destLocation,
      vehicleName,
      batteryCapacityKwh,
      ratedRangeKm,
      currentSocPercent,
      targetArrivalBufferPercent,
      routeResult,
      availableStations,
    } = params;

    const totalDistance = routeResult.distanceKm;
    const estTotalEnergy = this.estimateEnergyKwh(totalDistance, batteryCapacityKwh, ratedRangeKm);

    // Current usable range before reaching the target buffer
    const usableSoc = Math.max(0, currentSocPercent - targetArrivalBufferPercent);
    const usableRangeKm = ratedRangeKm * (usableSoc / 100.0);

    const requiresStop = totalDistance > usableRangeKm;
    const chargingStops: RouteChargingStop[] = [];

    let totalChargingTime = 0;
    let totalChargingCost = 0;

    if (requiresStop && availableStations.length > 0) {
      // Find candidate stations situated around the midpoint of usable range
      const candidateStations = this.findStationsAlongRoute(
        routeResult.coordinates,
        availableStations,
        15.0
      );

      // Pick the best station based on power and location
      const selectedStation =
        candidateStations.length > 0
          ? candidateStations.sort((a, b) => b.maxPowerKw - a.maxPowerKw)[0]
          : availableStations[0];

      if (selectedStation) {
        const distFromStart = Number((usableRangeKm * 0.75).toFixed(1));
        const energyConsumedToStop = this.estimateEnergyKwh(distFromStart, batteryCapacityKwh, ratedRangeKm);
        const arrivalSoc = Math.max(5, Math.round(currentSocPercent - (energyConsumedToStop / batteryCapacityKwh) * 100));

        // Target to charge up to 80% SoC (fast charging sweet spot)
        const targetDepartureSoc = 80;
        const energyNeeded = Number(
          (batteryCapacityKwh * ((targetDepartureSoc - arrivalSoc) / 100.0)).toFixed(1)
        );

        // Effective charging power limited by station power
        const effectivePower = Math.min(selectedStation.maxPowerKw, 100);
        const chargingHours = energyNeeded / effectivePower;
        const chargingMins = Math.round(chargingHours * 60);

        const cost = Number((energyNeeded * (selectedStation.pricePerKwh || 0.18)).toFixed(2));

        chargingStops.push({
          station: selectedStation,
          distanceFromStartKm: distFromStart,
          estimatedArrivalSocPercent: arrivalSoc,
          targetDepartureSocPercent: targetDepartureSoc,
          energyNeededKwh: energyNeeded,
          chargingDurationMinutes: chargingMins,
          estimatedCost: cost,
        });

        totalChargingTime += chargingMins;
        totalChargingCost += cost;
      }
    }

    return {
      id: `journey-${Date.now()}`,
      createdAt: new Date().toISOString(),
      startLocation,
      destLocation,
      vehicleName,
      batteryCapacityKwh,
      vehicleRangeKm: ratedRangeKm,
      currentBatteryPercent: currentSocPercent,
      totalDistanceKm: totalDistance,
      totalDriveTimeFormatted: routeResult.durationFormatted,
      estimatedEnergyKwh: estTotalEnergy,
      requiresChargingStop: requiresStop,
      chargingStops,
      totalJourneyCost: totalChargingCost,
      totalChargingTimeMinutes: totalChargingTime,
    };
  }
}

export const routingService = new RoutingService();
