import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { useAuth } from "@/contexts/auth-context";
import { formatCurrency } from "@/lib/utils";
import type { Listing } from "@workspace/db";
import {
  ArrowRight, MapPin, BedDouble, Bath, Maximize2, Phone, MessageSquare,
  Heart, Share2, Edit, Trash2, Building2, Calendar, CheckCircle2,
  Verified, Star,
} from "lucide-react";

interface ListingDetail extends Listing {
  sellerName?: string | null;
  sellerUsername?: string | null;
}

const LISTING_TYPE_LABELS: Record<string, string> = {
  sale: "للبيع", rent: "للإيجار", daily_rent: "إيجار يومي",
  monthly_rent: "إيجار شهري", investment: "استثماري", auction: "مزاد",
};

function FeatureChip({ label, active }: { label: string; active?: boolean | null }) {
  if (!active) return null;
  return (
    <div className="flex items-center gap-1.5 text-sm text-foreground bg-primary/8 border border-primary/20 rounded-lg px-3 py-1.5">
      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
      <span>{label}</span>
    </div>
  );
}

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [similar, setSimilar] = useState<ListingCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const listingId = parseInt(id ?? "");

  useEffect(() => {
    if (isNaN(listingId)) return;
    const load = async () => {
      setLoading(true);
      const [lRes, sRes] = await Promise.all([
        fetch(`/api/listings/${listingId}`, { credentials: "include" }),
        fetch(`/api/listings/${listingId}/similar`, { credentials: "include" }),
      ]);
      if (lRes.ok) setListing(await lRes.json() as ListingDetail);
      if (sRes.ok) setSimilar(await sRes.json() as ListingCardData[]);
      if (isAuthenticated) {
        const fRes = await fetch(`/api/favorites/${listingId}/status`, { credentials: "include" });
        if (fRes.ok) setIsFav(((await fRes.json()) as { isFavorite: boolean }).isFavorite);
      }
      setLoading(false);
    };
    void load();
  }, [listingId, isAuthenticated]);

  const toggleFav = async () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    setFavLoading(true);
    const res = await fetch(`/api/favorites/${listingId}/toggle`, { method: "POST", credentials: "include" });
    if (res.ok) setIsFav(((await res.json()) as { isFavorite: boolean }).isFavorite);
    setFavLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm("هل أنت متأكد من حذف هذا الإعلان؟")) return;
    setDeleting(true);
    const res = await fetch(`/api/listings/${listingId}`, { method: "DELETE", credentials: "include" });
    if (res.ok) navigate("/listings");
    else setDeleting(false);
  };

  const isOwner = listing && user && listing.userId === null ? false
    : listing && isAuthenticated && (user?.role === "admin" || String(listing.userId) === String(user?.username));

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-4 pb-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-72 w-full rounded-2xl" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-24 rounded-xl" /><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-24 rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!listing) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Building2 className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-bold mb-2">الإعلان غير موجود</h2>
          <Button asChild variant="outline" className="rounded-xl mt-4">
            <Link href="/listings"><ArrowRight className="w-4 h-4 ml-2" />العودة للقائمة</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const images = listing.images?.split("\n").map(u => u.trim()).filter(Boolean) ?? [];
  const whatsappLink = listing.whatsapp
    ? `https://wa.me/${listing.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`مرحباً، أود الاستفسار عن إعلانكم: ${listing.title}`)}`
    : null;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 pb-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/listings" className="hover:text-foreground transition-colors">العقارات</Link>
          <span>/</span>
          <span className="text-foreground truncate">{listing.title}</span>
        </div>

        {/* Images */}
        <div className="space-y-2">
          <div className="relative rounded-2xl overflow-hidden h-72 sm:h-96 bg-muted/50">
            {images.length > 0 ? (
              <img src={images[currentImage]} alt={listing.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="w-20 h-20 text-muted-foreground/30" />
              </div>
            )}
            {listing.featured && (
              <div className="absolute top-4 right-4">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-700 border border-yellow-300 flex items-center gap-1">
                  <Star className="w-3 h-3" />إعلان مميز
                </span>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button key={i} onClick={() => setCurrentImage(i)} className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${i === currentImage ? "border-primary" : "border-transparent"}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Title + Actions */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge variant="outline">{listing.propertyType}</Badge>
              <Badge className={`border ${
                listing.listingType === "sale" ? "bg-blue-500/10 text-blue-600 border-blue-200" :
                listing.listingType === "rent" ? "bg-green-500/10 text-green-600 border-green-200" :
                "bg-muted text-muted-foreground"
              }`}>
                {LISTING_TYPE_LABELS[listing.listingType] ?? listing.listingType}
              </Badge>
              {listing.verified && (
                <span className="text-xs flex items-center gap-1 text-primary"><Verified className="w-3.5 h-3.5" />موثّق</span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-foreground leading-tight">{listing.title}</h1>
            <div className="flex items-center gap-1.5 text-muted-foreground mt-2">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>{listing.city}{listing.district ? ` · ${listing.district}` : ""}</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon"
              className={`rounded-xl ${isFav ? "text-red-500 border-red-200 bg-red-50" : ""}`}
              onClick={() => void toggleFav()}
              disabled={favLoading}
            >
              <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
            </Button>
            <Button variant="outline" size="icon" className="rounded-xl" onClick={() => { void navigator.clipboard.writeText(window.location.href); }}>
              <Share2 className="w-4 h-4" />
            </Button>
            {isOwner && (
              <>
                <Button asChild variant="outline" size="icon" className="rounded-xl">
                  <Link href={`/listings/${listing.id}/edit`}><Edit className="w-4 h-4" /></Link>
                </Button>
                <Button variant="outline" size="icon" className="rounded-xl text-destructive border-destructive/30" onClick={() => void handleDelete()} disabled={deleting}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Price */}
        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-3xl font-extrabold text-foreground">{formatCurrency(listing.price)}</p>
                {listing.pricePerSqm && listing.areaSqm && (
                  <p className="text-sm text-muted-foreground mt-0.5">{formatCurrency(listing.pricePerSqm)} / م²</p>
                )}
              </div>
              <div className="flex gap-2">
                {whatsappLink && (
                  <Button asChild className="gap-2 rounded-xl bg-[#25D366] hover:bg-[#1ebe5b] text-white">
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                      <MessageSquare className="w-4 h-4" />
                      واتساب
                    </a>
                  </Button>
                )}
                {listing.contactPhone && (
                  <Button asChild variant="outline" className="gap-2 rounded-xl">
                    <a href={`tel:${listing.contactPhone}`}>
                      <Phone className="w-4 h-4" />
                      اتصال
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {listing.areaSqm && (
            <StatBox icon={<Maximize2 />} label="المساحة" value={`${listing.areaSqm.toLocaleString("ar-SA")} م²`} />
          )}
          {listing.bedrooms != null && (
            <StatBox icon={<BedDouble />} label="غرف النوم" value={String(listing.bedrooms)} />
          )}
          {listing.bathrooms != null && (
            <StatBox icon={<Bath />} label="دورات المياه" value={String(listing.bathrooms)} />
          )}
          {listing.propertyAge != null && (
            <StatBox icon={<Calendar />} label="عمر العقار" value={`${listing.propertyAge} سنة`} />
          )}
          {listing.floorNumber != null && (
            <StatBox icon={<Building2 />} label="الطابق" value={`${listing.floorNumber} / ${listing.totalFloors ?? "?"}`} />
          )}
          {listing.furnishingStatus && (
            <StatBox icon={<CheckCircle2 />} label="التأثيث" value={listing.furnishingStatus} />
          )}
          {listing.facade && (
            <StatBox icon={<MapPin />} label="الواجهة" value={listing.facade} />
          )}
          {listing.streetWidth && (
            <StatBox icon={<Maximize2 />} label="عرض الشارع" value={`${listing.streetWidth} م`} />
          )}
        </div>

        {/* Features */}
        {(listing.parking || listing.elevator || listing.garden || listing.roof || listing.pool ||
          listing.maidRoom || listing.driverRoom || listing.airConditioning || listing.electricityMeter ||
          listing.waterMeter || listing.kitchen) && (
          <Card className="border-border/60">
            <CardContent className="p-5">
              <h3 className="font-semibold text-foreground mb-3">المميزات</h3>
              <div className="flex flex-wrap gap-2">
                <FeatureChip label="موقف سيارات" active={listing.parking} />
                <FeatureChip label="مصعد" active={listing.elevator} />
                <FeatureChip label="حديقة" active={listing.garden} />
                <FeatureChip label="روف" active={listing.roof} />
                <FeatureChip label="مسبح" active={listing.pool} />
                <FeatureChip label="غرفة مربية" active={listing.maidRoom} />
                <FeatureChip label="غرفة سائق" active={listing.driverRoom} />
                <FeatureChip label="مطبخ" active={listing.kitchen} />
                <FeatureChip label="تكييف مركزي" active={listing.airConditioning} />
                <FeatureChip label="عداد كهرباء" active={listing.electricityMeter} />
                <FeatureChip label="عداد ماء" active={listing.waterMeter} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Description */}
        {listing.description && (
          <Card className="border-border/60">
            <CardContent className="p-5">
              <h3 className="font-semibold text-foreground mb-3">وصف العقار</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{listing.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Documents */}
        {(listing.deedStatus || listing.licenseStatus) && (
          <Card className="border-border/60">
            <CardContent className="p-5">
              <h3 className="font-semibold text-foreground mb-3">الوثائق والترخيص</h3>
              <div className="space-y-2 text-sm">
                {listing.deedStatus && <p><span className="text-muted-foreground">الصك: </span>{listing.deedStatus}</p>}
                {listing.licenseStatus && <p><span className="text-muted-foreground">الترخيص: </span>{listing.licenseStatus}</p>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Seller Info */}
        {listing.sellerName && (
          <Card className="border-border/60">
            <CardContent className="p-5">
              <h3 className="font-semibold text-foreground mb-3">المُعلن</h3>
              <p className="text-muted-foreground">{listing.sellerName}</p>
            </CardContent>
          </Card>
        )}

        {/* Similar */}
        {similar.length > 0 && (
          <div>
            <h3 className="font-semibold text-foreground mb-4">عقارات مشابهة</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {similar.map((s) => <ListingCard key={s.id} listing={s} />)}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/50 bg-muted/20 text-center">
      <div className="text-primary">{icon}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
