import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { useAuth } from "@/contexts/auth-context";
import { formatCurrency, getImageSrc } from "@/lib/utils";
import type { Listing } from "@workspace/db";
import {
  ArrowRight, MapPin, BedDouble, Bath, Maximize2, Phone, MessageSquare,
  Heart, Share2, Edit, Trash2, Building2, Calendar, CheckCircle2,
  Verified, Star, BadgeCheck, ChevronLeft, Wifi, Zap, TreePine, School,
  Hospital, ShoppingBag, Bus, Home, Video,
} from "lucide-react";

interface MarketerInfo {
  id: number;
  fullName: string | null;
  officeName: string | null;
  photo: string | null;
  phone: string | null;
  whatsapp: string | null;
  verified: boolean | null;
}

interface ListingDetail extends Listing {
  sellerName?: string | null;
  sellerUsername?: string | null;
  marketer?: MarketerInfo | null;
}

const LISTING_TYPE_LABELS: Record<string, string> = {
  sale: "للبيع", rent: "للإيجار", daily_rent: "إيجار يومي",
  monthly_rent: "إيجار شهري", investment: "استثماري", auction: "مزاد",
};

function FeatureChip({ label, active, icon }: { label: string; active?: boolean | null; icon?: React.ReactNode }) {
  if (!active) return null;
  return (
    <div className="flex items-center gap-2 text-sm text-foreground bg-primary/5 border border-primary/10 rounded-xl px-4 py-2 font-medium">
      {icon ?? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
      <span>{label}</span>
    </div>
  );
}

function NearbyChip({ label, active, icon }: { label: string; active?: boolean | null; icon: React.ReactNode }) {
  if (!active) return null;
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/60 border border-border/50 rounded-xl px-3 py-2 font-medium">
      <span className="text-primary shrink-0">{icon}</span>
      {label}
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

  const isOwner = listing && user
    ? (user.role === "admin" || String(listing.userId) === String(user.id))
    : false;

  if (loading) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-3xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
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
            <Building2 className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <h2 className="text-2xl font-bold mb-3">الإعلان غير موجود</h2>
          <p className="text-muted-foreground mb-8">عذراً، لا يمكن العثور على هذا الإعلان.</p>
          <Button asChild size="lg" variant="outline" className="rounded-xl px-8 font-bold">
            <Link href="/listings"><ArrowRight className="w-5 h-5 ml-2" />تصفح عقارات أخرى</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const images = listing.images?.split("\n").map(u => getImageSrc(u.trim())).filter((u): u is string => !!u) ?? [];
  const whatsappLink = listing.whatsapp
    ? `https://wa.me/${listing.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`مرحباً، أود الاستفسار عن إعلانكم: ${listing.title}`)}`
    : null;

  const hasAmenities = listing.parking || listing.elevator || listing.garden || listing.roof ||
    listing.pool || listing.maidRoom || listing.driverRoom || listing.airConditioning ||
    listing.electricityMeter || listing.waterMeter || listing.kitchen || listing.balcony ||
    listing.storageRoom || listing.basement || listing.smartHome || listing.securitySystem ||
    listing.internet || listing.sewage || listing.mortgageEligibility;

  const hasNearby = listing.nearbySchools || listing.nearbyHospitals || listing.nearbyMosques ||
    listing.nearbyMalls || listing.nearbyTransport || listing.nearbyParks || listing.nearbyMainRoads;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-card px-4 py-2 rounded-xl border border-border w-fit shadow-sm">
          <Link href="/listings" className="hover:text-primary transition-colors flex items-center gap-1">
            <Building2 className="w-4 h-4" />العقارات
          </Link>
          <ChevronLeft className="w-3.5 h-3.5" />
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
              {listing.listingPurpose && (
                <Badge variant="outline" className="px-3 py-1 text-sm">{listing.listingPurpose}</Badge>
              )}
              {listing.urgent && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">⚡ عاجل</span>
              )}
              {listing.exclusive && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">⭐ حصري</span>
              )}
              {listing.ownerDirect && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">🤝 مالك مباشر</span>
              )}
              {listing.verified && (
                <span className="text-sm font-bold flex items-center gap-1.5 text-primary bg-primary/10 px-3 py-1 rounded-full">
                  <Verified className="w-4 h-4" />موثّق
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight">{listing.title}</h1>
            <div className="flex items-center gap-2 text-lg text-muted-foreground font-medium mt-3">
              <MapPin className="w-5 h-5 text-primary shrink-0" />
              <span>
                {listing.city}
                {listing.district ? ` ، ${listing.district}` : ""}
                {listing.subDistrict ? ` ، ${listing.subDistrict}` : ""}
              </span>
            </div>
          </div>
          <div className="flex gap-3 shrink-0">
            <Button
              variant="outline" size="icon"
              className={`rounded-xl w-12 h-12 shadow-sm border-border ${isFav ? "text-destructive border-destructive/30 bg-destructive/5" : "hover:bg-muted"}`}
              onClick={() => void toggleFav()} disabled={favLoading}
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

        {/* Gallery */}
        <div className="space-y-3">
          <div className="relative rounded-[2rem] overflow-hidden h-80 sm:h-[500px] bg-muted border border-border shadow-sm group">
            {images.length > 0 ? (
              <>
                <img src={images[currentImage]} alt={listing.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                {images.length > 1 && (
                  <>
                    <button onClick={() => setCurrentImage(i => (i - 1 + images.length) % images.length)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 rounded-xl flex items-center justify-center text-white backdrop-blur transition-all">‹</button>
                    <button onClick={() => setCurrentImage(i => (i + 1) % images.length)} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 rounded-xl flex items-center justify-center text-white backdrop-blur transition-all">›</button>
                    <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white bg-black/40 backdrop-blur px-3 py-1 rounded-full font-mono">{currentImage + 1} / {images.length}</span>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-secondary">
                <Building2 className="w-24 h-24 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground font-medium">لا توجد صور متاحة</p>
              </div>
            )}
            {listing.featured && (
              <div className="absolute top-6 right-6">
                <span className="text-sm font-bold px-4 py-2 rounded-full bg-yellow-400 text-yellow-900 shadow-md flex items-center gap-2">
                  <Star className="w-4 h-4 fill-yellow-900" />إعلان مميز
                </span>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <button key={i} onClick={() => setCurrentImage(i)}
                  className={`shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-[3px] transition-all duration-200 ${i === currentImage ? "border-primary shadow-md scale-105" : "border-transparent opacity-70 hover:opacity-100"}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Video embed */}
        {listing.videoUrl && (
          <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <Video className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">فيديو العقار</p>
              <a href={listing.videoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate block" dir="ltr">{listing.videoUrl}</a>
            </div>
            <Button asChild size="sm" variant="outline" className="rounded-xl">
              <a href={listing.videoUrl} target="_blank" rel="noopener noreferrer">مشاهدة</a>
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Key stats */}
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
                <StatBox icon={<Home className="w-6 h-6" />} label="التأثيث" value={listing.furnishingStatus} />
              )}
              {listing.facade && (
                <StatBox icon={<MapPin className="w-6 h-6" />} label="الواجهة" value={listing.facade} />
              )}
              {listing.streetWidth && (
                <StatBox icon={<Maximize2 className="w-6 h-6" />} label="عرض الشارع" value={`${listing.streetWidth} م`} />
              )}
              {listing.kitchens && (
                <StatBox icon={<CheckCircle2 className="w-6 h-6" />} label="المطابخ" value={String(listing.kitchens)} />
              )}
              {listing.livingRooms && (
                <StatBox icon={<CheckCircle2 className="w-6 h-6" />} label="غرف الجلوس" value={String(listing.livingRooms)} />
              )}
            </div>

            {/* Extra specs */}
            {(listing.buildingQuality || listing.finishingType || listing.numberOfStreets || listing.listingPurpose || listing.negotiable) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {listing.buildingQuality && (
                  <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/40">
                    <span className="text-sm text-muted-foreground">جودة البناء</span>
                    <span className="text-sm font-bold">{listing.buildingQuality}</span>
                  </div>
                )}
                {listing.finishingType && (
                  <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/40">
                    <span className="text-sm text-muted-foreground">نوع التشطيب</span>
                    <span className="text-sm font-bold">{listing.finishingType}</span>
                  </div>
                )}
                {listing.numberOfStreets && (
                  <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/40">
                    <span className="text-sm text-muted-foreground">عدد الشوارع</span>
                    <span className="text-sm font-bold">{listing.numberOfStreets}</span>
                  </div>
                )}
                {listing.negotiable && (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
                    <span className="text-sm text-green-700">السعر</span>
                    <span className="text-sm font-bold text-green-700">قابل للتفاوض</span>
                  </div>
                )}
                {listing.mortgageEligibility && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <span className="text-sm text-blue-700">التمويل</span>
                    <span className="text-sm font-bold text-blue-700">مؤهل للتمويل العقاري</span>
                  </div>
                )}
                {listing.availabilityDate && (
                  <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/40">
                    <span className="text-sm text-muted-foreground">تاريخ الإتاحة</span>
                    <span className="text-sm font-bold">{listing.availabilityDate}</span>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {listing.description && (
              <Card className="border-border rounded-3xl overflow-hidden">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-foreground mb-4">وصف العقار</h3>
                  <p className="text-muted-foreground text-lg leading-loose whitespace-pre-wrap">{listing.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Amenities */}
            {hasAmenities && (
              <Card className="border-border rounded-3xl overflow-hidden">
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
                    <FeatureChip label="بلكونة" active={listing.balcony} />
                    <FeatureChip label="غرفة تخزين" active={listing.storageRoom} />
                    <FeatureChip label="قبو" active={listing.basement} />
                    <FeatureChip label="عداد كهرباء" active={listing.electricityMeter} />
                    <FeatureChip label="عداد ماء" active={listing.waterMeter} />
                    <FeatureChip label="صرف صحي" active={listing.sewage} />
                    <FeatureChip label="إنترنت ألياف" active={listing.internet} icon={<Wifi className="w-4 h-4 text-primary" />} />
                    <FeatureChip label="منزل ذكي" active={listing.smartHome} icon={<Zap className="w-4 h-4 text-primary" />} />
                    <FeatureChip label="نظام أمني" active={listing.securitySystem} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Nearby places */}
            {hasNearby && (
              <Card className="border-border rounded-3xl overflow-hidden">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-foreground mb-5">المرافق القريبة</h3>
                  <div className="flex flex-wrap gap-3">
                    <NearbyChip label="مدارس" active={listing.nearbySchools} icon={<School className="w-4 h-4" />} />
                    <NearbyChip label="مستشفيات" active={listing.nearbyHospitals} icon={<Hospital className="w-4 h-4" />} />
                    <NearbyChip label="مساجد" active={listing.nearbyMosques} icon={<CheckCircle2 className="w-4 h-4" />} />
                    <NearbyChip label="مراكز تجارية" active={listing.nearbyMalls} icon={<ShoppingBag className="w-4 h-4" />} />
                    <NearbyChip label="مواصلات" active={listing.nearbyTransport} icon={<Bus className="w-4 h-4" />} />
                    <NearbyChip label="حدائق" active={listing.nearbyParks} icon={<TreePine className="w-4 h-4" />} />
                    <NearbyChip label="طرق رئيسية" active={listing.nearbyMainRoads} icon={<MapPin className="w-4 h-4" />} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Documents */}
            {(listing.deedStatus || listing.licenseStatus || listing.referenceNumber) && (
              <Card className="border-border rounded-3xl overflow-hidden">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-foreground mb-4">الوثائق والتراخيص</h3>
                  <div className="space-y-3">
                    {listing.deedStatus && (
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
                        <span className="text-muted-foreground font-medium">حالة الصك</span>
                        <span className="font-bold text-foreground">{listing.deedStatus}</span>
                      </div>
                    )}
                    {listing.licenseStatus && (
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
                        <span className="text-muted-foreground font-medium">رخصة فال</span>
                        <span className="font-bold text-foreground font-mono">{listing.licenseStatus}</span>
                      </div>
                    )}
                    {listing.referenceNumber && (
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
                        <span className="text-muted-foreground font-medium">رقم المرجع</span>
                        <span className="font-bold text-foreground font-mono">{listing.referenceNumber}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Floor plan */}
            {listing.floorPlan && (
              <Card className="border-border rounded-3xl overflow-hidden">
                <CardContent className="p-5">
                  <h3 className="text-lg font-bold mb-3">المخطط الهندسي</h3>
                  <img src={getImageSrc(listing.floorPlan) ?? ""} alt="المخطط الهندسي" className="w-full rounded-2xl border border-border" />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar: price + contact + marketer */}
          <div className="space-y-6 lg:sticky lg:top-24">
            {/* Price + contact */}
            <Card className="border-primary/20 bg-primary/5 rounded-3xl overflow-hidden">
              <CardContent className="p-8">
                <div className="mb-6">
                  <p className="text-muted-foreground font-medium mb-1">السعر المطلوب</p>
                  <p className="text-4xl font-extrabold text-primary">{formatCurrency(listing.price)}</p>
                  {listing.pricePerSqm && listing.areaSqm && (
                    <p className="text-sm font-semibold text-muted-foreground mt-2 bg-white/50 w-fit px-3 py-1 rounded-lg">
                      المتر بـ {formatCurrency(listing.pricePerSqm)}
                    </p>
                  )}
                  {listing.negotiable && (
                    <p className="text-xs text-green-700 font-bold mt-2 bg-green-100 w-fit px-2 py-1 rounded-lg">قابل للتفاوض</p>
                  )}
                </div>
                <div className="space-y-3">
                  {whatsappLink && (
                    <Button asChild size="lg" className="w-full gap-2 rounded-2xl h-14 bg-[#25D366] hover:bg-[#1ebe5b] text-white font-bold text-base">
                      <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                        <MessageSquare className="w-5 h-5" />تواصل عبر واتساب
                      </a>
                    </Button>
                  )}
                  {listing.contactPhone && (
                    <Button asChild variant="outline" size="lg" className="w-full gap-2 rounded-2xl h-14 font-bold text-base border-primary text-primary hover:bg-primary hover:text-white">
                      <a href={`tel:${listing.contactPhone}`}>
                        <Phone className="w-5 h-5" />اتصال هاتفي
                      </a>
                    </Button>
                  )}
                </div>

                {/* Seller / Views */}
                {listing.sellerName && (
                  <div className="mt-6 pt-5 border-t border-primary/10">
                    <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">المُعلن</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-primary/20 text-primary font-bold text-lg shadow-sm">
                        {listing.sellerName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{listing.sellerName}</p>
                        {listing.verified && <span className="text-xs text-primary font-semibold flex items-center gap-1"><Verified className="w-3 h-3" />حساب موثق</span>}
                      </div>
                    </div>
                  </div>
                )}

                {listing.views != null && (
                  <p className="text-xs text-muted-foreground mt-4 text-center">{listing.views.toLocaleString("ar-SA")} مشاهدة</p>
                )}
              </CardContent>
            </Card>

            {/* Marketer card */}
            {listing.marketer && (
              <Card className="border-border rounded-3xl overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-4 h-4 text-accent" />
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">المسوّق العقاري</p>
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden border border-border shrink-0">
                      {listing.marketer.photo ? (
                        <img src={listing.marketer.photo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-primary">{(listing.marketer.fullName ?? "م").charAt(0)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-foreground truncate">{listing.marketer.fullName}</p>
                        {listing.marketer.verified && (
                          <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
                        )}
                      </div>
                      {listing.marketer.officeName && (
                        <p className="text-xs text-muted-foreground truncate">{listing.marketer.officeName}</p>
                      )}
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm" className="w-full rounded-xl gap-2 font-semibold">
                    <Link href={`/marketers/${listing.marketer.id}`}>
                      عرض ملف المسوّق<ChevronLeft className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Similar listings */}
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
