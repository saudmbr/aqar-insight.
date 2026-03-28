import { Link } from "wouter";
import { MapPin, BedDouble, Bath, Maximize2, Verified, Star, Building2 } from "lucide-react";
import { formatCurrency, getImageSrc } from "@/lib/utils";

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
}

const LISTING_TYPE_LABELS: Record<string, string> = {
  sale: "للبيع",
  rent: "للإيجار",
  daily_rent: "إيجار يومي",
  monthly_rent: "إيجار شهري",
  investment: "استثماري",
  auction: "مزاد",
};

const LISTING_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  sale:         { bg: "bg-primary",     text: "text-white" },
  rent:         { bg: "bg-accent",      text: "text-white" },
  daily_rent:   { bg: "bg-orange-500",  text: "text-white" },
  monthly_rent: { bg: "bg-teal-600",    text: "text-white" },
  investment:   { bg: "bg-purple-600",  text: "text-white" },
  auction:      { bg: "bg-rose-500",    text: "text-white" },
};

function getFirstImage(images?: string | null): string | null {
  if (!images) return null;
  const urls = images.split("\n").map(u => u.trim()).filter(Boolean);
  return getImageSrc(urls[0]) ?? null;
}

function ImagePlaceholder() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-secondary to-muted gap-3">
      <Building2 className="w-12 h-12 text-muted-foreground/25" strokeWidth={1.5} />
      <span className="text-xs text-muted-foreground/50 font-medium">لا توجد صورة</span>
    </div>
  );
}

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const firstImage = getFirstImage(listing.images);
  const typeLabel = LISTING_TYPE_LABELS[listing.listingType] ?? listing.listingType;
  const typeStyle = LISTING_TYPE_COLORS[listing.listingType] ?? { bg: "bg-muted", text: "text-muted-foreground" };

  return (
    <Link href={`/listings/${listing.id}`}>
      <div
        className="group bg-card rounded-[22px] overflow-hidden cursor-pointer h-full flex flex-col relative"
        style={{
          border: "1.5px solid var(--border)",
          boxShadow: "0 2px 16px rgba(15,28,63,0.06), 0 1px 4px rgba(15,28,63,0.03)",
          transition: "box-shadow 0.3s ease, transform 0.3s ease, border-color 0.3s ease",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 40px rgba(15,28,63,0.14), 0 3px 12px rgba(15,28,63,0.07)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(15,123,160,0.2)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 16px rgba(15,28,63,0.06), 0 1px 4px rgba(15,28,63,0.03)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
        }}
      >
        {/* Image Area */}
        <div className="relative h-56 shrink-0 overflow-hidden bg-muted">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent z-10 pointer-events-none" />

          {firstImage ? (
            <img
              src={firstImage}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <ImagePlaceholder />
          )}

          {/* Top Badges */}
          <div className="absolute top-3.5 right-3.5 z-20 flex gap-1.5">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full shadow-sm ${typeStyle.bg} ${typeStyle.text}`}>
              {typeLabel}
            </span>
            {listing.featured && (
              <span className="text-xs font-bold px-2.5 py-1.5 rounded-full bg-yellow-400 text-yellow-900 shadow-sm flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-900" />
                مميز
              </span>
            )}
          </div>

          {listing.verified && (
            <div className="absolute top-3.5 left-3.5 z-20">
              <span className="text-xs font-bold px-2.5 py-1.5 rounded-full bg-white/95 text-primary shadow-sm flex items-center gap-1">
                <Verified className="w-3.5 h-3.5 fill-primary text-white" />
                موثّق
              </span>
            </div>
          )}

          {/* Property type chip at bottom */}
          <div className="absolute bottom-3.5 right-3.5 z-20">
            <span className="text-xs font-semibold px-2.5 py-1 bg-black/30 backdrop-blur-md text-white rounded-lg border border-white/20">
              {listing.propertyType}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          <h3 className="font-bold text-foreground text-[15px] leading-snug line-clamp-2 mb-2.5 group-hover:text-primary transition-colors duration-200">
            {listing.title}
          </h3>

          <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground font-medium mb-4">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate">{listing.city}{listing.district ? ` ، ${listing.district}` : ""}</span>
          </div>

          {/* Features Row */}
          {(listing.areaSqm || listing.bedrooms || listing.bathrooms) && (
            <div className="flex items-center gap-2 flex-wrap text-[12.5px] text-foreground font-semibold mb-4 pb-4 border-b border-border/60">
              {listing.areaSqm && (
                <span className="flex items-center gap-1 bg-muted/70 px-2.5 py-1 rounded-lg">
                  <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />
                  {listing.areaSqm.toLocaleString("en-US")} م²
                </span>
              )}
              {listing.bedrooms && (
                <span className="flex items-center gap-1 bg-muted/70 px-2.5 py-1 rounded-lg">
                  <BedDouble className="w-3.5 h-3.5 text-muted-foreground" />
                  {listing.bedrooms}
                </span>
              )}
              {listing.bathrooms && (
                <span className="flex items-center gap-1 bg-muted/70 px-2.5 py-1 rounded-lg">
                  <Bath className="w-3.5 h-3.5 text-muted-foreground" />
                  {listing.bathrooms}
                </span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="mt-auto flex items-end justify-between gap-2">
            <div>
              <p className="text-[1.35rem] font-extrabold text-primary leading-none tracking-tight tabular-nums">
                {formatCurrency(listing.price)}
              </p>
              {listing.pricePerSqm && listing.areaSqm && (
                <p className="text-[11.5px] text-muted-foreground font-medium mt-1.5">
                  المتر: {formatCurrency(listing.pricePerSqm)}
                </p>
              )}
            </div>
            {listing.furnishingStatus && (
              <span className="text-[11.5px] font-semibold px-2.5 py-1 bg-secondary text-secondary-foreground rounded-lg shrink-0">
                {listing.furnishingStatus}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
