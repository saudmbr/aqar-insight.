import { useEffect, useRef, useCallback } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { getImageSrc } from "@/lib/utils";

export type MapPin = {
  id: number;
  title: string;
  city: string;
  district?: string | null;
  price: number;
  areaSqm?: number | null;
  propertyType: string;
  listingType: string;
  images?: string | null;
  lat: number;
  lng: number;
  geocoded?: boolean;
};

type Props = {
  pins: MapPin[];
  activePinId?: number | null;
  onPinClick?: (id: number) => void;
  onBoundsChange?: (ids: number[]) => void;
  height?: number | string;
};

const LISTING_TYPE_LABELS: Record<string, string> = {
  sale: "للبيع", rent: "للإيجار",
  daily_rent: "إيجار يومي", monthly_rent: "إيجار شهري",
  investment: "استثماري", auction: "مزاد",
};

const LISTING_TYPE_COLORS: Record<string, string> = {
  sale: "#0F7BA0", rent: "#C9A84C",
  daily_rent: "#f97316", monthly_rent: "#0d9488",
  investment: "#7c3aed", auction: "#e11d48",
};

function formatPrice(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}م`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}ألف`;
  return `${n}`;
}

function getFirstImage(images?: string | null): string | null {
  if (!images) return null;
  const urls = images.split("\n").map(u => u.trim()).filter(Boolean);
  return urls[0] ? getImageSrc(urls[0]) : null;
}

function makePinIcon(listing: MapPin, isActive: boolean): L.DivIcon {
  const color = LISTING_TYPE_COLORS[listing.listingType] ?? "#0F7BA0";
  const label = LISTING_TYPE_LABELS[listing.listingType] ?? listing.listingType;
  const priceText = formatPrice(listing.price);
  const scale = isActive ? 1.15 : 1;
  const shadow = isActive
    ? `0 4px 16px rgba(0,0,0,0.35), 0 0 0 3px ${color}55`
    : "0 2px 8px rgba(0,0,0,0.22)";

  return L.divIcon({
    className: "",
    iconAnchor: [0, 40],
    popupAnchor: [0, -44],
    html: `
      <div style="
        position:relative;
        transform:scale(${scale});
        transform-origin:bottom center;
        transition:transform 0.2s ease;
      ">
        <div style="
          background:${color};
          color:#fff;
          border-radius:20px;
          padding:5px 10px;
          font-family:'Cairo',Arial,sans-serif;
          font-size:12px;
          font-weight:700;
          white-space:nowrap;
          box-shadow:${shadow};
          border:2px solid #fff;
          display:flex;
          align-items:center;
          gap:5px;
          direction:rtl;
          min-width:60px;
          justify-content:center;
        ">
          <span style="font-size:10px;opacity:0.9;">${label}</span>
          <span style="font-size:13px;">ر.س ${priceText}</span>
        </div>
        <div style="
          width:0;height:0;
          border-left:6px solid transparent;
          border-right:6px solid transparent;
          border-top:8px solid ${color};
          margin:0 auto;
          filter:drop-shadow(0 2px 3px rgba(0,0,0,.18));
        "></div>
      </div>`,
  });
}

function makePopupHtml(pin: MapPin): string {
  const color = LISTING_TYPE_COLORS[pin.listingType] ?? "#0F7BA0";
  const label = LISTING_TYPE_LABELS[pin.listingType] ?? pin.listingType;
  const img = getFirstImage(pin.images);
  const base = (window as any).__VITE_BASE__ ?? "";
  const href = `${base}/listings/${pin.id}`;

  return `
    <div dir="rtl" style="
      font-family:'Cairo',Arial,sans-serif;
      width:220px;
      border-radius:14px;
      overflow:hidden;
      direction:rtl;
    ">
      ${img
        ? `<div style="width:100%;height:110px;overflow:hidden;">
             <img src="${img}" alt="" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'"/>
           </div>`
        : `<div style="width:100%;height:70px;background:linear-gradient(135deg,#0F1C3F,#0F7BA0);display:flex;align-items:center;justify-content:center;">
             <span style="font-size:28px;opacity:0.5;">🏠</span>
           </div>`
      }
      <div style="padding:10px 12px 12px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
          <span style="background:${color};color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;">${label}</span>
          <span style="font-size:11px;color:#666;">${pin.propertyType}</span>
        </div>
        <div style="font-size:16px;font-weight:800;color:#0F1C3F;margin-bottom:4px;line-height:1.3;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${pin.title}</div>
        <div style="font-size:12px;color:#666;margin-bottom:8px;">📍 ${pin.city}${pin.district ? ` · ${pin.district}` : ""}</div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <div style="font-size:17px;font-weight:900;color:${color};">ر.س ${pin.price.toLocaleString("ar-SA")}</div>
          ${pin.areaSqm ? `<div style="font-size:11px;color:#888;">${pin.areaSqm} م²</div>` : ""}
        </div>
        <a href="${href}" style="
          display:block;
          background:${color};
          color:#fff;
          text-align:center;
          padding:7px;
          border-radius:8px;
          font-size:13px;
          font-weight:700;
          text-decoration:none;
        ">عرض التفاصيل ←</a>
      </div>
    </div>`;
}

