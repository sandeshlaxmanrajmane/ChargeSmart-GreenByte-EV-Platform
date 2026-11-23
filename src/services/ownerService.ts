import type { StationOwner, OwnerStation, ChargerBay, OwnerAnalytics, ChargingStation } from '../types/index.ts';

const STORAGE_KEYS = {
  TOKEN: 'chargesmart_owner_token',
  PROFILE: 'chargesmart_owner_profile',
  LOCAL_STATIONS: 'chargesmart_owner_stations',
};

class OwnerService {
  private listeners: (() => void)[] = [];

  private notify() {
    this.listeners.forEach((l) => l());
    window.dispatchEvent(new Event('chargesmart_owner_updated'));
    window.dispatchEvent(new Event('chargesmart_data_updated'));
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  getToken(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.TOKEN);
    } catch {
      return null;
    }
  }

  getOwner(): StationOwner | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  setSession(token: string, owner: StationOwner) {
    try {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(owner));
      this.notify();
    } catch (e) {
      console.error('Failed to save owner session to localStorage', e);
    }
  }

  clearSession() {
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.PROFILE);
      this.notify();
    } catch (e) {
      console.error('Failed to clear owner session', e);
    }
  }

  // --- AUTHENTICATION ---

  async register(data: {
    fullName: string;
    email: string;
    phone?: string;
    businessName: string;
    password: string;
    businessAddress?: string;
  }): Promise<{ token: string; owner: StationOwner }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error || 'Registration failed');
    }

    this.setSession(body.token, body.owner);
    return body;
  }

  async login(email: string, password: string): Promise<{ token: string; owner: StationOwner }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error || 'Login failed');
    }

    this.setSession(body.token, body.owner);
    return body;
  }

  async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => {});
    }
    this.clearSession();
  }

  async fetchProfile(): Promise<StationOwner | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.owner) {
          localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(data.owner));
          return data.owner;
        }
      }
    } catch {
      // Offline fallback
    }
    return this.getOwner();
  }

  // --- STATIONS MANAGEMENT ---

  async getStations(): Promise<OwnerStation[]> {
    const token = this.getToken();
    if (token) {
      try {
        const res = await fetch('/api/owner/stations', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.stations) {
            localStorage.setItem(STORAGE_KEYS.LOCAL_STATIONS, JSON.stringify(data.stations));
            return data.stations;
          }
        }
      } catch {
        // Fall back to local stations
      }
    }

    // Local cached stations
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.LOCAL_STATIONS);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }

  async createStation(stationData: {
    name: string;
    description?: string;
    address: string;
    city: string;
    state?: string;
    postal_code?: string;
    country?: string;
    latitude: number;
    longitude: number;
    operating_hours?: string;
    facilities?: string[];
    contact_phone?: string;
    contact_email?: string;
    network_operator?: string;
    is_public?: boolean;
    photo_url?: string;
  }): Promise<OwnerStation> {
    const token = this.getToken();
    if (!token) throw new Error('You must be logged in as a station owner');

    const res = await fetch('/api/owner/stations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(stationData),
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error || 'Failed to create station');
    }

    this.notify();
    return body.station;
  }

  async updateStation(
    stationId: string,
    stationData: Partial<OwnerStation>
  ): Promise<OwnerStation> {
    const token = this.getToken();
    if (!token) throw new Error('You must be logged in as a station owner');

    const res = await fetch(`/api/owner/stations/${stationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(stationData),
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error || 'Failed to update station');
    }

    this.notify();
    return body.station;
  }

  async deleteStation(stationId: string): Promise<boolean> {
    const token = this.getToken();
    if (!token) throw new Error('You must be logged in as a station owner');

    const res = await fetch(`/api/owner/stations/${stationId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error || 'Failed to delete station');
    }

    this.notify();
    return true;
  }

  // --- CHARGER MANAGEMENT ---

  async addCharger(
    stationId: string,
    chargerData: {
      charger_identifier: string;
      connector_type: string;
      charging_type: string;
      power_kw: number;
      total_connectors?: number;
      price_per_kwh: number;
      currency?: string;
      additional_fees?: number;
      availability_status?: string;
      operating_status?: string;
    }
  ): Promise<ChargerBay> {
    const token = this.getToken();
    if (!token) throw new Error('You must be logged in as a station owner');

    const res = await fetch(`/api/owner/stations/${stationId}/chargers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(chargerData),
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error || 'Failed to add charger');
    }

    this.notify();
    return body.charger;
  }

  async updateCharger(
    chargerId: string,
    chargerData: Partial<ChargerBay>
  ): Promise<ChargerBay> {
    const token = this.getToken();
    if (!token) throw new Error('You must be logged in as a station owner');

    const res = await fetch(`/api/owner/chargers/${chargerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(chargerData),
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error || 'Failed to update charger');
    }

    this.notify();
    return body.charger;
  }

  async updateChargerStatus(
    chargerId: string,
    status: 'Available' | 'Occupied' | 'Out of Service' | 'Maintenance' | 'Offline',
    notes: string = ''
  ): Promise<ChargerBay> {
    const token = this.getToken();
    if (!token) throw new Error('You must be logged in as a station owner');

    const res = await fetch(`/api/owner/chargers/${chargerId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status, notes }),
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error || 'Failed to update charger status');
    }

    this.notify();
    return body.charger;
  }

  async deleteCharger(chargerId: string): Promise<boolean> {
    const token = this.getToken();
    if (!token) throw new Error('You must be logged in as a station owner');

    const res = await fetch(`/api/owner/chargers/${chargerId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error || 'Failed to delete charger');
    }

    this.notify();
    return true;
  }

  // --- ANALYTICS ---

  async getAnalytics(): Promise<OwnerAnalytics | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const res = await fetch('/api/owner/analytics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    // Compute basic local analytics if offline
    const stations = await this.getStations();
    let totalChargers = 0;
    let availableChargers = 0;
    let occupiedChargers = 0;
    let offlineChargers = 0;

    stations.forEach((st) => {
      (st.chargers || []).forEach((c) => {
        totalChargers++;
        if (c.availability_status === 'Available') availableChargers++;
        else if (c.availability_status === 'Occupied') occupiedChargers++;
        else offlineChargers++;
      });
    });

    const utilization = totalChargers > 0 ? (occupiedChargers / totalChargers) * 100 : 0;

    return {
      totalStations: stations.length,
      totalChargers,
      availableChargers,
      occupiedChargers,
      offlineChargers,
      utilizationRatePercent: Number(utilization.toFixed(1)),
      recentActivity: [],
    };
  }

  /**
   * Transforms OwnerStation list to public ChargingStation model for local sync
   */
  mapOwnerStationsToPublic(ownerStations: OwnerStation[], userLat?: number, userLon?: number): ChargingStation[] {
    return ownerStations
      .filter((st) => st.is_public)
      .map((st) => {
        const chargers = st.chargers || [];
        const totalPlugs = chargers.reduce((sum, c) => sum + (c.total_connectors || 1), 0);
        const availPlugs = chargers
          .filter((c) => c.availability_status === 'Available')
          .reduce((sum, c) => sum + (c.total_connectors || 1), 0);
        const occPlugs = chargers
          .filter((c) => c.availability_status === 'Occupied')
          .reduce((sum, c) => sum + (c.total_connectors || 1), 0);
        const maintPlugs = chargers
          .filter((c) => ['Maintenance', 'Out of Service', 'Offline'].includes(c.availability_status))
          .reduce((sum, c) => sum + (c.total_connectors || 1), 0);

        const maxKw = chargers.reduce((max, c) => Math.max(max, c.power_kw || 22), 22);
        const minPrice = chargers.reduce((min, c) => Math.min(min, c.price_per_kwh || 0.2), 0.2);

        // Calculate distance
        let dist = 1.5;
        if (userLat !== undefined && userLon !== undefined) {
          const R = 6371;
          const dLat = ((st.latitude - userLat) * Math.PI) / 180;
          const dLon = ((st.longitude - userLon) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((userLat * Math.PI) / 180) *
              Math.cos((st.latitude * Math.PI) / 180) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          dist = Number((R * c).toFixed(1));
        }

        const connectorsMap: Record<string, { type: string; powerKw: number; available: number; total: number }> = {};
        chargers.forEach((c) => {
          const t = c.connector_type || 'CCS2';
          if (!connectorsMap[t]) {
            connectorsMap[t] = { type: t, powerKw: c.power_kw, available: 0, total: 0 };
          }
          connectorsMap[t].total += c.total_connectors || 1;
          if (c.availability_status === 'Available') {
            connectorsMap[t].available += c.total_connectors || 1;
          }
          connectorsMap[t].powerKw = Math.max(connectorsMap[t].powerKw, c.power_kw);
        });

        const hasSolar = (st.facilities || []).some((f) => f.toLowerCase().includes('solar'));

        let latestUpdated = st.updated_at || new Date().toISOString();
        chargers.forEach((c) => {
          if (c.last_status_updated && c.last_status_updated > latestUpdated) {
            latestUpdated = c.last_status_updated;
          }
        });

        return {
          id: st.id,
          name: st.name,
          operator: st.network_operator || 'ChargeSmart Verified Network',
          address: st.address,
          city: st.city,
          state: st.state,
          postalCode: st.postal_code,
          country: st.country,
          latitude: st.latitude,
          longitude: st.longitude,
          distanceKm: dist,
          totalPlugs,
          availablePlugs: availPlugs,
          occupiedPlugs: occPlugs,
          outOfServicePlugs: maintPlugs,
          connectors: Object.values(connectorsMap),
          chargers,
          maxPowerKw: maxKw,
          pricePerKwh: minPrice,
          isVerifiedPrice: true,
          tariffDetails: `$${minPrice.toFixed(2)}/kWh verified operator rate`,
          currency: chargers[0]?.currency || 'USD',
          renewableInfo: {
            source: hasSolar ? 'On-Site Solar Canopy & BESS' : '100% Certified Green Grid Mix',
            verified: true,
            greenSharePercent: hasSolar ? 88 : 72,
            lifecycleRating: hasSolar ? 'A+' : 'A',
          },
          amenities: st.facilities || ['Public Access', '24/7 Security'],
          status: availPlugs > 0 ? 'available' : 'busy',
          liveStatus: 'operator_reported',
          isLiveStatusAvailable: true,
          dataProvider: 'ChargeSmart Verified Owner',
          lastUpdated: latestUpdated,
          isVerified: true,
          openingHours: st.operating_hours || '24/7 Access',
          contactPhone: st.contact_phone,
          contactEmail: st.contact_email,
          description: st.description,
          ownerId: st.owner_id,
        };
      });
  }
}

export const ownerService = new OwnerService();
