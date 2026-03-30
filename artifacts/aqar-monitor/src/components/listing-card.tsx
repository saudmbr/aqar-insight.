import { Link } from "wouter";
import { MapPin, BedDouble, Bath, Maximize2, Verified, Star, Building2, Pencil, Trash2, Eye, TrendingUp } from "lucide-react";
import { formatCurrency, getImageSrc } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ListingCardData {
  id: number;
  title: string;
  propertyType: string;
  listingType: string;
  city: string;
  district?: string | null;
  price: number;
  areaSqm?: number | null;
  pricePerSqm?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  images?: string | null;
  featured?: boolean | null;
  verified?: boolean | null;
  furnishingStatus?: string | null;
  createdAt?: string | Date | null;
  userId?: number | null;
  status?: string | null;
  views?: number | null;
}

const LISTING_TYPE_LABELS: Record<string, string> = {
  sale: "للبيع",
  rent: "للإيجار",
  monthly_rent: "إيجار شهري",
  investment: "استثماري",
  auction: "مزاد",
};

const LISTING_TYPE_COLORS: Record<string, { bg: string; glow: string }> = {
  sale:         { bg: "linear-gradient(135deg,#0F7BA0,#0a5f7d)", glow: "rgba(15,123,160,0.5)" },
  rent:         { bg: "linear-gradient(135deg,#059669,#047857)", glow: "rgba(5,150,105,0.5)" },
  monthly_rent: { bg: "linear-gradient(135deg,#0d9488,#0f766e)", glow: "rgba(13,148,136,0.5)" },
  investment:   { bg: "linear-gradient(135deg,#7c3aed,#6d28d9)", glow: "rgba(124,58,237,0.5)" },
  auction:      { bg: "linear-gradient(135deg,#e11d48,#be123c)",  glow: "rgba(225,29,72,0.5)" },
};

function getFirstImage(images?: string | null): string | null {
  if (!images) return null;
  const urls = images.split("\n").map(u => u.trim()).filter(Boolean);
  return getImageSrc(urls[0]) ?? null;
}

function ImagePlaceholder({ propertyType }: { propertyType: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(145deg, #0F1C3F 0%, #0B2545 50%, #0F2D5E 100%)" }}>
      {/* Decorative grid */}
      <div className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "linear-gradient(rgba(15,123,160,1) 1px, transparent 1px), linear-gradient(90deg, rgba(15,123,160,1) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      {/* Glowing orb */}
      <div className="absolute w-32 h-32 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #0F7BA0, transparent)", top: "20%", left: "50%", transform: "translateX(-50%)" }} />
      <Building2 className="w-14 h-14 relative z-10 mb-3" style={{ color: "rgba(15,123,160,0.6)", strokeWidth: 1.2 }} />
      <span className="text-xs font-bold relative z-10 tracking-wider" style={{ color: "rgba(148,163,184,0.6)" }}>
        {propertyType}
      </span>
    </div>
  );
}

interface ListingCardProps {
  listing: ListingCardData;
  canEdit?: boolean;
  onDelete?: (id: number) => void;
}

