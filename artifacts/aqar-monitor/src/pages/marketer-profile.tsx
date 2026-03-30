import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { formatCurrency, getImageSrc } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { ReportDialog } from "@/components/report-dialog";
import {
  MapPin, Phone, MessageSquare, Mail, Globe, BadgeCheck, Building2,
  Star, Grid3X3, List, ArrowRight, Briefcase, Award, Send, ThumbsUp,
} from "lucide-react";

interface Rating {
  id: number;
  marketerId: number;
  userId: number | null;
  rating: number;
  comment: string | null;
  reviewerName: string | null;
  createdAt: string;
}

interface RatingsData {
  ratings: Rating[];
  avgRating: number | null;
  totalCount: number;
}

interface MarketerProfile {
  id: number;
  userId: number;
  fullName: string;
  username: string;
  officeName: string | null;
  bio: string | null;
  city: string | null;
  servedAreas: string | null;
  specialties: string | null;
  yearsExperience: number | null;
  licenseNumber: string | null;
  photo: string | null;
  coverImage: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  websiteUrl: string | null;
  facebookUrl: string | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  verified: boolean;
  activeListingsCount: number;
  createdAt: string;
}

const SORT_OPTIONS = [
  { value: "newest", label: "الأحدث" },
  { value: "oldest", label: "الأقدم" },
  { value: "price_desc", label: "الأعلى سعراً" },
  { value: "price_asc", label: "الأدنى سعراً" },
  { value: "area_desc", label: "الأكبر مساحةً" },
];

