import React, { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import L from 'leaflet';

interface MapPickerProps {
  label: string;
  value: string;
  lat?: number;
  lng?: number;
  onChange: (address: string, lat: number, lng: number) => void;
  placeholder?: string;
}

export default function MapPicker({
  label,
  value,
  lat = 24.7136, // Default Riyadh lat
  lng = 46.6753, // Default Riyadh lng
  onChange,
}: MapPickerProps) {
  const [currentLat, setCurrentLat] = useState(lat);
  const [currentLng, setCurrentLng] = useState(lng);
  const [addressText, setAddressText] = useState(value);

  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerId = useRef(`map-${Math.random().toString(36).substring(2, 9)}`);

  // Sync state with parent value on initialization
  useEffect(() => {
    if (lat && lng && (lat !== currentLat || lng !== currentLng)) {
      setCurrentLat(lat);
      setCurrentLng(lng);
      if (mapRef.current && markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
        mapRef.current.setView([lat, lng], mapRef.current.getZoom());
      }
    }
    if (value) {
      setAddressText(value);
    }
  }, [lat, lng, value]);

  // Leaflet initialization
  useEffect(() => {
    const mapElement = document.getElementById(containerId.current);
    if (!mapElement) return;

    try {
      // Create map
      const map = L.map(containerId.current, {
        center: [currentLat, currentLng],
        zoom: 12,
        zoomControl: true,
      });
      mapRef.current = map;

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
      }).addTo(map);

      // Create a gorgeous custom SVG Marker Pin
      const customPinIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-bounce-slow">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <div class="absolute -bottom-1 w-2 h-2 bg-amber-600 rounded-full blur-[2px] opacity-75"></div>
          </div>
        `,
        className: 'custom-pin-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      // Add marker to map
      const marker = L.marker([currentLat, currentLng], {
        draggable: true,
        icon: customPinIcon,
      }).addTo(map);
      markerRef.current = marker;

      // Listen for marker drag event
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        setCurrentLat(position.lat);
        setCurrentLng(position.lng);
        reverseGeocode(position.lat, position.lng);
      });

      // Listen for map clicks
      map.on('click', (e) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        setCurrentLat(clickLat);
        setCurrentLng(clickLng);
        marker.setLatLng([clickLat, clickLng]);
        reverseGeocode(clickLat, clickLng);
      });
    } catch (err) {
      console.warn("Leaflet map rendering warning:", err);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Reverse Geocoding using Nominatim OpenStreetMap API
  const reverseGeocode = async (lLat: number, lLng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lLat}&lon=${lLng}&accept-language=ar`, {
        headers: {
          'User-Agent': 'SAS-Logistics-Platform'
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          const friendlyName = data.display_name;
          setAddressText(friendlyName);
          onChange(friendlyName, lLat, lLng);
          return;
        }
      }
    } catch (err) {
      console.warn('Nominatim reverse geocoding bypassed (using local coordinates labeling).', err);
    }

    const coordinateStr = `الموقع عند الإحداثيات (${lLat.toFixed(4)}, ${lLng.toFixed(4)})`;
    setAddressText(coordinateStr);
    onChange(coordinateStr, lLat, lLng);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700">{label}</label>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          خريطة OpenStreetMap التفاعلية نشطة
        </span>
      </div>

      {/* Input Address display */}
      <div className="relative">
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <MapPin className="w-4 h-4 text-slate-400" />
        </div>
        <input
          type="text"
          value={addressText}
          onChange={(e) => {
            setAddressText(e.target.value);
            onChange(e.target.value, currentLat, currentLng);
          }}
          placeholder="أدخل العنوان التفصيلي أو استخدم الخريطة للتحديد..."
          className="w-full text-sm pr-9 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-slate-950 font-medium"
        />
      </div>

      {/* Actual OSM Map Panel using Leaflet */}
      <div className="relative h-56 w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 z-0">
        <div id={containerId.current} className="w-full h-full" />
        
        {/* Quick instructions tag */}
        <div className="absolute bottom-2 right-2 bg-slate-900/80 text-[10px] text-white px-2 py-1 rounded backdrop-blur-xs z-[1000]">
          انقر في أي مكان أو اسحب الدبوس لتحديث العنوان
        </div>
      </div>
    </div>
  );
}
