import { useState, useEffect, lazy, Suspense } from "react";
import { useParams, Link, useLocation } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { useAuth } from "@/contexts/auth-context";
import { formatCurrency, getImageSrc } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Listing } from "@workspace/db";
import {
  ArrowRight, MapPin, BedDouble, Bath, Maximize2, Phone, MessageSquare,
  Heart, Share2, Edit, Trash2, Building2, Calendar, CheckCircle2,
  Verified, Star, BadgeCheck, ChevronLeft, Wifi, Zap, TreePine, School,
  Hospital, ShoppingBag, Bus, Home, Video, Archive, CheckCircle, Ban,
  Camera, Navigation2, TrendingUp, BarChart3, CarFront, Layers, Shield,
  ChevronRight, Sparkles, UserCheck, Eye, ArrowUpRight,
} from "lucide-react";

const ListingDetailMap = lazy(() => import("@/components/listing-detail-map"));

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
  sale: "للبيع", rent: "للإيجار",
  monthly_rent: "إيجار شهري", investment: "استثماري", auction: "مزاد",
};

const LISTING_TYPE_STYLE: Record<string, string> = {
  sale:         "bg-primary text-white",
  rent:         "bg-[#0F7BA0] text-white",
  monthly_rent: "bg-purple-600 text-white",
  investment:   "bg-emerald-600 text-white",
  auction:      "bg-red-600 text-white",
};

const STATUS_STYLE: Record<string, { label: string; style: string }> = {
  active:    { label: "نشط",   style: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  sold:      { label: "مُباع", style: "bg-red-100 text-red-800 border-red-200" },
  rented:    { label: "مُؤجّر",style: "bg-purple-100 text-purple-800 border-purple-200" },
  cancelled: { label: "مؤرشف",style: "bg-gray-100 text-gray-700 border-gray-200" },
  reserved:  { label: "محجوز",style: "bg-yellow-100 text-yellow-800 border-yellow-200" },
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function FactRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-muted/40 border border-border/50 hover:bg-muted/70 transition-colors">
      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-sm font-bold text-foreground truncate" dir="ltr">{value}</p>
      </div>
    </div>
  );
}

function AmenityBadge({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 bg-primary/6 border border-primary/15 text-foreground rounded-xl px-3.5 py-2.5 text-sm font-medium">
      <span className="text-primary">{icon ?? <CheckCircle2 className="w-3.5 h-3.5" />}</span>
      {label}
    </div>
  );
}

function NearbyBadge({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 bg-muted/50 border border-border/50 text-muted-foreground rounded-xl px-3.5 py-2.5 text-sm font-medium">
      <span className="text-primary">{icon}</span>
      {label}
    </div>
  );
}