export default function MarketerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<MarketerProfile | null>(null);
  const [listings, setListings] = useState<ListingCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Ratings state
  const [ratingsData, setRatingsData] = useState<RatingsData | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingName, setRatingName] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState(false);

  const marketerId = parseInt(id ?? "");

  const loadRatings = async () => {
    if (isNaN(marketerId)) return;
    const res = await fetch(`/api/marketers/${marketerId}/ratings`);
    if (res.ok) setRatingsData(await res.json() as RatingsData);
  };

  useEffect(() => {
    if (isNaN(marketerId)) return;
    const load = async () => {
      setLoading(true);
      const [pRes, lRes] = await Promise.all([
        fetch(`/api/marketers/${marketerId}`),
        fetch(`/api/marketers/${marketerId}/listings?sort=${sort}`),
      ]);
      if (pRes.ok) setProfile(await pRes.json() as MarketerProfile);
      if (lRes.ok) setListings(await lRes.json() as ListingCardData[]);
      setLoading(false);
    };
    void load();
    void loadRatings();
  }, [marketerId, sort]);

  const submitRating = async () => {
    if (!ratingValue) return;
    setRatingSubmitting(true);
    try {
      const res = await fetch(`/api/marketers/${marketerId}/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          rating: ratingValue,
          comment: ratingComment.trim() || undefined,
          reviewerName: user ? undefined : (ratingName.trim() || "زائر"),
        }),
      });
      if (res.ok) {
        setRatingSuccess(true);
        setRatingComment("");
        setRatingValue(0);
        setRatingName("");
        await loadRatings();
        setTimeout(() => setRatingSuccess(false), 3000);
      }
    } finally {
      setRatingSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
          <Skeleton className="h-48 w-full rounded-3xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 text-center bg-card rounded-3xl border border-border border-dashed max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl border border-primary/15 flex items-center justify-center mb-6">
            <Building2 className="w-10 h-10 text-primary/60" />
          </div>
          <h2 className="text-2xl font-bold mb-3">المسوّق غير موجود</h2>
          <Button asChild variant="outline" className="rounded-xl px-8">
            <Link href="/marketers"><ArrowRight className="w-4 h-4 ml-2" />العودة للدليل</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const specialties = profile.specialties ? (JSON.parse(profile.specialties) as string[]) : [];
  const servedAreas = profile.servedAreas ? (JSON.parse(profile.servedAreas) as string[]) : [];
  const whatsappLink = profile.whatsapp
    ? `https://wa.me/${profile.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`مرحباً ${profile.fullName}، وجدت ملفك على منصة عقار إنسايت`)}`
    : null;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        {/* Back nav */}
        <div>
          <Link href="/marketers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
            <ArrowRight className="w-4 h-4" />دليل المسوّقين
          </Link>
        </div>

        {/* Profile hero card */}
        <div className="bg-card rounded-3xl border border-border/60 shadow-sm overflow-hidden">
          {/* ── Cover image strip ── */}
          {profile.coverImage && getImageSrc(profile.coverImage) ? (
            <div className="h-44 w-full relative overflow-hidden">
              <img
                src={getImageSrc(profile.coverImage) ?? ""}
                alt=""
                className="w-full h-full object-cover"
                onError={e => {
                  const img = e.currentTarget as HTMLImageElement;
                  if (img.parentElement) img.parentElement.style.background = "linear-gradient(135deg, #0F1C3F 0%, #0F7BA0 100%)";
                  img.style.display = "none";
                }}
              />
              {/* Light bottom fade only — no darkening */}
              <div className="absolute inset-x-0 bottom-0 h-8" style={{ background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.25))" }} />
              {profile.verified && (
                <span className="absolute top-4 right-4 flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-primary text-white shadow-md">
                  <BadgeCheck className="w-3.5 h-3.5" /> موثّق
                </span>
              )}
            </div>
          ) : (
            <div className="h-2 w-full" style={{ background: "linear-gradient(90deg, #0F1C3F 0%, #0F7BA0 100%)" }} />
          )}

          {/* ── Content: avatar floats up over cover seam, text fully below ── */}
          <div className="relative px-6 pb-6">
            {/* Avatar — absolute so it doesn't push text down */}
            <div
              className={`absolute rounded-2xl overflow-hidden shrink-0 border-4 shadow-lg bg-primary/10 flex items-center justify-center ${profile.coverImage && getImageSrc(profile.coverImage) ? "border-white" : "border-card bg-muted"}`}
              style={{ width: 88, height: 88, top: -44, right: 24 }}
            >
              {profile.photo ? (
                <>
                  <img
                    src={getImageSrc(profile.photo) ?? ""}
                    alt={profile.fullName}
                    className="w-full h-full object-cover"
                    onError={e => {
                      const img = e.currentTarget as HTMLImageElement;
                      img.style.display = "none";
                      const fb = img.nextElementSibling as HTMLElement | null;
                      if (fb) fb.style.display = "flex";
                    }}
                  />
                  <span className="text-3xl font-bold text-primary hidden items-center justify-center w-full h-full">
                    {profile.fullName.charAt(0)}
                  </span>
                </>
              ) : (
                <span className="text-3xl font-bold text-primary">{profile.fullName.charAt(0)}</span>
              )}
            </div>

            {/* Text content — starts fresh below the cover, with left padding for avatar space */}
            <div className="pt-12">
              {/* Row: name + CTAs */}
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-extrabold text-foreground leading-tight">{profile.fullName}</h1>
                    {profile.verified && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                        <BadgeCheck className="w-3.5 h-3.5" />موثّق
                      </span>
                    )}
                  </div>
                  {profile.officeName && (
                    <p className="text-sm text-muted-foreground font-semibold mt-1">{profile.officeName}</p>
                  )}
                  {profile.city && (
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />{profile.city}
                    </div>
                  )}
                  {/* Rating inline */}
                  {ratingsData && ratingsData.totalCount > 0 && (
                    <div className="flex items-center gap-1.5 mt-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(ratingsData.avgRating ?? 0) ? "text-amber-400 fill-amber-400" : "text-border"}`} />
                      ))}
                      <span className="text-xs font-bold text-foreground">{(ratingsData.avgRating ?? 0).toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({ratingsData.totalCount} تقييم)</span>
                    </div>
                  )}
                  {specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {specialties.slice(0, 4).map((s, i) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/15 font-medium">{s}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* CTA buttons */}
                <div className="flex gap-2 flex-wrap shrink-0">
                  {whatsappLink && (
                    <Button asChild size="sm" className="rounded-xl gap-2 bg-[#25D366] hover:bg-[#1ebe5b] text-white">
                      <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                        <MessageSquare className="w-4 h-4" />واتساب
                      </a>
                    </Button>
                  )}
                  {profile.phone && (
                    <Button asChild size="sm" variant="outline" className="rounded-xl gap-2">
                      <a href={`tel:${profile.phone}`}>
                        <Phone className="w-4 h-4" />اتصال
                      </a>
                    </Button>
                  )}
                  <ReportDialog
                    targetType="marketer"
                    targetId={profile.id}
                    targetTitle={profile.fullName ?? profile.officeName ?? undefined}
                  />
                </div>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap gap-6 mt-5 pt-5 border-t border-border/40">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-foreground leading-none">{profile.activeListingsCount}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">إعلان نشط</p>
                  </div>
                </div>
                {profile.yearsExperience && (
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Star className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-foreground leading-none">{profile.yearsExperience}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">سنة خبرة</p>
                    </div>
                  </div>
                )}
                {profile.licenseNumber && (
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
                      <Award className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground leading-none font-mono">{profile.licenseNumber}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">رقم الترخيص</p>
                    </div>
                  </div>
                )}
                {ratingsData && ratingsData.totalCount > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Star className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-foreground leading-none">{(ratingsData.avgRating ?? 0).toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{ratingsData.totalCount} تقييم</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left: about + contact */}
          <div className="space-y-6 lg:sticky lg:top-24">
            {/* Bio */}
            {profile.bio && (
              <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" />نبذة تعريفية
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Specialties */}
            {specialties.length > 0 && (
              <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-foreground mb-3">التخصصات</h3>
                <div className="flex flex-wrap gap-2">
                  {specialties.map((s, i) => (
                    <Badge key={i} variant="outline" className="rounded-xl text-xs px-3 py-1 border-primary/20 text-primary bg-primary/5">{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Served areas */}
            {servedAreas.length > 0 && (
              <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />مناطق التغطية
                </h3>
                <div className="flex flex-wrap gap-2">
                  {servedAreas.map((a, i) => (
                    <span key={i} className="text-xs px-3 py-1 rounded-xl bg-muted text-muted-foreground border border-border/40 font-medium">{a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact */}
            <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-foreground mb-3">التواصل</h3>
              {profile.email && (
                <a href={`mailto:${profile.email}`} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <Mail className="w-4 h-4 text-primary shrink-0" />{profile.email}
                </a>
              )}
              {profile.websiteUrl && (
                <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <Globe className="w-4 h-4 text-primary shrink-0" />الموقع الإلكتروني
                </a>
              )}
            </div>
          </div>

          {/* Right: listings */}
          <div className="lg:col-span-2 space-y-5">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-xl font-bold text-foreground">
                إعلانات {profile.fullName}
                <span className="text-muted-foreground text-base font-normal mr-2">({listings.length})</span>
              </h2>
              <div className="flex items-center gap-3">
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                  className="h-9 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div className="flex border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`px-3 py-2 ${viewMode === "grid" ? "bg-primary text-white" : "bg-card text-muted-foreground hover:bg-muted"}`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`px-3 py-2 ${viewMode === "list" ? "bg-primary text-white" : "bg-card text-muted-foreground hover:bg-muted"}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {listings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-card rounded-2xl border border-border border-dashed">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl border border-primary/15 flex items-center justify-center mb-4">
                  <Building2 className="w-7 h-7 text-primary/60" />
                </div>
                <p className="text-muted-foreground">لا توجد إعلانات نشطة حالياً</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {listings.map(l => <ListingCard key={l.id} listing={l} />)}
              </div>
            ) : (
              <div className="space-y-3">
                {listings.map(l => (
                  <Link key={l.id} href={`/listings/${l.id}`}>
                    <div className="bg-card border border-border/60 rounded-2xl p-4 flex gap-4 hover:border-primary/30 hover:shadow-md transition-all duration-200">
                      <div className="w-24 h-20 rounded-xl bg-muted shrink-0 overflow-hidden">
                        {l.images ? (
                          <img src={getImageSrc(l.images.split("\n")[0].trim()) ?? ""} alt={l.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="w-8 h-8 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate">{l.title}</h4>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <MapPin className="w-3 h-3" />{l.city}{l.district ? ` · ${l.district}` : ""}
                        </div>
                        <p className="text-base font-bold text-primary mt-2">{formatCurrency(l.price)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Ratings Section ─────────────────────────────────────── */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">تقييمات المسوّق</h2>
              {ratingsData && ratingsData.totalCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  متوسط التقييم {(ratingsData.avgRating ?? 0).toFixed(1)} من 5 — بناءً على {ratingsData.totalCount} تقييم
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Submit rating form */}
            <div className="bg-card rounded-2xl border border-border/60 p-6 shadow-sm space-y-5">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 text-primary" />
                {ratingSuccess ? "شكراً على تقييمك!" : "قيّم هذا المسوّق"}
              </h3>

              {ratingSuccess ? (
                <div className="py-6 flex flex-col items-center gap-3 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <ThumbsUp className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="font-semibold text-foreground">تم إرسال تقييمك بنجاح</p>
                  <p className="text-sm text-muted-foreground">نقدّر مساهمتك في تحسين تجربة الجميع</p>
                </div>
              ) : (
                <>
                  {/* Star picker */}
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-2">التقييم</p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          onClick={() => setRatingValue(n)}
                          onMouseEnter={() => setRatingHover(n)}
                          onMouseLeave={() => setRatingHover(0)}
                          className="transition-transform hover:scale-110"
                          title={`${n} نجوم`}
                        >
                          <Star
                            className={`w-8 h-8 transition-colors ${
                              n <= (ratingHover || ratingValue)
                                ? "text-amber-400 fill-amber-400"
                                : "text-border"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    {ratingValue > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {["", "ضعيف", "مقبول", "جيد", "جيد جداً", "ممتاز"][ratingValue]}
                      </p>
                    )}
                  </div>

                  {/* Name (if not logged in) */}
                  {!user && (
                    <div>
                      <label className="text-sm font-semibold text-foreground block mb-1.5">اسمك (اختياري)</label>
                      <input
                        type="text"
                        placeholder="زائر مجهول"
                        value={ratingName}
                        onChange={e => setRatingName(e.target.value)}
                        className="w-full border border-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  )}

                  {/* Comment */}
                  <div>
                    <label className="text-sm font-semibold text-foreground block mb-1.5">تعليقك (اختياري)</label>
                    <textarea
                      placeholder="اكتب تعليقاً مختصراً عن تجربتك مع هذا المسوّق..."
                      value={ratingComment}
                      onChange={e => setRatingComment(e.target.value)}
                      rows={3}
                      className="w-full border border-input rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <button
                    onClick={submitRating}
                    disabled={!ratingValue || ratingSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: ratingValue ? "linear-gradient(135deg, #0F7BA0, #0a5f7e)" : undefined,
                      color: ratingValue ? "white" : undefined,
                      border: ratingValue ? "none" : "1px solid #e5e7eb",
                    }}
                  >
                    <Send className="w-4 h-4" />
                    {ratingSubmitting ? "جارٍ الإرسال…" : "إرسال التقييم"}
                  </button>
                </>
              )}
            </div>

            {/* Ratings list */}
            <div className="space-y-4">
              {!ratingsData || ratingsData.ratings.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border border-dashed p-8 text-center">
                  <Star className="w-10 h-10 text-border mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">لا توجد تقييمات بعد — كن أول من يقيّم هذا المسوّق</p>
                </div>
              ) : (
                ratingsData.ratings.map(r => (
                  <div key={r.id} className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                          {(r.reviewerName ?? "ز").charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{r.reviewerName ?? "زائر"}</p>
                          <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("ar-SA")}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < r.rating ? "text-amber-400 fill-amber-400" : "text-border"}`} />
                        ))}
                      </div>
                    </div>
                    {r.comment && (
                      <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
