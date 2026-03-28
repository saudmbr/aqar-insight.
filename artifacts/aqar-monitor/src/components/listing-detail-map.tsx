import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { ExternalLink } from "lucide-react";

function makePinIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    iconAnchor: [16, 40],
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
        <div style="
          width:32px;height:32px;border-radius:50% 50% 50% 0;
          background:#0F7BA0;border:3px solid white;
          box-shadow:0 3px 16px rgba(15,123,160,0.5);
          transform:rotate(-45deg);
          display:flex;align-items:center;justify-content:center;
        ">
          <div style="width:10px;height:10px;border-radius:50%;background:white;transform:rotate(45deg);"></div>
        </div>
        <div style="width:2px;height:6px;background:#0F7BA0;margin-top:-1px;"></div>
      </div>
    `,
  });
}

type Props = {
  lat: number;
  lng: number;
  title: string;
  height?: number;
};

export default function ListingDetailMap({ lat, lng, title, height = 280 }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    (L.Icon.Default.prototype as any)._getIconUrl = undefined;
    L.Icon.Default.mergeOptions({ iconUrl: "", shadowUrl: "" });

    const map = L.map(mapRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: true,
      scrollWheelZoom: false,
      dragging: true,
      doubleClickZoom: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    L.marker([lat, lng], { icon: makePinIcon() })
      .addTo(map)
      .bindPopup(`<div dir="rtl" style="font-family:'Cairo',Arial,sans-serif;font-size:13px;font-weight:700;color:#0F1C3F;padding:4px 2px;">${title}</div>`, {
        closeButton: false,
        offset: [0, -36],
      })
      .openPopup();

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [lat, lng, title]);

  const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <div className="space-y-3">
      <div
        className="relative rounded-2xl overflow-hidden border border-border"
        style={{ height }}
      >
        <div ref={mapRef} style={{ height: "100%", width: "100%" }} className="z-0" />
      </div>
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
        فتح في خرائط جوجل
      </a>
    </div>
  );
}