function SectionTitle({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      {icon && <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">{icon}</div>}
      <h2 className="text-xl font-extrabold text-foreground">{children}</h2>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [similar, setSimilar] = useState<ListingCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const listingId = parseInt(id ?? "");

  useEffect(() => {
    return () => { document.title = "عقار إنسايت"; };
  }, []);

  useEffect(() => {
    if (listing?.title) {
      document.title = `${listing.title} – عقار إنسايت`;
    }
  }, [listing?.title]);

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
    setConfirmDelete(false);
    setDeleting(true);
    const res = await fetch(`/api/listings/${listingId}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      toast({ title: "تم حذف الإعلان بنجاح" });
      navigate("/listings");
    } else {
      setDeleting(false);
      toast({ title: "فشل الحذف", description: "حدث خطأ أثناء الحذف", variant: "destructive" });
    }
  };

  const handleChangeStatus = async (status: string) => {
    if (!listing) return;
    setStatusLoading(true);
    const res = await fetch(`/api/listings/${listingId}/status`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setListing(prev => prev ? { ...prev, status } : prev);
      const labels: Record<string, string> = { sold: "مُباع", rented: "مُؤجّر", cancelled: "مؤرشف", active: "نشط" };
      toast({ title: "تم تحديث الحالة", description: `الحالة الجديدة: ${labels[status] ?? status}` });
    } else {
      toast({ title: "فشل التحديث", variant: "destructive" });
    }
    setStatusLoading(false);
  };

  const handleShare = () => {
    void navigator.clipboard.writeText(window.location.href);
    toast({ title: "تم نسخ رابط الإعلان" });
  };

  const isOwner = listing && user
    ? (user.role === "admin" || String(listing.userId) === String(user.id))
    : false;

  // ─── Loading skeleton ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
          <Skeleton className="h-9 w-72 rounded-xl" />
          <div className="grid grid-cols-3 gap-3 h-[440px]">
            <Skeleton className="col-span-2 rounded-3xl" />
            <div className="space-y-3">
              <Skeleton className="h-[213px] rounded-3xl" />
              <Skeleton className="h-[213px] rounded-3xl" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
            <div className="space-y-5">
              <Skeleton className="h-40 rounded-3xl" />
              <Skeleton className="h-32 rounded-3xl" />
              <Skeleton className="h-48 rounded-3xl" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-72 rounded-3xl" />
              <Skeleton className="h-40 rounded-3xl" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!listing) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-28 text-center bg-card rounded-3xl border border-dashed border-border max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl border border-primary/15 flex items-center justify-center mb-6">
            <Building2 className="w-10 h-10 text-primary/40" />
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
    listing.internet || listing.sewage || listing.mortgageEligibility ||
    listing.majlis || listing.prayerRoom || listing.wardrobeRoom || listing.gym ||
    listing.jacuzzi || listing.annex || listing.heating || listing.solarHeater ||
    listing.waterTank || listing.generator || listing.solarEnergy || listing.naturalGas ||
    listing.waterFilter;

  const hasNearby = listing.nearbySchools || listing.nearbyHospitals || listing.nearbyMosques ||
    listing.nearbyMalls || listing.nearbyTransport || listing.nearbyParks || listing.nearbyMainRoads ||
    listing.nearbyPharmacies || listing.nearbyBanks || listing.nearbyRestaurants ||
    listing.nearbyNurseries || listing.nearbySports || listing.nearbyGasStation || listing.nearbyUniversities;

  const listingTypeBg = LISTING_TYPE_STYLE[listing.listingType] ?? "bg-muted text-muted-foreground";
  const statusMeta = STATUS_STYLE[listing.status] ?? { label: listing.status, style: "bg-gray-100 text-gray-700 border-gray-200" };

  const [img1, img2, img3, ...restImgs] = images;
  const extraCount = images.length > 3 ? images.length - 3 : 0;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-0 pb-16">

        {/* ─── Breadcrumb ────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground py-4">
          <Link href="/" className="hover:text-primary transition-colors">الرئيسية</Link>
          <ChevronLeft className="w-3.5 h-3.5" />
          <Link href="/listings" className="hover:text-primary transition-colors flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" />العقارات
          </Link>
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="text-foreground font-semibold truncate max-w-[200px] sm:max-w-lg">{listing.title}</span>
        </div>

        {/* ─── GALLERY HERO ──────────────────────────────────────────── */}
        <div className="relative mb-4">
          {images.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 h-[300px] sm:h-[440px] rounded-3xl overflow-hidden">
              {/* Main image — 2/3 width */}
              <button
                className="col-span-2 relative overflow-hidden group bg-muted"
                onClick={() => { setCurrentImage(0); setGalleryOpen(true); }}
              >
                <img
                  src={img1}
                  alt={listing.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                {listing.featured && (
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-[#94A3B8] text-white shadow-md">
                      <Star className="w-3.5 h-3.5 fill-white" />إعلان مميز
                    </span>
                  </div>
                )}
              </button>

              {/* Supporting images — 1/3 width, stacked */}
              <div className="flex flex-col gap-2">
                {img2 ? (
                  <button
                    className="flex-1 relative overflow-hidden group bg-muted"
                    onClick={() => { setCurrentImage(1); setGalleryOpen(true); }}
                  >
                    <img src={img2} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </button>
                ) : (
                  <div className="flex-1 bg-muted/60 flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}
                <button
                  className="flex-1 relative overflow-hidden group bg-muted"
                  onClick={() => { setCurrentImage(img3 ? 2 : 1); setGalleryOpen(true); }}
                >
                  {img3 ? (
                    <>
                      <img src={img3} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      {extraCount > 0 && (
                        <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                          <span className="text-white font-extrabold text-xl">+{extraCount}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full bg-muted/60 flex items-center justify-center">
                      <Camera className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl h-[300px] sm:h-[440px] bg-gradient-to-br from-secondary/80 to-muted/50 border border-border flex flex-col items-center justify-center">
              <div className="w-24 h-24 bg-primary/10 rounded-2xl border border-primary/15 flex items-center justify-center mb-4">
                <Building2 className="w-12 h-12 text-primary/40" />
              </div>
              <p className="text-muted-foreground font-medium">لا توجد صور متاحة</p>
            </div>
          )}
        </div>

        {/* ─── Media action bar ──────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8 pb-4 border-b border-border">
          <div className="flex items-center gap-2 flex-wrap">
            {images.length > 0 && (
              <button
                onClick={() => { setCurrentImage(0); setGalleryOpen(true); }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-sm font-semibold hover:border-primary/40 hover:bg-muted transition-all"
              >
                <Camera className="w-4 h-4 text-primary" />
                عرض الصور
                <span className="text-xs text-muted-foreground">({images.length})</span>
              </button>
            )}
            {listing.videoUrl && (
              <a
                href={listing.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-sm font-semibold hover:border-primary/40 hover:bg-muted transition-all"
              >
                <Video className="w-4 h-4 text-red-500" />فيديو
              </a>
            )}
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/60 border border-dashed border-border text-sm font-medium text-muted-foreground cursor-not-allowed opacity-60">
              <Navigation2 className="w-4 h-4" />جولة افتراضية
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-sm font-semibold hover:border-primary/40 hover:bg-muted transition-all"
            >
              <Share2 className="w-4 h-4 text-muted-foreground" />مشاركة
            </button>
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-xl gap-1.5 font-semibold ${isFav ? "text-destructive bg-destructive/5 hover:bg-destructive/10" : "text-muted-foreground hover:text-destructive"}`}
              onClick={() => void toggleFav()}
              disabled={favLoading}
            >
              <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
              {isFav ? "محفوظ" : "حفظ"}
            </Button>
            {isOwner && (
              <>
                <Button asChild variant="outline" size="sm" className="rounded-xl gap-1.5 font-semibold border-primary/30 text-primary hover:bg-primary/5">
                  <Link href={`/listings/${listing.id}/edit`}><Edit className="w-4 h-4" />تعديل</Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl gap-1.5 text-destructive hover:bg-destructive/10 font-semibold"
                  onClick={() => setConfirmDelete(true)}
                  disabled={deleting}
                >
                  <Trash2 className="w-4 h-4" />حذف
                </Button>
              </>
            )}
          </div>
        </div>

        {/* ─── BODY: 2-col layout ────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">

          {/* ─── LEFT: Main content ────────────────────────────────── */}
          <div className="space-y-8 min-w-0">

            {/* Property Summary */}
            <div className="bg-card rounded-3xl border border-border p-7 shadow-sm">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={`inline-flex items-center px-3.5 py-1.5 rounded-xl text-sm font-bold ${listingTypeBg}`}>
                  {LISTING_TYPE_LABELS[listing.listingType] ?? listing.listingType}
                </span>
                <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold border ${statusMeta.style}`}>
                  {statusMeta.label}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-muted border border-border text-muted-foreground">
                  <Building2 className="w-3.5 h-3.5" />
                  {listing.propertyType}
                </span>
                {listing.urgent && <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-red-100 text-red-700 border border-red-200">⚡ عاجل</span>}
                {listing.exclusive && <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-100 text-amber-700 border border-amber-200">⭐ حصري</span>}
                {listing.ownerDirect && <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-green-100 text-green-700 border border-green-200">🤝 من المالك مباشرة</span>}
                {listing.virtualTour && <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-100 text-purple-700 border border-purple-200">🥽 جولة افتراضية VR</span>}
                {listing.verified && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <Verified className="w-3.5 h-3.5" />موثّق
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground leading-snug mb-3">{listing.title}</h1>

              {/* Location */}
              <div className="flex items-center gap-2 text-base text-muted-foreground font-medium mb-6">
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <span>
                  {listing.city}
                  {listing.district ? ` ، حي ${listing.district}` : ""}
                  {listing.subDistrict ? ` ، ${listing.subDistrict}` : ""}
                </span>
              </div>

              {/* Price */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-border">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">السعر المطلوب</p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl md:text-5xl font-extrabold text-primary leading-none">{formatCurrency(listing.price)}</span>
                    {listing.pricePerSqm && listing.areaSqm && (
                      <span className="text-sm font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-lg border border-border">
                        {formatCurrency(listing.pricePerSqm)} / م²
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {listing.negotiable && (
                      <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg">قابل للتفاوض</span>
                    )}
                    {listing.mortgageEligibility && (
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">مؤهل للتمويل</span>
                    )}
                  </div>
                </div>
                {listing.createdAt && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    نُشر {new Date(listing.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}
                    {listing.views != null && (
                      <span className="mr-3 flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {listing.views.toLocaleString("en-US")} مشاهدة
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Quick stats strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6">
                {listing.areaSqm && (
                  <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-muted/50 border border-border/50 text-center">
                    <Maximize2 className="w-5 h-5 text-primary" />
                    <span className="text-lg font-extrabold text-foreground leading-none">{listing.areaSqm.toLocaleString("en-US")}</span>
                    <span className="text-[11px] text-muted-foreground font-medium">المساحة م²</span>
                  </div>
                )}
                {listing.bedrooms != null && (
                  <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-muted/50 border border-border/50 text-center">
                    <BedDouble className="w-5 h-5 text-primary" />
                    <span className="text-lg font-extrabold text-foreground leading-none">{listing.bedrooms}</span>
                    <span className="text-[11px] text-muted-foreground font-medium">غرف النوم</span>
                  </div>
                )}
                {listing.bathrooms != null && (
                  <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-muted/50 border border-border/50 text-center">
                    <Bath className="w-5 h-5 text-primary" />
                    <span className="text-lg font-extrabold text-foreground leading-none">{listing.bathrooms}</span>
                    <span className="text-[11px] text-muted-foreground font-medium">دورات المياه</span>
                  </div>
                )}
                {listing.propertyAge != null ? (
                  <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-muted/50 border border-border/50 text-center">
                    <Calendar className="w-5 h-5 text-primary" />
                    <span className="text-lg font-extrabold text-foreground leading-none">{listing.propertyAge}</span>
                    <span className="text-[11px] text-muted-foreground font-medium">عمر العقار (سنة)</span>
                  </div>
                ) : listing.floorNumber != null ? (
                  <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-muted/50 border border-border/50 text-center">
                    <Layers className="w-5 h-5 text-primary" />
                    <span className="text-lg font-extrabold text-foreground leading-none">{listing.floorNumber}{listing.totalFloors ? `/${listing.totalFloors}` : ""}</span>
                    <span className="text-[11px] text-muted-foreground font-medium">الطابق</span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Description — نبذة عن العقار */}
            {listing.description && (
              <div className="bg-card rounded-3xl border border-border p-7 shadow-sm">
                <SectionTitle icon={<Home className="w-4.5 h-4.5" />}>نبذة عن العقار</SectionTitle>
                <p className="text-base text-foreground/85 leading-[2] whitespace-pre-wrap font-normal">{listing.description}</p>
              </div>
            )}

            {/* Property facts — مواصفات تفصيلية */}
            {(listing.furnishingStatus || listing.facade || listing.streetWidth || listing.kitchens ||
              listing.livingRooms || listing.floorNumber || listing.totalFloors || listing.buildingQuality ||
              listing.finishingType || listing.numberOfStreets || listing.availabilityDate) && (
              <div className="bg-card rounded-3xl border border-border p-7 shadow-sm">
                <SectionTitle icon={<BarChart3 className="w-4.5 h-4.5" />}>مواصفات العقار</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {listing.furnishingStatus && <FactRow icon={<Home className="w-4 h-4" />} label="التأثيث" value={listing.furnishingStatus} />}
                  {listing.facade && <FactRow icon={<ChevronRight className="w-4 h-4" />} label="الواجهة" value={listing.facade} />}
                  {listing.streetWidth && <FactRow icon={<Maximize2 className="w-4 h-4" />} label="عرض الشارع" value={`${listing.streetWidth} م`} />}
                  {listing.kitchens && <FactRow icon={<CheckCircle2 className="w-4 h-4" />} label="المطابخ" value={String(listing.kitchens)} />}
                  {listing.livingRooms && <FactRow icon={<CheckCircle2 className="w-4 h-4" />} label="غرف الجلوس" value={String(listing.livingRooms)} />}
                  {listing.floorNumber != null && <FactRow icon={<Layers className="w-4 h-4" />} label="رقم الطابق" value={String(listing.floorNumber)} />}
                  {listing.totalFloors != null && <FactRow icon={<Building2 className="w-4 h-4" />} label="إجمالي الطوابق" value={String(listing.totalFloors)} />}
                  {listing.buildingQuality && <FactRow icon={<Sparkles className="w-4 h-4" />} label="جودة البناء" value={listing.buildingQuality} />}
                  {listing.finishingType && <FactRow icon={<Sparkles className="w-4 h-4" />} label="نوع التشطيب" value={listing.finishingType} />}
                  {listing.numberOfStreets && <FactRow icon={<MapPin className="w-4 h-4" />} label="عدد الشوارع" value={String(listing.numberOfStreets)} />}
                  {listing.availabilityDate && <FactRow icon={<Calendar className="w-4 h-4" />} label="تاريخ الإتاحة" value={listing.availabilityDate} />}
                  {listing.listingPurpose && <FactRow icon={<Building2 className="w-4 h-4" />} label="الغرض" value={listing.listingPurpose} />}
                </div>
              </div>
            )}

            {/* Amenities — المميزات والمرافق */}
            {hasAmenities && (
              <div className="bg-card rounded-3xl border border-border p-7 shadow-sm">
                <SectionTitle icon={<CheckCircle2 className="w-4.5 h-4.5" />}>المميزات والمرافق</SectionTitle>
                <div className="flex flex-wrap gap-2.5">
                  {listing.parking && <AmenityBadge label="موقف سيارات" icon={<CarFront className="w-3.5 h-3.5" />} />}
                  {listing.elevator && <AmenityBadge label="مصعد" icon={<Layers className="w-3.5 h-3.5" />} />}
                  {listing.garden && <AmenityBadge label="حديقة" icon={<TreePine className="w-3.5 h-3.5" />} />}
                  {listing.roof && <AmenityBadge label="روف" />}
                  {listing.pool && <AmenityBadge label="مسبح" />}
                  {listing.majlis && <AmenityBadge label="مجلس / استقبال" />}
                  {listing.maidRoom && <AmenityBadge label="غرفة مربية" />}
                  {listing.driverRoom && <AmenityBadge label="غرفة سائق" />}
                  {listing.kitchen && <AmenityBadge label="مطبخ" />}
                  {listing.airConditioning && <AmenityBadge label="تكييف مركزي" />}
                  {listing.heating && <AmenityBadge label="تدفئة مركزية" />}
                  {listing.balcony && <AmenityBadge label="بلكونة / شرفة" />}
                  {listing.storageRoom && <AmenityBadge label="غرفة تخزين" />}
                  {listing.basement && <AmenityBadge label="قبو / بدروم" />}
                  {listing.annex && <AmenityBadge label="ملحق خارجي" />}
                  {listing.wardrobeRoom && <AmenityBadge label="غرفة ملابس" />}
                  {listing.prayerRoom && <AmenityBadge label="غرفة صلاة / مصلى" />}
                  {listing.gym && <AmenityBadge label="صالة رياضية / جيم" />}
                  {listing.jacuzzi && <AmenityBadge label="جاكوزي / بانيو" />}
                  {listing.solarHeater && <AmenityBadge label="سخان شمسي" />}
                  {listing.electricityMeter && <AmenityBadge label="عداد كهرباء" icon={<Zap className="w-3.5 h-3.5" />} />}
                  {listing.waterMeter && <AmenityBadge label="عداد ماء" />}
                  {listing.sewage && <AmenityBadge label="صرف صحي" />}
                  {listing.internet && <AmenityBadge label="إنترنت / ألياف بصري" icon={<Wifi className="w-3.5 h-3.5" />} />}
                  {listing.naturalGas && <AmenityBadge label="غاز طبيعي" />}
                  {listing.waterTank && <AmenityBadge label="خزان مياه" />}
                  {listing.waterFilter && <AmenityBadge label="فلتر / تحلية مياه" />}
                  {listing.generator && <AmenityBadge label="مولد كهرباء" icon={<Zap className="w-3.5 h-3.5" />} />}
                  {listing.solarEnergy && <AmenityBadge label="طاقة شمسية" />}
                  {listing.smartHome && <AmenityBadge label="منزل ذكي" icon={<Zap className="w-3.5 h-3.5" />} />}
                  {listing.securitySystem && <AmenityBadge label="كاميرات مراقبة / أمن" icon={<Shield className="w-3.5 h-3.5" />} />}
                  {listing.mortgageEligibility && <AmenityBadge label="مؤهل للتمويل العقاري" icon={<Shield className="w-3.5 h-3.5" />} />}
                </div>
              </div>
            )}

            {/* Nearby — المرافق القريبة */}
            {hasNearby && (
              <div className="bg-card rounded-3xl border border-border p-7 shadow-sm">
                <SectionTitle icon={<MapPin className="w-4.5 h-4.5" />}>المرافق القريبة</SectionTitle>
                <div className="flex flex-wrap gap-2.5">
                  {listing.nearbySchools      && <NearbyBadge label="مدارس" icon={<School className="w-3.5 h-3.5" />} />}
                  {listing.nearbyUniversities && <NearbyBadge label="جامعات / كليات" icon={<School className="w-3.5 h-3.5" />} />}
                  {listing.nearbyNurseries   && <NearbyBadge label="حضانات / رياض أطفال" icon={<School className="w-3.5 h-3.5" />} />}
                  {listing.nearbyHospitals   && <NearbyBadge label="مستشفيات / مراكز صحية" icon={<Hospital className="w-3.5 h-3.5" />} />}
                  {listing.nearbyPharmacies  && <NearbyBadge label="صيدليات" icon={<Hospital className="w-3.5 h-3.5" />} />}
                  {listing.nearbyMosques     && <NearbyBadge label="مساجد" icon={<CheckCircle2 className="w-3.5 h-3.5" />} />}
                  {listing.nearbyMalls       && <NearbyBadge label="مراكز تجارية / أسواق" icon={<ShoppingBag className="w-3.5 h-3.5" />} />}
                  {listing.nearbyRestaurants && <NearbyBadge label="مطاعم" icon={<ShoppingBag className="w-3.5 h-3.5" />} />}
                  {listing.nearbyBanks       && <NearbyBadge label="بنوك / صرافات" icon={<MapPin className="w-3.5 h-3.5" />} />}
                  {listing.nearbyTransport   && <NearbyBadge label="مواصلات عامة" icon={<Bus className="w-3.5 h-3.5" />} />}
                  {listing.nearbyParks       && <NearbyBadge label="حدائق عامة" icon={<TreePine className="w-3.5 h-3.5" />} />}
                  {listing.nearbySports      && <NearbyBadge label="ملاعب رياضية" icon={<MapPin className="w-3.5 h-3.5" />} />}
                  {listing.nearbyGasStation  && <NearbyBadge label="محطة وقود" icon={<MapPin className="w-3.5 h-3.5" />} />}
                  {listing.nearbyMainRoads   && <NearbyBadge label="طرق رئيسية" icon={<MapPin className="w-3.5 h-3.5" />} />}
                </div>
              </div>
            )}

            {/* Documents */}
            {(listing.deedStatus || listing.licenseStatus) && (
              <div className="bg-card rounded-3xl border border-border p-7 shadow-sm">
                <SectionTitle icon={<BadgeCheck className="w-4.5 h-4.5" />}>الوثائق والتراخيص</SectionTitle>
                <div className="divide-y divide-border rounded-2xl overflow-hidden border border-border">
                  {listing.deedStatus && (
                    <div className="flex items-center justify-between px-5 py-3.5 bg-muted/30">
                      <span className="text-sm text-muted-foreground font-medium">حالة الصك</span>
                      <span className="text-sm font-bold text-foreground">{listing.deedStatus}</span>
                    </div>
                  )}
                  {listing.licenseStatus && (
                    <div className="flex items-center justify-between px-5 py-3.5 bg-muted/30">
                      <span className="text-sm text-muted-foreground font-medium">رخصة فال</span>
                      <span className="text-sm font-bold text-foreground font-mono">{listing.licenseStatus}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Floor plan */}
            {listing.floorPlan && (
              <div className="bg-card rounded-3xl border border-border p-7 shadow-sm">
                <SectionTitle>المخطط الهندسي</SectionTitle>
                <img src={getImageSrc(listing.floorPlan) ?? ""} alt="المخطط الهندسي" loading="lazy" decoding="async" className="w-full rounded-2xl border border-border" />
              </div>
            )}

            {/* Map — الموقع على الخريطة */}
            <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
              <div className="p-7 pb-4">
                <SectionTitle icon={<MapPin className="w-4.5 h-4.5" />}>الموقع على الخريطة</SectionTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>
                    {listing.city}
                    {listing.district ? ` ، حي ${listing.district}` : ""}
                  </span>
                  {listing.latitude != null && listing.longitude != null && (
                    <span className="text-xs font-mono text-muted-foreground/70 mr-2" dir="ltr">
                      ({(listing.latitude as number).toFixed(4)}, {(listing.longitude as number).toFixed(4)})
                    </span>
                  )}
                </div>
              </div>
              {listing.latitude != null && listing.longitude != null ? (
                <Suspense fallback={<Skeleton className="w-full rounded-none" style={{ height: 300 }} />}>
                  <ListingDetailMap
                    lat={listing.latitude as number}
                    lng={listing.longitude as number}
                    title={listing.title}
                  />
                </Suspense>
              ) : (
                <div className="mx-7 mb-7 rounded-2xl bg-muted/40 border border-dashed border-border h-36 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <MapPin className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                    <p className="text-sm font-medium">الموقع الدقيق غير محدد</p>
                    <p className="text-xs mt-0.5">{[listing.district, listing.city].filter(Boolean).join("، ")}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Market insights — مؤشرات المنطقة */}
            <div className="rounded-3xl overflow-hidden border border-primary/20" style={{ background: "linear-gradient(135deg, #0F1C3F, #0a2a4a)" }}>
              <div className="p-7">
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                    <TrendingUp className="w-4.5 h-4.5 text-[#94A3B8]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-white leading-none">مؤشرات المنطقة</h2>
                    <p className="text-xs text-white/50 mt-0.5">بيانات السوق العقاري في {listing.city ?? "المنطقة"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    {
                      icon: <BarChart3 className="w-4 h-4" />,
                      label: "متوسط سعر المتر",
                      value: listing.pricePerSqm ? formatCurrency(listing.pricePerSqm) : "—",
                      note: "للحي المحدد",
                      color: "#0F7BA0",
                    },
                    {
                      icon: <TrendingUp className="w-4 h-4" />,
                      label: "اتجاه السوق",
                      value: "صاعد",
                      note: "مؤشر سعر المنطقة",
                      color: "#34D399",
                    },
                    {
                      icon: <ArrowUpRight className="w-4 h-4" />,
                      label: "الطلب الحالي",
                      value: "مرتفع",
                      note: "إقبال على هذا النوع",
                      color: "#94A3B8",
                    },
                  ].map(item => (
                    <div key={item.label} className="bg-white/6 border border-white/10 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: item.color + "25", color: item.color }}>
                          {item.icon}
                        </div>
                        <span className="text-xs text-white/60 font-medium">{item.label}</span>
                      </div>
                      <p className="text-xl font-extrabold text-white leading-none mb-1">{item.value}</p>
                      <p className="text-[11px] text-white/45">{item.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Advertiser block */}
            {(listing.sellerName || listing.marketer) && (
              <div className="bg-card rounded-3xl border border-border p-7 shadow-sm">
                <SectionTitle icon={<UserCheck className="w-4.5 h-4.5" />}>
                  {listing.marketer ? "المسوّق العقاري" : "المُعلن"}
                </SectionTitle>

                {listing.marketer ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-border overflow-hidden flex items-center justify-center shrink-0">
                      {listing.marketer.photo ? (
                        <img src={getImageSrc(listing.marketer.photo) ?? ""} alt="" loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-extrabold text-primary">{(listing.marketer.fullName ?? "م").charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-lg font-extrabold text-foreground">{listing.marketer.fullName}</span>
                        {listing.marketer.verified && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                            <BadgeCheck className="w-3.5 h-3.5" />موثّق
                          </span>
                        )}
                      </div>
                      {listing.marketer.officeName && (
                        <p className="text-sm text-muted-foreground mb-3">{listing.marketer.officeName}</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" className="rounded-xl gap-1.5 font-semibold">
                          <Link href={`/marketers/${listing.marketer.id}`}>
                            عرض جميع إعلاناته<ChevronLeft className="w-3.5 h-3.5" />
                          </Link>
                        </Button>
                        {listing.marketer.whatsapp && (
                          <Button asChild variant="outline" size="sm" className="rounded-xl gap-1.5 font-semibold border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/5">
                            <a href={`https://wa.me/${listing.marketer.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer">
                              <MessageSquare className="w-3.5 h-3.5" />واتساب
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : listing.sellerName ? (
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-border flex items-center justify-center text-xl font-extrabold text-primary shrink-0">
                      {listing.sellerName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-extrabold text-foreground text-lg">{listing.sellerName}</p>
                      {listing.verified && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                          <Verified className="w-3.5 h-3.5" />حساب موثّق
                        </span>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Owner status controls */}
            {isOwner && (
              <div className="bg-muted/40 rounded-3xl border border-dashed border-border p-5">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">تحديث حالة الإعلان</p>
                <div className="flex flex-wrap gap-2">
                  {listing.status !== "active" && (
                    <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50" onClick={() => void handleChangeStatus("active")} disabled={statusLoading}>
                      <CheckCircle className="w-4 h-4" />إعادة تفعيل
                    </Button>
                  )}
                  {listing.status !== "sold" && (
                    <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-blue-700 border-blue-200 hover:bg-blue-50" onClick={() => void handleChangeStatus("sold")} disabled={statusLoading}>
                      <CheckCircle className="w-4 h-4" />تحديد كمُباع
                    </Button>
                  )}
                  {listing.status !== "rented" && (
                    <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-purple-700 border-purple-200 hover:bg-purple-50" onClick={() => void handleChangeStatus("rented")} disabled={statusLoading}>
                      <CheckCircle className="w-4 h-4" />تحديد كمُؤجّر
                    </Button>
                  )}
                  {listing.status !== "cancelled" && (
                    <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-orange-600 border-orange-200 hover:bg-orange-50" onClick={() => void handleChangeStatus("cancelled")} disabled={statusLoading}>
                      <Archive className="w-4 h-4" />أرشفة
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ─── RIGHT: Sticky Sidebar ─────────────────────────────── */}
          <div className="space-y-5 lg:sticky lg:top-24">

            {/* Main contact card */}
            <div className="rounded-3xl border border-primary/20 overflow-hidden shadow-lg" style={{ background: "linear-gradient(160deg, #ffffff, #f8fbff)" }}>
              {/* Price strip */}
              <div className="p-6 border-b border-border/50">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">السعر المطلوب</p>
                <div className="text-3xl font-extrabold text-primary mb-1">{formatCurrency(listing.price)}</div>
                {listing.pricePerSqm && listing.areaSqm && (
                  <p className="text-sm text-muted-foreground font-medium">
                    {formatCurrency(listing.pricePerSqm)} / م²
                    {listing.areaSqm && (
                      <span className="text-muted-foreground/60 mr-1">· {listing.areaSqm.toLocaleString("en-US")} م²</span>
                    )}
                  </p>
                )}
                {listing.negotiable && (
                  <span className="inline-block mt-2 text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg">قابل للتفاوض</span>
                )}
              </div>

              {/* CTA buttons */}
              <div className="p-5 space-y-3">
                {whatsappLink && (
                  <Button asChild size="lg" className="w-full gap-2 rounded-2xl h-12 font-bold text-base" style={{ background: "#25D366", boxShadow: "0 4px 16px rgba(37,211,102,0.3)" }}>
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                      <MessageSquare className="w-5 h-5" />تواصل عبر واتساب
                    </a>
                  </Button>
                )}
                {listing.contactPhone && (
                  <Button asChild variant="outline" size="lg" className="w-full gap-2 rounded-2xl h-12 font-bold text-base border-primary/30 text-primary hover:bg-primary hover:text-white transition-all">
                    <a href={`tel:${listing.contactPhone}`}>
                      <Phone className="w-5 h-5" />اتصال هاتفي
                    </a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="lg"
                  className="w-full gap-2 rounded-2xl h-12 font-semibold text-muted-foreground border border-dashed border-border hover:border-primary/30 hover:text-primary transition-all"
                  onClick={() => toast({ title: "طلب زيارة", description: "سيتم إضافة هذه الميزة قريباً" })}
                >
                  <Calendar className="w-5 h-5" />طلب زيارة ميدانية
                </Button>

                {/* Save / Share row */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => void toggleFav()}
                    disabled={favLoading}
                    className={`flex items-center justify-center gap-1.5 h-10 rounded-xl text-sm font-semibold border transition-all ${isFav ? "bg-destructive/5 border-destructive/30 text-destructive" : "bg-muted border-border text-muted-foreground hover:text-destructive hover:border-destructive/30"}`}
                  >
                    <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
                    {isFav ? "محفوظ" : "حفظ"}
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center gap-1.5 h-10 rounded-xl text-sm font-semibold bg-muted border border-border text-muted-foreground hover:border-primary/30 hover:text-primary transition-all"
                  >
                    <Share2 className="w-4 h-4" />مشاركة
                  </button>
                </div>
              </div>

              {/* Advertiser snippet */}
              {(listing.sellerName || listing.marketer) && (
                <div className="px-5 pb-5 pt-0">
                  <div className="rounded-2xl bg-muted/50 border border-border/60 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-base font-extrabold text-primary shrink-0 overflow-hidden">
                      {listing.marketer?.photo ? (
                        <img src={getImageSrc(listing.marketer.photo) ?? ""} alt="" loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        (listing.marketer?.fullName ?? listing.sellerName ?? "م").charAt(0)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-foreground text-sm truncate">
                        {listing.marketer?.fullName ?? listing.sellerName}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {(listing.marketer?.verified ?? listing.verified) ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary">
                            <BadgeCheck className="w-3 h-3" />موثّق
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">{listing.marketer ? "مسوّق عقاري" : "مُعلن"}</span>
                        )}
                      </div>
                    </div>
                    {listing.marketer && (
                      <Button asChild variant="ghost" size="sm" className="rounded-xl text-xs font-semibold text-primary hover:bg-primary/5 shrink-0">
                        <Link href={`/marketers/${listing.marketer.id}`}>الملف</Link>
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Views */}
              {listing.views != null && (
                <div className="px-5 pb-4 text-center">
                  <span className="text-xs text-muted-foreground">
                    <Eye className="w-3.5 h-3.5 inline ml-1" />{listing.views.toLocaleString("en-US")} مشاهدة
                  </span>
                </div>
              )}
            </div>

            {/* Marketer standalone card */}
            {listing.marketer && (
              <Card className="border-border rounded-3xl overflow-hidden shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-4 h-4 text-[#94A3B8]" />
                    <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide">المسوّق العقاري المعتمد</p>
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-border overflow-hidden flex items-center justify-center shrink-0">
                      {listing.marketer.photo ? (
                        <img src={getImageSrc(listing.marketer.photo) ?? ""} alt="" loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-extrabold text-primary">{(listing.marketer.fullName ?? "م").charAt(0)}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-extrabold text-foreground truncate">{listing.marketer.fullName}</p>
                        {listing.marketer.verified && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
                      </div>
                      {listing.marketer.officeName && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{listing.marketer.officeName}</p>
                      )}
                    </div>
                  </div>
                  <Button asChild size="sm" className="w-full rounded-xl gap-1.5 font-semibold mb-2">
                    <Link href={`/marketers/${listing.marketer.id}`}>
                      عرض ملف المسوّق<ChevronLeft className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                  {listing.marketer.phone && (
                    <Button asChild variant="outline" size="sm" className="w-full rounded-xl gap-1.5 font-semibold border-primary/25 text-primary hover:bg-primary/5">
                      <a href={`tel:${listing.marketer.phone}`}><Phone className="w-3.5 h-3.5" />اتصال</a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* ─── Similar properties ────────────────────────────────────── */}
        {similar.length > 0 && (
          <div className="pt-12 mt-4 border-t border-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-bold tracking-widest text-primary uppercase mb-1">قد يعجبك أيضاً</p>
                <h2 className="text-2xl font-extrabold text-foreground">عقارات مشابهة</h2>
              </div>
              <Button asChild variant="outline" size="sm" className="rounded-xl border-primary/30 text-primary hover:bg-primary/5 gap-1.5 font-semibold">
                <Link href="/listings">عرض الكل<ChevronLeft className="w-3.5 h-3.5" /></Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {similar.map(s => <ListingCard key={s.id} listing={s} />)}
            </div>
          </div>
        )}
      </div>

      {/* ─── Lightbox gallery ──────────────────────────────────────────── */}
      {galleryOpen && images.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/92 backdrop-blur-sm flex flex-col items-center justify-center p-4"
          onClick={() => setGalleryOpen(false)}
        >
          <div className="relative max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            {/* Close */}
            <button
              onClick={() => setGalleryOpen(false)}
              className="absolute -top-12 left-0 text-white/70 hover:text-white text-sm font-semibold flex items-center gap-2"
            >
              <Ban className="w-4 h-4" />إغلاق
            </button>
            {/* Counter */}
            <div className="absolute -top-12 right-0 text-white/60 text-sm font-mono">
              {currentImage + 1} / {images.length}
            </div>
            {/* Main image */}
            <div className="relative rounded-2xl overflow-hidden bg-black/50 max-h-[70vh]">
              <img src={images[currentImage]} alt="" className="w-full max-h-[70vh] object-contain" />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImage(i => (i - 1 + images.length) % images.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/15 hover:bg-white/30 backdrop-blur rounded-xl flex items-center justify-center text-white text-xl font-bold transition-all"
                  >‹</button>
                  <button
                    onClick={() => setCurrentImage(i => (i + 1) % images.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/15 hover:bg-white/30 backdrop-blur rounded-xl flex items-center justify-center text-white text-xl font-bold transition-all"
                  >›</button>
                </>
              )}
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2 justify-center">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === currentImage ? "border-primary scale-110" : "border-white/20 opacity-60 hover:opacity-100"}`}
                  >
                    <img src={img} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Delete confirmation ───────────────────────────────────────── */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setConfirmDelete(false)}
        >
          <div className="bg-card rounded-3xl border border-border shadow-2xl p-8 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-destructive/20">
              <Trash2 className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-xl font-extrabold text-center mb-2">حذف الإعلان</h3>
            <p className="text-center text-muted-foreground mb-8 text-sm leading-relaxed">
              هل أنت متأكد من حذف هذا الإعلان نهائياً؟<br />لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl font-bold" onClick={() => setConfirmDelete(false)}>إلغاء</Button>
              <Button variant="destructive" className="flex-1 rounded-xl gap-2 font-bold" onClick={() => void handleDelete()} disabled={deleting}>
                <Trash2 className="w-4 h-4" />حذف نهائياً
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
