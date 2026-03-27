import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { formatCurrency } from "@/lib/utils";
import {
  MapPin, Phone, MessageSquare, Mail, Globe, BadgeCheck, Building2,
  Star, Grid3X3, List, ArrowRight, Briefcase, Award,
} from "lucide-react";

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
  const [profile, setProfile] = useState<MarketerProfile | null>(null);
  const [listings, setListings] = useState<ListingCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const marketerId = parseInt(id ?? "");

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
  }, [marketerId, sort]);

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
          <Building2 className="w-16 h-16 text-muted-foreground/30 mb-4" />
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
        <div className="bg-card rounded-3xl border border-border/60 overflow-hidden shadow-sm">
          {/* Banner */}
          <div className="h-28 relative" style={{ background: "linear-gradient(135deg, #0F1C3F 0%, #0F7BA0 100%)" }}>
            {profile.verified && (
              <span className="absolute top-4 left-4 flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full bg-white/20 backdrop-blur text-white border border-white/30">
                <BadgeCheck className="w-4 h-4" />مسوّق موثّق
              </span>
            )}
          </div>

          <div className="px-6 pb-6 -mt-10">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="flex items-end gap-4">
                {/* Avatar */}
                <div className="w-20 h-20 rounded-2xl border-4 border-card bg-primary/10 flex items-center justify-center shadow-lg overflow-hidden shrink-0">
                  {profile.photo ? (
                    <img src={profile.photo} alt={profile.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-primary">{profile.fullName.charAt(0)}</span>
                  )}
                </div>
                <div className="pb-1">
                  <h1 className="text-2xl font-extrabold text-foreground leading-tight">{profile.fullName}</h1>
                  {profile.officeName && <p className="text-base text-muted-foreground font-medium">{profile.officeName}</p>}
                  {profile.city && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />{profile.city}
                    </div>
                  )}
                </div>
              </div>

              {/* CTA buttons */}
              <div className="flex gap-3 flex-wrap">
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
              </div>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-6 mt-5 pt-5 border-t border-border/40">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground leading-none">{profile.activeListingsCount}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">إعلان نشط</p>
                </div>
              </div>
              {profile.yearsExperience && (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Star className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground leading-none">{profile.yearsExperience}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">سنة خبرة</p>
                  </div>
                </div>
              )}
              {profile.licenseNumber && (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <Award className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground leading-none font-mono">{profile.licenseNumber}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">رقم الترخيص</p>
                  </div>
                </div>
              )}
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
                <Building2 className="w-12 h-12 text-muted-foreground/30 mb-3" />
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
                          <img src={l.images.split("\n")[0].trim()} alt={l.title} className="w-full h-full object-cover" />
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
      </div>
    </Layout>
  );
}