export function ListingCard({ listing, canEdit, onDelete }: ListingCardProps) {
  const firstImage = getFirstImage(listing.images);
  const typeLabel = LISTING_TYPE_LABELS[listing.listingType] ?? listing.listingType;
  const typeStyle = LISTING_TYPE_COLORS[listing.listingType] ?? { bg: "linear-gradient(135deg,#64748b,#475569)", glow: "rgba(100,116,139,0.4)" };

  return (
    <div
      className="group relative flex flex-col h-full"
      style={{
        borderRadius: "24px",
        background: "var(--card)",
        border: "1px solid rgba(148,163,184,0.12)",
        boxShadow: "0 4px 24px rgba(11,22,40,0.08), 0 1px 4px rgba(11,22,40,0.04)",
        transition: "box-shadow 0.4s cubic-bezier(.4,0,.2,1), transform 0.4s cubic-bezier(.4,0,.2,1), border-color 0.4s ease",
        overflow: "hidden",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 20px 60px rgba(11,22,40,0.16), 0 4px 16px rgba(11,22,40,0.08), 0 0 0 1px rgba(15,123,160,0.18)`;
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-6px)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(15,123,160,0.25)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 24px rgba(11,22,40,0.08), 0 1px 4px rgba(11,22,40,0.04)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(148,163,184,0.12)";
      }}
    >
      {/* Featured glow border */}
      {listing.featured && (
        <div className="absolute inset-0 pointer-events-none z-0 rounded-[24px]"
          style={{ boxShadow: "inset 0 0 0 1.5px rgba(234,179,8,0.45), 0 0 20px rgba(234,179,8,0.12)" }} />
      )}

      {/* Owner action buttons */}
      {canEdit && (
        <div className="absolute top-3.5 left-3.5 z-30 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
          <Button asChild size="icon"
            className="h-8 w-8 rounded-xl shadow-lg border border-white/30 backdrop-blur-md"
            style={{ background: "rgba(255,255,255,0.92)", color: "#0F7BA0" }}
            title="تعديل الإعلان"
            onClick={e => e.stopPropagation()}>
            <Link href={`/listings/${listing.id}/edit`}>
              <Pencil className="w-3.5 h-3.5" />
            </Link>
          </Button>
          <Button size="icon" variant="ghost"
            className="h-8 w-8 rounded-xl shadow-lg border border-white/30 backdrop-blur-md"
            style={{ background: "rgba(255,255,255,0.92)" }}
            title="حذف الإعلان"
            onClick={e => { e.stopPropagation(); e.preventDefault(); onDelete?.(listing.id); }}>
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
          </Button>
        </div>
      )}

      <Link href={`/listings/${listing.id}`} className="flex flex-col flex-1">
        {/* Image Area */}
        <div className="relative shrink-0 overflow-hidden" style={{ height: "220px" }}>
          {/* Multi-layer gradient overlay */}
          <div className="absolute inset-0 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to top, rgba(11,22,40,0.85) 0%, rgba(11,22,40,0.25) 40%, transparent 70%)" }} />

          {firstImage ? (
            <img
              src={firstImage}
              alt={listing.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
              style={{ transform: "scale(1)", transition: "transform 0.7s cubic-bezier(.4,0,.2,1)" }}
              onMouseEnter={e => { (e.target as HTMLImageElement).style.transform = "scale(1.07)"; }}
              onMouseLeave={e => { (e.target as HTMLImageElement).style.transform = "scale(1)"; }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <ImagePlaceholder propertyType={listing.propertyType} />
          )}

          {/* Type badge — top right */}
          <div className="absolute top-3.5 right-3.5 z-20 flex gap-1.5">
            <span className="text-[11.5px] font-black px-3 py-1.5 rounded-full text-white shadow-lg tracking-wide"
              style={{ background: typeStyle.bg, boxShadow: `0 4px 14px ${typeStyle.glow}` }}>
              {typeLabel}
            </span>
            {listing.featured && (
              <span className="text-[11px] font-black px-2.5 py-1.5 rounded-full flex items-center gap-1 shadow-lg"
                style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#fff", boxShadow: "0 4px 14px rgba(245,158,11,0.5)" }}>
                <Star className="w-3 h-3 fill-white" />
                مميز
              </span>
            )}
          </div>

          {/* Verified badge — top left */}
          {listing.verified && !canEdit && (
            <div className="absolute top-3.5 left-3.5 z-20">
              <span className="text-[11px] font-bold px-2.5 py-1.5 rounded-full flex items-center gap-1 shadow-lg backdrop-blur-md"
                style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff" }}>
                <Verified className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                موثّق
              </span>
            </div>
          )}

          {/* Property type + views — bottom bar */}
          <div className="absolute bottom-0 right-0 left-0 z-20 flex items-center justify-between px-4 pb-3">
            <span className="text-[11.5px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-md text-white"
              style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.18)" }}>
              {listing.propertyType}
            </span>
            {listing.views != null && listing.views > 0 && (
              <span className="text-[11px] font-medium flex items-center gap-1 text-white/70">
                <Eye className="w-3 h-3" />
                {listing.views.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1 gap-3">
          {/* Title */}
          <h3 className="font-bold text-foreground text-[15px] leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-200">
            {listing.title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground font-medium">
            <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "#0F7BA0" }} />
            <span className="truncate">{listing.city}{listing.district ? ` ، ${listing.district}` : ""}</span>
          </div>

          {/* Features chips */}
          {(listing.areaSqm || listing.bedrooms || listing.bathrooms) && (
            <div className="flex items-center gap-2 flex-wrap">
              {listing.areaSqm && (
                <span className="flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1 rounded-lg text-foreground"
                  style={{ background: "rgba(15,123,160,0.08)", border: "1px solid rgba(15,123,160,0.12)" }}>
                  <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />
                  {listing.areaSqm.toLocaleString("en-US")} م²
                </span>
              )}
              {listing.bedrooms && (
                <span className="flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1 rounded-lg text-foreground"
                  style={{ background: "rgba(15,123,160,0.08)", border: "1px solid rgba(15,123,160,0.12)" }}>
                  <BedDouble className="w-3.5 h-3.5 text-muted-foreground" />
                  {listing.bedrooms}
                </span>
              )}
              {listing.bathrooms && (
                <span className="flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1 rounded-lg text-foreground"
                  style={{ background: "rgba(15,123,160,0.08)", border: "1px solid rgba(15,123,160,0.12)" }}>
                  <Bath className="w-3.5 h-3.5 text-muted-foreground" />
                  {listing.bathrooms}
                </span>
              )}
            </div>
          )}

          {/* Separator */}
          <div style={{ height: "1px", background: "linear-gradient(to left, transparent, rgba(148,163,184,0.2), transparent)" }} />

          {/* Price row */}
          <div className="flex items-end justify-between gap-2 mt-auto">
            <div>
              <p className="text-[1.3rem] font-extrabold tracking-tight tabular-nums"
                style={{
                  background: "linear-gradient(135deg, #0F7BA0, #0a9fd8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  lineHeight: "1.35",
                  paddingBottom: "3px",
                  display: "block",
                }}>
                {formatCurrency(listing.price)}
              </p>
              {listing.pricePerSqm && listing.areaSqm && (
                <p className="text-[11.5px] text-muted-foreground font-medium mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  المتر: {formatCurrency(listing.pricePerSqm)}
                </p>
              )}
            </div>
            {listing.furnishingStatus && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg shrink-0"
                style={{ background: "rgba(15,123,160,0.08)", border: "1px solid rgba(15,123,160,0.15)", color: "#0F7BA0" }}>
                {listing.furnishingStatus}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
