import { useEffect, useRef, useCallback } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import L from "leaflet";
import "leaflet.markercluster";
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
  clustering?: boolean;
};

const LISTING_TYPE_LABELS: Record<string, string> = {
  sale: "للبيع", rent: "للإيجار",
  daily_rent: "إيجار يومي", monthly_rent: "إيجار شهري",
  investment: "استثماري", auction: "مزاد",
};

const LISTING_TYPE_COLORS: Record<string, string> = {
  sale: "#0F7BA0", rent: "#94A3B8",
  daily_rent: "#f97316", monthly_rent: "#0d9488",
  investment: "#7c3aed", auction: "#e11d48",
};

function formatPrice(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
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
  const scale = isActive ? 1.18 : 1;
  const shadow = isActive
    ? `0 6px 20px rgba(0,0,0,0.4), 0 0 0 3px ${color}66`
    : "0 3px 12px rgba(0,0,0,0.28), 0 1px 4px rgba(0,0,0,0.15)";

  return L.divIcon({
    className: "",
    iconAnchor: [44, 48],
    popupAnchor: [0, -52],
    html: `
      <div style="
        position:relative;
        transform:scale(${scale});
        transform-origin:bottom center;
        transition:transform 0.18s ease;
        display:inline-block;
      ">
        <div style="
          background:#ffffff;
          border-radius:12px;
          padding:5px 11px 5px 9px;
          font-family:'Cairo',Arial,sans-serif;
          white-space:nowrap;
          box-shadow:${shadow};
          border:2px solid ${color};
          display:flex;
          align-items:center;
          gap:6px;
          direction:rtl;
        ">
          <span style="
            display:inline-block;
            width:8px;height:8px;border-radius:50%;
            background:${color};
            flex-shrink:0;
          "></span>
          <span style="
            font-size:13.5px;
            font-weight:800;
            color:#0F1C3F;
            letter-spacing:-0.3px;
          ">ر.س ${priceText}</span>
          <span style="
            font-size:10px;
            font-weight:600;
            color:${color};
            background:${color}18;
            border-radius:6px;
            padding:1px 5px;
          ">${label}</span>
        </div>
        <div style="
          width:0;height:0;
          border-left:7px solid transparent;
          border-right:7px solid transparent;
          border-top:9px solid ${color};
          margin:0 auto;
          margin-top:-1px;
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
          <div style="font-size:17px;font-weight:900;color:${color};">ر.س ${pin.price.toLocaleString("en-US")}</div>
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
  clustering = true,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const prevActivePinRef = useRef<number | null>(null);

  const fireBoundsChange = useCallback(() => {
    if (!onBoundsChange || !mapInstanceRef.current) return;
    const bounds = mapInstanceRef.current.getBounds();
    const visibleIds: number[] = [];
    markersRef.current.forEach((marker, id) => {
      if (bounds.contains(marker.getLatLng())) visibleIds.push(id);
    });
    onBoundsChange(visibleIds);
  }, [onBoundsChange]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

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

    if (onBoundsChange) {
      map.on("moveend", fireBoundsChange);
      map.on("zoomend", fireBoundsChange);
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current.clear();
      clusterGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    (window as any).__VITE_BASE__ = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove previous cluster group or loose markers
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }
    markersRef.current.forEach(m => m.remove());
    markersRef.current.clear();

    const isActive = (id: number) => id === activePinId;

    if (clustering && pins.length > 0) {
      const group = (L as any).markerClusterGroup({
        maxClusterRadius: 60,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: (cluster: any) => {
          const count = cluster.getChildCount();
          return L.divIcon({
            html: `<div style="
              width:42px;height:42px;border-radius:50%;
              background:#0F7BA0;color:white;
              display:flex;align-items:center;justify-content:center;
              font-family:'Cairo',Arial,sans-serif;font-size:14px;font-weight:800;
              border:3px solid white;box-shadow:0 3px 14px rgba(15,123,160,0.45);
            ">${count}</div>`,
            className: "",
            iconSize: [42, 42],
            iconAnchor: [21, 21],
          });
        },
      }) as L.MarkerClusterGroup;

      for (const pin of pins) {
        const marker = L.marker([pin.lat, pin.lng], {
          icon: makePinIcon(pin, isActive(pin.id)),
        });

        marker.bindPopup(makePopupHtml(pin), {
          maxWidth: 240,
          className: "aqar-popup",
          closeButton: true,
        });

        if (onPinClick) {
          marker.on("click", () => onPinClick(pin.id));
        }

        markersRef.current.set(pin.id, marker);
        group.addLayer(marker);
      }

      group.addTo(map);
      clusterGroupRef.current = group;
    } else {
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
    }

    if (pins.length > 0) {
      const group = L.featureGroup(pins.map(p => L.circleMarker([p.lat, p.lng], { radius: 1 })));
      map.fitBounds(group.getBounds().pad(0.25), { maxZoom: 12, animate: false });

      if (onBoundsChange) {
        const bounds = map.getBounds();
        const visibleIds = pins
          .filter(p => bounds.contains(L.latLng(p.lat, p.lng)))
          .map(p => p.id);
        onBoundsChange(visibleIds);
      }
    }

    console.log(`[PropertyMap] Loaded ${pins.length} pins (clustering: ${clustering})`);
    prevActivePinRef.current = activePinId ?? null;
  }, [pins]);

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
        .marker-cluster-small,
        .marker-cluster-medium,
        .marker-cluster-large {
          background: transparent !important;
        }
        .marker-cluster-small div,
        .marker-cluster-medium div,
        .marker-cluster-large div {
          background: transparent !important;
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
