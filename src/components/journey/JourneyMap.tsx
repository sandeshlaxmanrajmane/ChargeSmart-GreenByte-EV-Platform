import React, { useEffect, useRef } from 'react';
import { RouteResult, RouteChargingStop, ChargingStation } from '../../types';
import L from 'leaflet';

interface JourneyMapProps {
  startLocation: { name: string; latitude: number; longitude: number } | null;
  destLocation: { name: string; latitude: number; longitude: number } | null;
  routeResult: RouteResult | null;
  chargingStops: RouteChargingStop[];
  corridorStations: ChargingStation[];
  onSelectStation: (station: ChargingStation) => void;
  currencySymbol: string;
}

export const JourneyMap: React.FC<JourneyMapProps> = ({
  startLocation,
  destLocation,
  routeResult,
  chargingStops,
  corridorStations,
  onSelectStation,
  currencySymbol,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const defaultCenter: [number, number] = startLocation
        ? [startLocation.latitude, startLocation.longitude]
        : [12.9716, 77.5946];

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 11,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layers = layerGroupRef.current;
    if (!map || !layers) return;

    layers.clearLayers();

    const boundsPoints: [number, number][] = [];

    // 1. Draw Start Pin (A)
    if (startLocation) {
      boundsPoints.push([startLocation.latitude, startLocation.longitude]);
      const startIcon = L.divIcon({
        html: `
          <div style="
            background: #059669;
            color: white;
            font-weight: 900;
            font-size: 13px;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          ">A</div>
        `,
        className: 'start-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const m = L.marker([startLocation.latitude, startLocation.longitude], { icon: startIcon });
      m.bindPopup(`<strong>Origin:</strong> ${startLocation.name}`);
      layers.addLayer(m);
    }

    // 2. Draw Destination Pin (B)
    if (destLocation) {
      boundsPoints.push([destLocation.latitude, destLocation.longitude]);
      const destIcon = L.divIcon({
        html: `
          <div style="
            background: #0284C7;
            color: white;
            font-weight: 900;
            font-size: 13px;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          ">B</div>
        `,
        className: 'dest-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const m = L.marker([destLocation.latitude, destLocation.longitude], { icon: destIcon });
      m.bindPopup(`<strong>Destination:</strong> ${destLocation.name}`);
      layers.addLayer(m);
    }

    // 3. Draw Route Polyline
    if (routeResult && routeResult.coordinates.length > 0) {
      routeResult.coordinates.forEach((pt) => boundsPoints.push(pt));

      const polyline = L.polyline(routeResult.coordinates, {
        color: '#10B981',
        weight: 5,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
      });
      layers.addLayer(polyline);
    }

    // 4. Draw Corridor Charging Stations
    corridorStations.forEach((st) => {
      boundsPoints.push([st.latitude, st.longitude]);
      const isSelectedStop = chargingStops.some((cs) => cs.station.id === st.id);

      const markerHtml = `
        <div style="
          background: ${isSelectedStop ? '#F59E0B' : '#0D9488'};
          color: white;
          font-weight: bold;
          font-size: 13px;
          width: ${isSelectedStop ? '36px' : '28px'};
          height: ${isSelectedStop ? '36px' : '28px'};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2.5px solid white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          cursor: pointer;
        ">
          ⚡
        </div>
      `;

      const stIcon = L.divIcon({
        html: markerHtml,
        className: 'station-route-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const marker = L.marker([st.latitude, st.longitude], { icon: stIcon });
      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; min-width: 170px;">
          <strong style="color: #064E3B; font-size: 13px;">${st.name}</strong><br/>
          <span style="color: #64748B;">${st.operator} • ${st.maxPowerKw} kW</span><br/>
          <span style="color: #059669; font-weight: bold;">${st.renewableInfo.greenSharePercent}% Clean Energy</span><br/>
          <button id="add-stop-${st.id}" style="
            margin-top: 6px;
            background: #059669;
            color: white;
            border: none;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: bold;
            cursor: pointer;
            width: 100%;
          ">${isSelectedStop ? 'Selected Charging Stop' : 'Select as Charging Stop'}</button>
        </div>
      `);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`add-stop-${st.id}`);
        if (btn) {
          btn.onclick = () => onSelectStation(st);
        }
      });

      layers.addLayer(marker);
    });

    // Auto-fit bounds
    if (boundsPoints.length >= 2) {
      try {
        map.fitBounds(L.latLngBounds(boundsPoints), { padding: [40, 40], maxZoom: 14 });
      } catch {
        // Fallback
      }
    }
  }, [startLocation, destLocation, routeResult, chargingStops, corridorStations]);

  return (
    <div className="w-full h-96 sm:h-[460px] rounded-3xl overflow-hidden shadow-card border border-slate-200 relative z-0">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
