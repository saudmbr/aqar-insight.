import { Link } from "wouter";
import { MapPin, BedDouble, Bath, Maximize2, Verified, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

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
  sale: "bg-blue-500/10 text-blue-600 border-blue-200",
  rent: "bg-green-500/10 text-green-600 border-green-200",
  daily_rent: "bg-orange-500/10 text-orange-600 border-orange-200",
  monthly_rent: "bg-teal-500/10 text-teal-600 border-teal-200",
  investment: "bg-purple-500/10 text-purple-600 border-purple-200",
  auction: "bg-red-500/10 text-red-600 border-red-200",
};

function getFirstImage(images?: string | null): string | null {
  if (!images) return null;
  const urls = images.split("\n").map(u => u.trim()).filter(Boolean);
  return urls[0] ?? null;
}

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const firstImage = getFirstImage(listing.images);
  const typeLabel = LISTING_TYPE_LABELS[listing.listingType] ?? listing.listingType;
  const typeColor = LISTING_TYPE_COLORS[listing.listingType] ?? "bg-muted text-muted-foreground";

  return (
    <Link href={`/listings/${listing.id}`}>
      <div className="group bg-card border border-border/50 rounded-2xl overflow-hidden hover:shadow-lg hover:border-border/80 transition-all duration-200 cursor-pointer h-full flex flex-col">
        {/* Image */}
        <div className="relative h-44 bg-muted/50 shrink-0">
          {firstImage ? (
            <img
              src={firstImage}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-4xl opacity-20">🏠</div>
            </div>
          )}
          {/* Badges */}
          <div className="absolute top-3 right-3 flex gap-1.5">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${typeColor}`}>
              {typeLabel}
            </span>
            {listing.featured && (
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-500/15 text-yellow-700 border border-yellow-300">
                <Star className="w-3 h-3 inline-block -mt-0.5 ml-0.5" />مميز
              </span>
            )}
          </div>
          {listing.verified && (
            <div className="absolute top-3 left-3">
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/15 text-primary border border-primary/30 flex items-center gap-1">
                <Verified className="w-3 h-3" /> موثّق
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <p className="text-xs text-muted-foreground mb-1">{listing.propertyType}</p>
          <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {listing.title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{listing.city}{listing.district ? ` · ${listing.district}` : ""}</span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            {listing.areaSqm && (
              <span className="flex items-center gap-1">
                <Maximize2 className="w-3.5 h-3.5" />
                {listing.areaSqm.toLocaleString("ar-SA")} م²
              </span>
            )}
            {listing.bedrooms && (
              <span className="flex items-center gap-1">
                <BedDouble className="w-3.5 h-3.5" />
                {listing.bedrooms}
              </span>
            )}
            {listing.bathrooms && (
              <span className="flex items-center gap-1">
                <Bath className="w-3.5 h-3.5" />
                {listing.bathrooms}
              </span>
            )}
            {listing.furnishingStatus && (
              <span className="px-1.5 py-0.5 bg-muted rounded text-[10px]">{listing.furnishingStatus}</span>
            )}
          </div>

          {/* Price */}
          <div className="mt-auto">
            <p className="text-lg font-bold text-foreground">{formatCurrency(listing.price)}</p>
            {listing.pricePerSqm && listing.areaSqm && (
              <p className="text-xs text-muted-foreground">{formatCurrency(listing.pricePerSqm)} / م²</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
