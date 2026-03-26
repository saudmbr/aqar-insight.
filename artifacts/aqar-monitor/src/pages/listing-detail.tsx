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
    <div className="flex items-center gap-2 text-sm text-foreground bg-primary/5 border border-primary/10 rounded-xl px-4 py-2 font-medium">
      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
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
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-3xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Skeleton className="h-32 rounded-2xl" /><Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" /><Skeleton className="h-32 rounded-2xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!listing) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 text-center bg-card rounded-3xl border border-border border-dashed max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
            <Building2 className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-foreground">الإعلان غير موجود</h2>
          <p className="text-muted-foreground mb-8">عذراً، لا يمكن العثور على هذا الإعلان. ربما تم حذفه أو أن الرابط غير صحيح.</p>
          <Button asChild size="lg" variant="outline" className="rounded-xl px-8 font-bold border-border">
            <Link href="/listings"><ArrowRight className="w-5 h-5 ml-2" />تصفح عقارات أخرى</Link>
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
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-card px-4 py-2 rounded-xl border border-border w-fit shadow-sm">
          <Link href="/listings" className="hover:text-primary transition-colors flex items-center gap-1"><Building2 className="w-4 h-4"/>العقارات</Link>
          <span>/</span>
          <span className="text-foreground truncate max-w-[200px] sm:max-w-md">{listing.title}</span>
        </div>

        {/* Header & Actions */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-4">
              <Badge variant="outline" className="px-3 py-1 text-sm font-semibold">{listing.propertyType}</Badge>
              <Badge className={`px-3 py-1 text-sm font-semibold border ${
                listing.listingType === "sale" ? "bg-primary text-white border-primary" :
                listing.listingType === "rent" ? "bg-accent text-white border-accent" :
                "bg-muted text-muted-foreground"
              }`}>
                {LISTING_TYPE_LABELS[listing.listingType] ?? listing.listingType}
              </Badge>
              {listing.verified && (
                <span className="text-sm font-bold flex items-center gap-1.5 text-primary bg-primary/10 px-3 py-1 rounded-full"><Verified className="w-4 h-4" />موثّق</span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight">{listing.title}</h1>
            <div className="flex items-center gap-2 text-lg text-muted-foreground font-medium mt-3">
              <MapPin className="w-5 h-5 text-primary shrink-0" />
              <span>{listing.city}{listing.district ? ` ، ${listing.district}` : ""}</span>
            </div>
          </div>
          
          <div className="flex gap-3 shrink-0">
            <Button
              variant="outline"
              size="icon"
              className={`rounded-xl w-12 h-12 shadow-sm border-border ${isFav ? "text-destructive border-destructive/30 bg-destructive/5" : "hover:bg-muted"}`}
              onClick={() => void toggleFav()}
              disabled={favLoading}
              title={isFav ? "إزالة من المفضلة" : "إضافة للمفضلة"}
            >
              <Heart className={`w-5 h-5 ${isFav ? "fill-current" : ""}`} />
            </Button>
            <Button variant="outline" size="icon" className="rounded-xl w-12 h-12 shadow-sm border-border hover:bg-muted" onClick={() => { void navigator.clipboard.writeText(window.location.href); }} title="نسخ الرابط">
              <Share2 className="w-5 h-5" />
            </Button>
            {isOwner && (
              <>
                <Button asChild variant="secondary" size="icon" className="rounded-xl w-12 h-12 shadow-sm" title="تعديل">
                  <Link href={`/listings/${listing.id}/edit`}><Edit className="w-5 h-5" /></Link>
                </Button>
                <Button variant="outline" size="icon" className="rounded-xl w-12 h-12 shadow-sm text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => void handleDelete()} disabled={deleting} title="حذف">
                  <Trash2 className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Images Gallery */}
        <div className="space-y-3">
          <div className="relative rounded-[2rem] overflow-hidden h-80 sm:h-[500px] bg-muted border border-border shadow-sm group">
            {images.length > 0 ? (
              <>
                <img src={images[currentImage]} alt={listing.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-secondary">
                <Building2 className="w-24 h-24 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground font-medium">لا توجد صور متاحة</p>
              </div>
            )}
            {listing.featured && (
              <div className="absolute top-6 right-6">
                <span className="text-sm font-bold px-4 py-2 rounded-full bg-yellow-400 text-yellow-900 border border-yellow-400 shadow-md flex items-center gap-2">
                  <Star className="w-4 h-4 fill-yellow-900" />إعلان مميز
                </span>
              </div>
            )}
          </div>
          
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {images.map((img, i) => (
                <button 
                  key={i} 
                  onClick={() => setCurrentImage(i)} 
                  className={`shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-[3px] transition-all duration-200 ${i === currentImage ? "border-primary shadow-md scale-105" : "border-transparent opacity-70 hover:opacity-100"}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Key Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {listing.areaSqm && (
                <StatBox icon={<Maximize2 className="w-6 h-6" />} label="المساحة" value={`${listing.areaSqm.toLocaleString("ar-SA")} م²`} />
              )}
              {listing.bedrooms != null && (
                <StatBox icon={<BedDouble className="w-6 h-6" />} label="غرف النوم" value={String(listing.bedrooms)} />
              )}
              {listing.bathrooms != null && (
                <StatBox icon={<Bath className="w-6 h-6" />} label="دورات المياه" value={String(listing.bathrooms)} />
              )}
              {listing.propertyAge != null && (
                <StatBox icon={<Calendar className="w-6 h-6" />} label="عمر العقار" value={`${listing.propertyAge} سنة`} />
              )}
              {listing.floorNumber != null && (
                <StatBox icon={<Building2 className="w-6 h-6" />} label="الطابق" value={`${listing.floorNumber} / ${listing.totalFloors ?? "?"}`} />
              )}
              {listing.furnishingStatus && (
                <StatBox icon={<CheckCircle2 className="w-6 h-6" />} label="التأثيث" value={listing.furnishingStatus} />
              )}
              {listing.facade && (
                <StatBox icon={<MapPin className="w-6 h-6" />} label="الواجهة" value={listing.facade} />
              )}
              {listing.streetWidth && (
                <StatBox icon={<Maximize2 className="w-6 h-6" />} label="عرض الشارع" value={`${listing.streetWidth} م`} />
              )}
            </div>

            {/* Description */}
            {listing.description && (
              <Card className="border-border rounded-3xl premium-shadow overflow-hidden">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-foreground mb-4">وصف العقار</h3>
                  <p className="text-muted-foreground text-lg leading-loose whitespace-pre-wrap">{listing.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Features */}
            {(listing.parking || listing.elevator || listing.garden || listing.roof || listing.pool ||
              listing.maidRoom || listing.driverRoom || listing.airConditioning || listing.electricityMeter ||
              listing.waterMeter || listing.kitchen) && (
              <Card className="border-border rounded-3xl premium-shadow overflow-hidden">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-foreground mb-5">المميزات والمرافق</h3>
                  <div className="flex flex-wrap gap-3">
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
            
            {/* Documents */}
            {(listing.deedStatus || listing.licenseStatus) && (
              <Card className="border-border rounded-3xl premium-shadow overflow-hidden">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-foreground mb-4">الوثائق والتراخيص</h3>
                  <div className="space-y-4">
                    {listing.deedStatus && (
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
                        <span className="text-muted-foreground font-medium">حالة الصك</span>
                        <span className="font-bold text-foreground">{listing.deedStatus}</span>
                      </div>
                    )}
                    {listing.licenseStatus && (
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
                        <span className="text-muted-foreground font-medium">حالة الترخيص</span>
                        <span className="font-bold text-foreground">{listing.licenseStatus}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6 lg:sticky lg:top-24">
            {/* Price & Contact Card */}
            <Card className="border-primary/20 bg-primary/5 rounded-3xl premium-shadow overflow-hidden">
              <CardContent className="p-8">
                <div className="mb-6">
                  <p className="text-muted-foreground font-medium mb-1">السعر المطلوب</p>
                  <p className="text-4xl font-extrabold text-primary">{formatCurrency(listing.price)}</p>
                  {listing.pricePerSqm && listing.areaSqm && (
                    <p className="text-sm font-semibold text-muted-foreground mt-2 bg-white/50 w-fit px-3 py-1 rounded-lg">المتر بـ {formatCurrency(listing.pricePerSqm)}</p>
                  )}
                </div>
                
                <div className="space-y-3">
                  {whatsappLink && (
                    <Button asChild size="lg" className="w-full gap-2 rounded-2xl h-14 bg-[#25D366] hover:bg-[#1ebe5b] text-white shadow-lg shadow-[#25D366]/20 font-bold text-base">
                      <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                        <MessageSquare className="w-5 h-5" />
                        تواصل عبر واتساب
                      </a>
                    </Button>
                  )}
                  {listing.contactPhone && (
                    <Button asChild variant="outline" size="lg" className="w-full gap-2 rounded-2xl h-14 font-bold text-base border-primary text-primary hover:bg-primary hover:text-white transition-all">
                      <a href={`tel:${listing.contactPhone}`}>
                        <Phone className="w-5 h-5" />
                        اتصال هاتفي
                      </a>
                    </Button>
                  )}
                </div>
                
                {listing.sellerName && (
                  <div className="mt-8 pt-6 border-t border-primary/10">
                    <p className="text-sm text-muted-foreground font-medium mb-2">المُعلن</p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-primary/20 text-primary font-bold text-xl shadow-sm">
                        {listing.sellerName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-lg">{listing.sellerName}</p>
                        {listing.verified && <span className="text-xs text-primary font-semibold">حساب موثق</span>}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Similar Listings */}
        {similar.length > 0 && (
          <div className="pt-8 border-t border-border mt-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">عقارات مشابهة قد تهمك</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
    <div className="flex flex-col items-center justify-center p-5 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
      <div className="text-primary mb-3 bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">{icon}</div>
      <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-bold text-foreground text-center" dir="ltr">{value}</p>
    </div>
  );
}
