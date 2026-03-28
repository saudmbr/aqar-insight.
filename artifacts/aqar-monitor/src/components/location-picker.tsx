import { useEffect, useRef, useCallback, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Loader2, MapPin, Navigation, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SA_CENTER: [number, number] = [23.8859, 45.0792];
const SA_ZOOM = 5;

const SAUDI_CITIES: Record<string, [number, number]> = {
  "الرياض": [24.7136, 46.6753],
  "جدة": [21.4858, 39.1925],
  "مكة المكرمة": [21.3891, 39.8579],
  "المدينة المنورة": [24.5247, 39.5692],
  "الدمام": [26.4207, 50.0888],
  "الخبر": [26.2172, 50.1971],
  "تبوك": [28.3838, 36.5550],
  "أبها": [18.2164, 42.5053],
  "الطائف": [21.2854, 40.4149],
  "بريدة": [26.3260, 43.9750],
};

function makePinIcon(confirmed: boolean): L.DivIcon {
  const color = confirmed ? "#0F7BA0" : "#C9A84C";
  return L.divIcon({
    className: "",
    iconAnchor: [16, 40],
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
        <div style="
          width:32px;height:32px;border-radius:50% 50% 50% 0;
          background:${color};border:3px solid white;
          box-shadow:0 3px 12px rgba(0,0,0,0.35);
          transform:rotate(-45deg);
          display:flex;align-items:center;justify-content:center;
        ">
          <div style="
            width:10px;height:10px;border-radius:50%;
            background:white;transform:rotate(45deg);
          "></div>
        </div>
        <div style="width:2px;height:6px;background:${color};margin-top:-1px;"></div>
      </div>
    `,
  });
}

async function reverseGeocode(lat: number, lng: number): Promise<{ city?: string; district?: string; address?: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`,
      { headers: { "User-Agent": "AqarInsight/1.0" } }
    );
    if (!res.ok) return {};
    const data = await res.json() as {
      address?: {
        city?: string;
        town?: string;
        village?: string;
        suburb?: string;
        neighbourhood?: string;
        quarter?: string;
        county?: string;
        state?: string;
        road?: string;
      };
      display_name?: string;
    };
    const a = data.address ?? {};
    const city = a.city ?? a.town ?? a.village ?? a.county ?? a.state ?? "";
    const district = a.suburb ?? a.neighbourhood ?? a.quarter ?? "";
    const address = data.display_name ?? "";
    return { city, district, address };
  } catch {
    return {};
  }
}

export type LocationValue = {
  lat: number;
  lng: number;
  city?: string;
  district?: string;
  address?: string;
};

type Props = {
  value: LocationValue | null;
  onChange: (v: LocationValue | null) => void;
  defaultCity?: string;
};

export default function LocationPicker({ value, onChange, defaultCity }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [showManual, setShowManual] = useState(false);

  const updateMarker = useCallback((lat: number, lng: number) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], {
        icon: makePinIcon(true),
        draggable: true,
      }).addTo(map);

      markerRef.current.on("dragend", () => {
        const pos = markerRef.current?.getLatLng();
        if (!pos) return;
        void placePin(pos.lat, pos.lng);
      });
    }
    map.setView([lat, lng], Math.max(map.getZoom(), 14), { animate: true });
  }, []);

  const placePin = useCallback(async (lat: number, lng: number) => {
    setGeocoding(true);
    setGeoError(null);
    updateMarker(lat, lng);
    onChange({ lat, lng });
    try {
      const result = await reverseGeocode(lat, lng);
      onChange({
        lat,
        lng,
        city: result.city ?? defaultCity,
        district: result.district,
        address: result.address,
      });
    } catch {
      onChange({ lat, lng, city: defaultCity });
    } finally {
      setGeocoding(false);
    }
  }, [onChange, defaultCity, updateMarker]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    (L.Icon.Default.prototype as any)._getIconUrl = undefined;
    L.Icon.Default.mergeOptions({ iconUrl: "", shadowUrl: "" });

    const cityCoords = defaultCity ? SAUDI_CITIES[defaultCity] : null;
    const initCenter: [number, number] = cityCoords ?? SA_CENTER;
    const initZoom = cityCoords ? 11 : SA_ZOOM;

    const map = L.map(mapRef.current, {
      center: initCenter,
      zoom: initZoom,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    map.on("click", (e) => {
      void placePin(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (defaultCity && mapInstanceRef.current && !value) {
      const coords = SAUDI_CITIES[defaultCity];
      if (coords) {
        mapInstanceRef.current.setView(coords, 11, { animate: false });
      }
    }
  }, [defaultCity]);

  useEffect(() => {
    if (value && mapInstanceRef.current) {
      updateMarker(value.lat, value.lng);
    } else if (!value && markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  }, [value]);

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setGeoError("المتصفح لا يدعم تحديد الموقع");
      return;
    }
    setGeoError(null);
    setGeocoding(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const SA_LAT_MIN = 15.5, SA_LAT_MAX = 32.2;
        const SA_LNG_MIN = 34.5, SA_LNG_MAX = 55.8;
        if (lat < SA_LAT_MIN || lat > SA_LAT_MAX || lng < SA_LNG_MIN || lng > SA_LNG_MAX) {
          setGeoError("الموقع خارج المملكة العربية السعودية");
          setGeocoding(false);
          return;
        }
        void placePin(lat, lng);
      },
      () => {
        setGeoError("تعذّر تحديد الموقع. تأكد من منح الإذن للمتصفح.");
        setGeocoding(false);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleManualApply = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng)) {
      setGeoError("أدخل إحداثيات صحيحة");
      return;
    }
    if (lat < 15.5 || lat > 32.2 || lng < 34.5 || lng > 55.8) {
      setGeoError("الإحداثيات خارج حدود المملكة العربية السعودية");
      return;
    }
    setGeoError(null);
    void placePin(lat, lng);
  };

  const handleClear = () => {
    onChange(null);
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    setManualLat("");
    setManualLng("");
    setGeoError(null);
  };

  return (
    <div className="space-y-3">
      {/* Map */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-border" style={{ height: 320 }}>
        <div ref={mapRef} style={{ height: "100%", width: "100%" }} className="z-0" />

        {/* Overlay hint when no pin set */}
        {!value && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[400]">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-md border border-border flex items-center gap-2 text-sm font-semibold text-foreground">
              <MapPin className="w-4 h-4 text-primary" />
              انقر على الخريطة لتحديد الموقع
            </div>
          </div>
        )}

        {/* Geocoding indicator */}
        {geocoding && (
          <div className="absolute top-3 right-3 z-[500] bg-white rounded-xl px-3 py-1.5 shadow flex items-center gap-2 text-xs font-medium text-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            جارٍ تحديد العنوان…
          </div>
        )}

        {/* Controls overlay */}
        <div className="absolute bottom-3 left-3 z-[500] flex flex-col gap-2">
          <button
            type="button"
            onClick={handleGeolocate}
            className="bg-white rounded-xl px-3 py-2 shadow-md border border-border flex items-center gap-2 text-xs font-bold text-foreground hover:bg-primary hover:text-white transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" />
            موقعي الحالي
          </button>
          <button
            type="button"
            onClick={() => setShowManual(v => !v)}
            className="bg-white rounded-xl px-3 py-2 shadow-md border border-border flex items-center gap-2 text-xs font-bold text-foreground hover:bg-muted transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-primary" />
            إدخال يدوي
          </button>
        </div>
      </div>

      {/* Manual coord input */}
      {showManual && (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">خط العرض (Latitude)</label>
            <Input
              placeholder="مثال: 24.7136"
              value={manualLat}
              onChange={e => setManualLat(e.target.value)}
              className="h-10 rounded-xl font-mono text-sm"
              dir="ltr"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">خط الطول (Longitude)</label>
            <Input
              placeholder="مثال: 46.6753"
              value={manualLng}
              onChange={e => setManualLng(e.target.value)}
              className="h-10 rounded-xl font-mono text-sm"
              dir="ltr"
            />
          </div>
          <Button
            type="button"
            onClick={handleManualApply}
            size="sm"
            className="h-10 px-4 rounded-xl"
          >
            تطبيق
          </Button>
        </div>
      )}

      {/* Error */}
      {geoError && (
        <p className="text-sm text-destructive font-medium flex items-center gap-2">
          <X className="w-4 h-4" />{geoError}
        </p>
      )}

      {/* Confirmed location display */}
      {value && (
        <div className="flex items-start gap-3 p-4 rounded-2xl border border-primary/20 bg-primary/5">
          <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground mb-0.5">تم تحديد الموقع</p>
            {(value.city || value.district) && (
              <p className="text-sm text-muted-foreground">
                {[value.district, value.city].filter(Boolean).join("، ")}
              </p>
            )}
            <p className="text-xs text-muted-foreground/70 font-mono mt-1" dir="ltr">
              {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-lg hover:bg-destructive/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
