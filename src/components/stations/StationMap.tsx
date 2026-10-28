import React, { useEffect, useRef } from 'react';
import { ChargingStation } from '../../types';
import { UserLocation } from '../../services/locationService';
import { getGoogleMapsNavigationUrl } from '../../utils/geoUtils';
import L from 'leaflet';

interface StationMapProps {
  stations: ChargingStation[];
  selectedStationId: string | null;
  onSelectStation: (station: ChargingStation) => void;
  currencySymbol: string;
  userLocation?: UserLocation | null;
}

export const StationMap: React.FC<StationMapProps> = ({
  stations,
  selectedStationId,
  onSelectStation,
  currencySymbol,
  userLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userCircleRef = useRef<L.Circle | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Map if not already created
    if (!mapInstanceRef.current) {
      const defaultCenter: [number, number] = userLocation
        ? [userLocation.latitude, userLocation.longitude]
        : [12.8615, 77.4385];

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 13,
        zoomControl: true,
      });

      // OpenStreetMap Tiles with subtle styling
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear previous station markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    // Station Marker Icon Factory
    const createStationIcon = (isVerified: boolean, isSelected: boolean) => {
      const bgColor = isSelected ? '#059669' : isVerified ? '#10B981' : '#0284C7';
      const size = isSelected ? 40 : 34;

      const svgHtml = `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background-color: ${bgColor};
          border: 2.5px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 15px;
          cursor: pointer;
        ">
          ⚡
        </div>
      `;

      return L.divIcon({
        html: svgHtml,
        className: 'custom-ev-marker',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
      });
    };

    // User Location Icon (Pulsing Radar Pin)
    const createUserLocationIcon = () => {
      const svgHtml = `
        <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
          <div style="
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: rgba(14, 165, 233, 0.4);
            animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
          <div style="
            width: 18px;
            height: 18px;
            background-color: #0284C7;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(2, 132, 199, 0.6);
            z-index: 10;
          "></div>
        </div>
      `;

      return L.divIcon({
        html: svgHtml,
        className: 'custom-user-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });
    };

    // 1. Render User Marker if available
    if (userMarkerRef.current) userMarkerRef.current.remove();
    if (userCircleRef.current) userCircleRef.current.remove();

    if (userLocation) {
      const userMarker = L.marker([userLocation.latitude, userLocation.longitude], {
        icon: createUserLocationIcon(),
        zIndexOffset: 1000,
      }).addTo(map);

      userMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; padding: 2px;">
          <div style="font-weight: bold; color: #0284c7; font-size: 13px;">📍 You Are Here</div>
          <div style="color: #64748b; font-size: 11px; margin-top: 2px;">
            ${userLocation.addressLabel || 'Current GPS Location'}
          </div>
          ${userLocation.accuracyMeters ? `<div style="color: #94a3b8; font-size: 10px; margin-top: 1px;">Accuracy: ±${userLocation.accuracyMeters}m</div>` : ''}
        </div>
      `);

      userMarkerRef.current = userMarker;

      if (userLocation.accuracyMeters && userLocation.accuracyMeters < 500) {
        userCircleRef.current = L.circle([userLocation.latitude, userLocation.longitude], {
          radius: userLocation.accuracyMeters,
          color: '#0284c7',
          fillColor: '#38bdf8',
          fillOpacity: 0.12,
          weight: 1,
        }).addTo(map);
      }
    }

    // 2. Render Station Markers
    stations.forEach((st) => {
      const isSelected = st.id === selectedStationId;
      const marker = L.marker([st.latitude, st.longitude], {
        icon: createStationIcon(st.renewableInfo.verified, isSelected),
      }).addTo(map);

      const navUrl = getGoogleMapsNavigationUrl(
        st.latitude,
        st.longitude,
        userLocation?.latitude,
        userLocation?.longitude
      );

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; max-width: 230px;">
          <div style="font-weight: bold; color: #0f172a; font-size: 13px;">${st.name}</div>
          <div style="color: #64748b; font-size: 11px; margin-top: 2px;">${st.address}</div>
          <div style="margin-top: 6px; font-weight: 700; color: #059669;">
            ⚡ ${st.maxPowerKw} kW • ${currencySymbol}${st.pricePerKwh}/kWh • ${st.distanceKm} km away
          </div>
          <div style="color: #0284c7; font-size: 11px; margin-top: 2px;">
            🌱 ${st.renewableInfo.greenSharePercent}% ${st.renewableInfo.source}
          </div>
          <div style="margin-top: 8px;">
            <a href="${navUrl}" target="_blank" rel="noopener noreferrer" style="
              display: inline-block;
              background-color: #059669;
              color: white;
              padding: 4px 10px;
              border-radius: 6px;
              text-decoration: none;
              font-weight: bold;
              font-size: 11px;
            ">
              🗺️ Open in Google Maps →
            </a>
          </div>
        </div>
      `);

      marker.on('click', () => {
        onSelectStation(st);
      });

      markersRef.current[st.id] = marker;
    });

    // 3. Draw Route Line between User and Selected Station
    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    if (userLocation && selectedStationId) {
      const selectedStation = stations.find((s) => s.id === selectedStationId);
      if (selectedStation) {
        routeLineRef.current = L.polyline(
          [
            [userLocation.latitude, userLocation.longitude],
            [selectedStation.latitude, selectedStation.longitude],
          ],
          {
            color: '#10B981',
            weight: 3.5,
            dashArray: '6, 8',
            opacity: 0.85,
          }
        ).addTo(map);

        // Fit bounds to show both user and destination
        map.fitBounds(
          [
            [userLocation.latitude, userLocation.longitude],
            [selectedStation.latitude, selectedStation.longitude],
          ],
          { padding: [50, 50], maxZoom: 15, animate: true }
        );
      }
    } else if (userLocation && !selectedStationId) {
      // Pan to user location initially
      map.setView([userLocation.latitude, userLocation.longitude], 13, { animate: true });
    }

    // Invalidate size on resize
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [stations, selectedStationId, onSelectStation, currencySymbol, userLocation]);

  return (
    <div className="relative w-full h-80 sm:h-96 md:h-[480px] rounded-3xl overflow-hidden shadow-card border border-slate-200">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Overlay Badge */}
      <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-md border border-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>
          {userLocation ? `Live GPS: ${userLocation.city || 'Located'}` : 'Interactive Station Radar'}
        </span>
      </div>

      {/* Legend Badge */}
      <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-slate-200 text-[11px] font-medium text-slate-700 flex flex-wrap items-center gap-3">
        {userLocation && (
          <div className="flex items-center gap-1.5 font-bold text-sky-700">
            <span className="w-3 h-3 rounded-full bg-sky-600 inline-block" />
            <span>You Are Here</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
          <span>Verified Green</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-teal-600 inline-block" />
          <span>Grid Mix</span>
        </div>
      </div>
    </div>
  );
};
