import { ChargingStation } from '../types';
import { DEMO_STATIONS } from '../data/mockData';

export interface StationFilterParams {
  searchQuery?: string;
  connectorType?: string;
  minPowerKw?: number;
  maxPrice?: number;
  onlyVerifiedRenewable?: boolean;
  sortBy?: 'distance' | 'price' | 'power' | 'renewable';
}

class StationService {
  private stations: ChargingStation[] = [...DEMO_STATIONS];

  getAllStations(): ChargingStation[] {
    return this.stations;
  }

  getStationById(id: string): ChargingStation | undefined {
    return this.stations.find((s) => s.id === id);
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
        s.connectors.some((c) => c.type === params.connectorType && c.available > 0)
      );
    }

    // Min Power kW
    if (params.minPowerKw && params.minPowerKw > 0) {
      result = result.filter((s) => s.maxPowerKw >= (params.minPowerKw || 0));
    }

    // Max Price
    if (params.maxPrice && params.maxPrice > 0) {
      result = result.filter((s) => s.pricePerKwh <= (params.maxPrice || 0));
    }

    // Verified Renewable
    if (params.onlyVerifiedRenewable) {
      result = result.filter((s) => s.renewableInfo.verified && s.renewableInfo.greenSharePercent >= 70);
    }

    // Sorting
    const sort = params.sortBy || 'distance';
    result.sort((a, b) => {
      if (sort === 'distance') return a.distanceKm - b.distanceKm;
      if (sort === 'price') return a.pricePerKwh - b.pricePerKwh;
      if (sort === 'power') return b.maxPowerKw - a.maxPowerKw;
      if (sort === 'renewable') return b.renewableInfo.greenSharePercent - a.renewableInfo.greenSharePercent;
      return 0;
    });

    return result;
  }
}

export const stationService = new StationService();
