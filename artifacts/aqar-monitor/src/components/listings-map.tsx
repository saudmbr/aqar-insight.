import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

export type MapListing = {
  id: number;
  title: string;
  city: string;
  district?: string | null;
  price: number;
  areaSqm?: number | null;
  propertyType: string;
  listingType: string;
  images?: string | null;
};

type CityMarker = {
  city: string;
  count: number;
  avgPrice: number;
  lat: number;
  lng: number;
};

const SAUDI_CITIES: Record<string, [number, number]> = {
  "الرياض": [24.7136, 46.6753],
  "جدة": [21.4858, 39.1925],
  "مكة المكرمة": [21.3891, 39.8579],
  "المدينة المنورة": [24.5247, 39.5692],
  "الدمام": [26.4207, 50.0888],
  "الخبر": [26.2172, 50.1971],
  "الظهران": [26.2361, 50.0395],
  "تبوك": [28.3838, 36.5550],
  "أبها": [18.2164, 42.5053],
  "نجران": [17.4920, 44.1322],
  "جازان": [16.8892, 42.5611],
  "حائل": [27.5219, 41.6906],
  "عرعر": [30.9753, 41.0381],
  "القصيم": [26.3260, 43.9750],
  "بريدة": [26.3260, 43.9750],
  "الطائف": [21.2854, 40.4149],
  "القطيف": [26.5569, 50.0073],
  "ينبع": [24.0888, 38.0618],
  "الجبيل": [27.0174, 49.6581],
  "الأحساء": [25.3787, 49.5862],
  "خميس مشيط": [18.3059, 42.7289],
  "المجمعة": [25.9053, 45.3450],
  "شقراء": [25.2435, 45.2698],
  "رفحاء": [29.6253, 43.4953],
  "سكاكا": [29.9708, 40.2064],
  "الوجه": [26.2471, 36.4542],
  "صبيا": [17.1545, 42.6269],
  "محايل عسير": [18.5636, 42.0416],
};

function formatPrice(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}م ر.س`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}ألف ر.س`;
  return `${n} ر.س`;
}

type Props = {
  cityData: Array<{ city: string; count: number; avgPrice: number }>;
  onCityClick?: (city: string) => void;
  height?: number;
};

export default function ListingsMap({ cityData, onCityClick, height = 480 }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [23.8859, 45.0792],
      zoom: 5,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.eachLayer(layer => {
      if (layer instanceof L.CircleMarker || layer instanceof L.Marker) {
        layer.remove();
      }
    });

    const maxCount = Math.max(...cityData.map(d => d.count), 1);

    const markers: CityMarker[] = [];
    for (const entry of cityData) {
      const coords = SAUDI_CITIES[entry.city];
      if (coords) {
        markers.push({ ...entry, lat: coords[0], lng: coords[1] });
      }
    }

    if (markers.length === 0) {
      const fallbackCity = cityData[0];
      if (fallbackCity) {
        const center: [number, number] = [24.7136, 46.6753];
        markers.push({ ...fallbackCity, lat: center[0], lng: center[1] });
      }
    }

    for (const m of markers) {
      const radius = 16 + (m.count / maxCount) * 32;
      const intensity = 0.4 + (m.count / maxCount) * 0.6;
      const r = Math.round(15 + intensity * 0);
      const g = Math.round(123 + intensity * 0);
      const b = Math.round(160 + intensity * 0);
      const opacity = 0.55 + intensity * 0.35;

      const circle = L.circleMarker([m.lat, m.lng], {
        radius,
        fillColor: `rgba(15, 123, 160, ${opacity})`,
        color: "#0F7BA0",
        weight: 2,
        opacity: 0.9,
        fillOpacity: opacity,
      }).addTo(map);

      const popupContent = `
        <div dir="rtl" style="font-family: 'Segoe UI', Arial, sans-serif; min-width: 160px; padding: 4px;">
          <div style="font-size: 15px; font-weight: 700; color: #0F1C3F; margin-bottom: 8px;">📍 ${m.city}</div>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; justify-content: space-between; gap: 16px;">
              <span style="color: #666; font-size: 12px;">عدد الإعلانات</span>
              <span style="font-weight: 600; color: #0F7BA0; font-size: 12px;">${m.count}</span>
            </div>
            ${m.avgPrice > 0 ? `
            <div style="display: flex; justify-content: space-between; gap: 16px;">
              <span style="color: #666; font-size: 12px;">متوسط السعر</span>
              <span style="font-weight: 600; color: #0F1C3F; font-size: 12px;">${formatPrice(m.avgPrice)}</span>
            </div>` : ""}
          </div>
        </div>`;

      circle.bindPopup(popupContent, { direction: "right", offset: [0, -5] });

      if (onCityClick) {
        circle.on("click", () => onCityClick(m.city));
      }

      const label = L.divIcon({
        className: "",
        html: `<div style="background:white;border:1.5px solid #0F7BA0;border-radius:6px;padding:2px 6px;font-size:11px;font-weight:600;color:#0F1C3F;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.15);direction:rtl;">${m.city}</div>`,
        iconAnchor: [0, -radius - 4],
      });
      L.marker([m.lat, m.lng], { icon: label, interactive: false }).addTo(map);
    }

    if (markers.length > 0) {
      const group = L.featureGroup(markers.map(m => L.circleMarker([m.lat, m.lng], { radius: 1 })));
      map.fitBounds(group.getBounds().pad(0.3), { maxZoom: 8, animate: false });
    }
  }, [cityData, onCityClick]);

  return (
    <div
      ref={mapRef}
      style={{ height, width: "100%", borderRadius: 16, overflow: "hidden" }}
      className="z-0"
    />
  );
}
