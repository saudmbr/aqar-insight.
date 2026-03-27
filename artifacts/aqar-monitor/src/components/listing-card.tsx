import { Link } from "wouter";
import { MapPin, BedDouble, Bath, Maximize2, Verified, Star } from "lucide-react";
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

const LISTING_TYPE_COLORS: Record<string, string> = {
  sale: "bg-primary text-white border-primary",
  rent: "bg-accent text-white border-accent",
  daily_rent: "bg-orange-500 text-white border-orange-500",
  monthly_rent: "bg-teal-600 text-white border-teal-600",
  investment: "bg-purple-600 text-white border-purple-600",
  auction: "bg-destructive text-white border-destructive",
};

function getFirstImage(images?: string | null): string | null {
  if (!images) return null;
  const urls = images.split("\n").map(u => u.trim()).filter(Boolean);
  return getImageSrc(urls[0]) ?? null;
}

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const firstImage = getFirstImage(listing.images);
  const typeLabel = LISTING_TYPE_LABELS[listing.listingType] ?? listing.listingType;
  const typeColor = LISTING_TYPE_COLORS[listing.listingType] ?? "bg-muted text-muted-foreground border-border";

  return (
    <Link href={`/listings/${listing.id}`}>
      <div className="group bg-card border border-border rounded-[20px] overflow-hidden hover-premium-shadow cursor-pointer h-full flex flex-col relative">
        {/* Image Area */}
        <div className="relative h-56 bg-muted shrink-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 z-10 pointer-events-none" />
          {firstImage ? (
            <img
              src={firstImage}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary">
              <span className="text-5xl opacity-20">🏠</span>
            </div>
          )}
          
          {/* Top Badges */}
          <div className="absolute top-4 right-4 z-20 flex gap-2">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full border shadow-sm ${typeColor}`}>
              {typeLabel}
            </span>
            {listing.featured && (
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-yellow-400 text-yellow-900 border border-yellow-400 shadow-sm flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-yellow-900" />مميز
              </span>
            )}
          </div>
          
          {listing.verified && (
            <div className="absolute top-4 left-4 z-20">
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white text-primary border border-white shadow-sm flex items-center gap-1.5">
                <Verified className="w-3.5 h-3.5 fill-primary text-white" />موثّق
              </span>
            </div>
          )}

          {/* Bottom gradient info */}
          <div className="absolute bottom-4 right-4 left-4 z-20 flex justify-between items-end">
            <span className="text-xs font-semibold px-2.5 py-1 bg-white/20 backdrop-blur-md text-white rounded-lg border border-white/30">
              {listing.propertyType}
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-5 flex flex-col flex-1 bg-card">
          <h3 className="font-bold text-foreground text-base leading-snug line-clamp-2 mb-3 group-hover:text-primary transition-colors">
            {listing.title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium mb-4">
            <MapPin className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate">{listing.city}{listing.district ? ` ، ${listing.district}` : ""}</span>
          </div>

          {/* Features Row */}
          <div className="flex items-center gap-4 text-sm text-foreground font-semibold mb-5 pb-5 border-b border-border/60">
            {listing.areaSqm && (
              <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                <Maximize2 className="w-4 h-4 text-muted-foreground" />
                {listing.areaSqm.toLocaleString("ar-SA")} م²
              </span>
            )}
            {listing.bedrooms && (
              <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                <BedDouble className="w-4 h-4 text-muted-foreground" />
                {listing.bedrooms}
              </span>
            )}
            {listing.bathrooms && (
              <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                <Bath className="w-4 h-4 text-muted-foreground" />
                {listing.bathrooms}
              </span>
            )}
          </div>

          {/* Price */}
          <div className="mt-auto flex items-end justify-between">
            <div>
              <p className="text-2xl font-extrabold text-primary">{formatCurrency(listing.price)}</p>
              {listing.pricePerSqm && listing.areaSqm && (
                <p className="text-xs text-muted-foreground font-medium mt-1">المتر بـ {formatCurrency(listing.pricePerSqm)}</p>
              )}
            </div>
            {listing.furnishingStatus && (
              <span className="text-xs font-semibold px-2 py-1 bg-secondary text-secondary-foreground rounded-md">
                {listing.furnishingStatus}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}