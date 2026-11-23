import type { ChargingStation } from '../types/index.ts';
import { DEMO_STATIONS } from '../data/mockData.ts';

export interface StationFilterParams {
  searchQuery?: string;
  connectorType?: string;
  minPowerKw?: number;
  maxDistanceKm?: number;
  maxPrice?: number;
  operator?: string;
  onlyVerifiedRenewable?: boolean;
  sortBy?: 'distance' | 'price' | 'power' | 'renewable';
}

class StationService {
  private stations: ChargingStation[] = [...DEMO_STATIONS];
  private listeners: (() => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('chargesmart_owner_updated', () => {
        this.syncWithBackend();
      });
    }
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  async syncWithBackend(lat: number = 12.9716, lon: number = 77.5946, radiusM: number = 25000) {
    try {
      const res = await fetch(`/api/stations/nearby?lat=${lat}&lon=${lon}&radius=${radiusM}`);
      if (res.ok) {
        const data = await res.json();
        if (data.stations && Array.isArray(data.stations) && data.stations.length > 0) {
          this.setStations(data.stations);
        }
      }
    } catch {
      // Keep current in-memory stations
    }
  }

  getAllStations(): ChargingStation[] {
    return this.stations;
  }

  setStations(newStations: ChargingStation[]): void {
    this.stations = newStations;
    this.notify();
  }

  getStationById(id: string): ChargingStation | undefined {
    return this.stations.find((s) => s.id === id);
  }

  getUniqueOperators(): string[] {
    const set = new Set<string>();
    this.stations.forEach((s) => {
      if (s.operator) set.add(s.operator);
    });
    return Array.from(set).sort();
  }

  filterStations(params: StationFilterParams): ChargingStation[] {
    let result = [...this.stations];

    // Search query: station name, address, operator, or city
    if (params.searchQuery && params.searchQuery.trim() !== '') {
      const q = params.searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q) ||
          s.operator.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q)
      );
    }

    // Connector type
    if (params.connectorType && params.connectorType !== 'ALL') {
      result = result.filter((s) =>
        s.connectors.some(
          (c) =>
            c.type.toLowerCase().includes(params.connectorType!.toLowerCase()) ||
            params.connectorType!.toLowerCase().includes(c.type.toLowerCase())
        )
      );
    }

    // Min Power kW
    if (params.minPowerKw && params.minPowerKw > 0) {
      result = result.filter((s) => s.maxPowerKw >= (params.minPowerKw || 0));
    }

    // Max Distance Km
    if (params.maxDistanceKm && params.maxDistanceKm > 0) {
      result = result.filter((s) => s.distanceKm <= (params.maxDistanceKm || 50));
    }

    // Operator
    if (params.operator && params.operator !== 'ALL') {
      result = result.filter((s) => s.operator === params.operator);
    }

    // Max Price
    if (params.maxPrice && params.maxPrice > 0) {
      result = result.filter((s) => s.pricePerKwh <= (params.maxPrice || 0));
    }

    // Verified Renewable
    if (params.onlyVerifiedRenewable) {
      result = result.filter(
        (s) => s.renewableInfo.verified && s.renewableInfo.greenSharePercent >= 70
      );
    }

    // Sorting
    const sort = params.sortBy || 'distance';
    result.sort((a, b) => {
      if (sort === 'distance') return a.distanceKm - b.distanceKm;
      if (sort === 'price') {
        const priceA = a.isVerifiedPrice ? a.pricePerKwh : a.pricePerKwh + 1.0;
        const priceB = b.isVerifiedPrice ? b.pricePerKwh : b.pricePerKwh + 1.0;
        return priceA - priceB;
      }
      if (sort === 'power') return b.maxPowerKw - a.maxPowerKw;
      if (sort === 'renewable') return b.renewableInfo.greenSharePercent - a.renewableInfo.greenSharePercent;
      return 0;
    });

    return result;
  }
}

export const stationService = new StationService();