export default function PropertyMap({
  pins,
  activePinId,
  onPinClick,
  onBoundsChange,
  height = 520,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const prevActivePinRef = useRef<number | null>(null);

  // Initialise the map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Remove Leaflet's broken default icon path detection
    (L.Icon.Default.prototype as any)._getIconUrl = undefined;
    L.Icon.Default.mergeOptions({ iconUrl: "", shadowUrl: "" });

    const map = L.map(mapRef.current, {
      center: [23.8859, 45.0792],
      zoom: 6,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    if (onBoundsChange) {
      const fireBoundsChange = () => {
        const bounds = map.getBounds();
        const visibleIds: number[] = [];
        markersRef.current.forEach((marker, id) => {
          if (bounds.contains(marker.getLatLng())) visibleIds.push(id);
        });
        onBoundsChange(visibleIds);
      };
      map.on("moveend", fireBoundsChange);
      map.on("zoomend", fireBoundsChange);
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  // Store base URL for popup links
  useEffect(() => {
    (window as any).__VITE_BASE__ = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");
  }, []);

  // Sync markers whenever pins change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current.clear();

    const isActive = (id: number) => id === activePinId;

    for (const pin of pins) {
      const marker = L.marker([pin.lat, pin.lng], {
        icon: makePinIcon(pin, isActive(pin.id)),
      }).addTo(map);

      marker.bindPopup(makePopupHtml(pin), {
        maxWidth: 240,
        className: "aqar-popup",
        closeButton: true,
      });

      if (onPinClick) {
        marker.on("click", () => onPinClick(pin.id));
      }

      markersRef.current.set(pin.id, marker);
    }

    // Fit map to all markers if we have some
    if (pins.length > 0) {
      const group = L.featureGroup(pins.map(p => L.circleMarker([p.lat, p.lng], { radius: 1 })));
      map.fitBounds(group.getBounds().pad(0.25), { maxZoom: 12, animate: false });

      // Report initial visible IDs
      if (onBoundsChange) {
        const bounds = map.getBounds();
        const visibleIds = pins
          .filter(p => bounds.contains(L.latLng(p.lat, p.lng)))
          .map(p => p.id);
        onBoundsChange(visibleIds);
      }
    }

    console.log(`[PropertyMap] Loaded ${pins.length} pins`);
    prevActivePinRef.current = activePinId ?? null;
  }, [pins]);

  // Update icon when active pin changes (without full re-render)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const prev = prevActivePinRef.current;
    if (prev !== null) {
      const oldPin = pins.find(p => p.id === prev);
      if (oldPin) {
        markersRef.current.get(prev)?.setIcon(makePinIcon(oldPin, false));
      }
    }

    if (activePinId !== null && activePinId !== undefined) {
      const pin = pins.find(p => p.id === activePinId);
      const marker = markersRef.current.get(activePinId);
      if (pin && marker) {
        marker.setIcon(makePinIcon(pin, true));
        marker.openPopup();
        map.panTo(marker.getLatLng(), { animate: true, duration: 0.4 });
      }
    }

    prevActivePinRef.current = activePinId ?? null;
  }, [activePinId, pins]);

  return (
    <div style={{ position: "relative", height, width: "100%" }}>
      <style>{`
        .aqar-popup .leaflet-popup-content-wrapper {
          border-radius: 14px !important;
          padding: 0 !important;
          overflow: hidden !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important;
          border: 1px solid rgba(0,0,0,0.08) !important;
        }
        .aqar-popup .leaflet-popup-content {
          margin: 0 !important;
          width: 220px !important;
        }
        .aqar-popup .leaflet-popup-tip {
          background: white !important;
        }
      `}</style>
      <div
        ref={mapRef}
        style={{ height: "100%", width: "100%", borderRadius: 16, overflow: "hidden" }}
        className="z-0"
      />
    </div>
  );
}
