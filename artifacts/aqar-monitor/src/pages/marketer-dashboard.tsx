import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { useAuth } from "@/contexts/auth-context";
import { getImageSrc } from "@/lib/utils";
import {
  Building2, Save, Loader2, Plus, User, MapPin, Phone, Globe, Star,
  BadgeCheck, Edit, Trash2, Eye,
} from "lucide-react";
import { ImageUploader } from "@/components/image-uploader";

interface MarketerProfile {
  id?: number;
  officeName?: string;
  bio?: string;
  city?: string;
  servedAreas?: string;
  specialties?: string;
  yearsExperience?: number;
  licenseNumber?: string;
  photo?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  websiteUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  verified?: boolean;
  activeListingsCount?: number;
}

const CITIES = ["الرياض", "جدة", "الدمام", "مكة المكرمة", "المدينة المنورة", "الخبر", "تبوك", "أبها", "الطائف", "بريدة"];

const SPECIALTIES_OPTIONS = [
  "شقق سكنية", "فلل وقصور", "أراضي", "مكاتب وتجاري", "مستودعات", "استثمار عقاري",
  "إيجار سكني", "إيجار تجاري", "مزادات", "مشاريع تطويرية",
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="border-border rounded-2xl overflow-hidden">
      <CardHeader className="bg-muted/30 border-b border-border py-4 px-5">
        <CardTitle className="text-sm font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">{children}</CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</Label>
      {children}
    </div>
  );
}

export default function MarketerDashboard() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();

  const [profile, setProfile] = useState<MarketerProfile>({});
  const [listings, setListings] = useState<ListingCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "listings">("profile");

  // For specialties multi-select
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [servedAreasText, setServedAreasText] = useState("");

  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
    const load = async () => {
      const [pRes, lRes] = await Promise.all([
        fetch("/api/marketers/me/profile", { credentials: "include" }),
        fetch("/api/listings/my/listings", { credentials: "include" }),
      ]);
      if (pRes.ok) {
        const p = await pRes.json() as MarketerProfile | null;
        if (p) {
          setProfile(p);
          setSelectedSpecialties(p.specialties ? (JSON.parse(p.specialties) as string[]) : []);
          setServedAreasText(p.servedAreas ? (JSON.parse(p.servedAreas) as string[]).join("، ") : "");
        }
      }
      if (lRes.ok) setListings(await lRes.json() as ListingCardData[]);
      setLoading(false);
    };
    void load();
  }, [isAuthenticated]);

  const toggleSpecialty = (s: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const handleSave = async () => {
    setSaving(true); setError(null); setSuccess(false);
    try {
      const areas = servedAreasText
        .split(/[،,]/)
        .map(s => s.trim())
        .filter(Boolean);

      const body: Record<string, unknown> = {
        ...profile,
        specialties: JSON.stringify(selectedSpecialties),
        servedAreas: JSON.stringify(areas),
      };

      const res = await fetch("/api/marketers/me/profile", {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json() as { message?: string };
        throw new Error(d.message ?? "حدث خطأ");
      }
      const updated = await res.json() as MarketerProfile;
      setProfile(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteListing = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا الإعلان؟")) return;
    const res = await fetch(`/api/listings/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) setListings(prev => prev.filter(l => l.id !== id));
  };

  const set = (k: keyof MarketerProfile, v: unknown) => setProfile(p => ({ ...p, [k]: v }));

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-4 pb-12">
          <Skeleton className="h-12 w-64 rounded-xl" />
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Header Hero */}
        <div
          className="relative rounded-[2rem] overflow-hidden p-8 md:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
          style={{ background: "linear-gradient(135deg, #0F1C3F 0%, #0F1C3F 60%, #0F7BA0 100%)" }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_top_right,rgba(201,168,76,0.12),transparent)] pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-accent/15 border border-accent/25 text-accent px-3 py-1 rounded-full text-xs font-semibold mb-3">
              <Star className="w-3.5 h-3.5" />
              مسوّق عقاري
              {profile.verified && <BadgeCheck className="w-3.5 h-3.5" />}
            </div>
            <h1 className="text-3xl font-extrabold text-white leading-tight">لوحة المسوّق العقاري</h1>
            <p className="text-white/75 mt-2 text-sm">
              أهلاً {user?.fullName ?? user?.username} — {profile.verified ? "حساب موثّق ✓" : "في انتظار التوثيق"}
            </p>
          </div>
          <Button asChild className="relative z-10 rounded-xl gap-2 shrink-0 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold shadow-none">
            <Link href="/listings/new"><Plus className="w-4 h-4" />نشر إعلان جديد</Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "إعلانات نشطة", value: profile.activeListingsCount ?? 0, icon: <Building2 className="w-5 h-5" />, color: "text-primary bg-primary/10" },
            { label: "سنوات الخبرة", value: profile.yearsExperience ?? "—", icon: <Star className="w-5 h-5" />, color: "text-accent bg-accent/10" },
            { label: "حالة الملف", value: profile.id ? "مكتمل" : "غير مكتمل", icon: <User className="w-5 h-5" />, color: "text-green-600 bg-green-100" },
          ].map((stat, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {[
            { key: "profile", label: "الملف الشخصي", icon: <User className="w-4 h-4" /> },
            { key: "listings", label: `إعلاناتي (${listings.length})`, icon: <Building2 className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as "profile" | "listings")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-5">
            {error && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-4 text-destructive font-medium text-sm flex items-center gap-2">
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-green-700 font-medium text-sm flex items-center gap-2">
                ✓ تم حفظ الملف الشخصي بنجاح
              </div>
            )}

            <Section title="🏢 معلومات المكتب">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="الاسم الكامل / المكتب">
                  <Input value={profile.officeName ?? ""} onChange={e => set("officeName", e.target.value)} placeholder="اسم المكتب أو الشركة" className="h-10 rounded-xl" />
                </Field>
                <Field label="المدينة الرئيسية">
                  <select value={profile.city ?? ""} onChange={e => set("city", e.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm">
                    <option value="">اختر المدينة</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="سنوات الخبرة">
                  <Input type="number" min="0" value={profile.yearsExperience ?? ""} onChange={e => set("yearsExperience", parseInt(e.target.value))} placeholder="0" className="h-10 rounded-xl" />
                </Field>
                <Field label="رقم الترخيص (فال)">
                  <Input value={profile.licenseNumber ?? ""} onChange={e => set("licenseNumber", e.target.value)} placeholder="12000XXXXX" className="h-10 rounded-xl font-mono" dir="ltr" />
                </Field>
              </div>
              <Field label="النبذة التعريفية">
                <textarea
                  rows={4}
                  value={profile.bio ?? ""}
                  onChange={e => set("bio", e.target.value)}
                  placeholder="أخبر العملاء عن نفسك وخبرتك في السوق العقاري..."
                  className="w-full rounded-xl border border-input bg-background p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </Field>
            </Section>

            <Section title="🗺️ نطاق التغطية والتخصصات">
              <Field label="مناطق التغطية (افصل بين المناطق بفاصلة)">
                <Input value={servedAreasText} onChange={e => setServedAreasText(e.target.value)} placeholder="مثال: حي الملقا، الياسمين، الرياض" className="h-10 rounded-xl" />
              </Field>
              <Field label="التخصصات">
                <div className="flex flex-wrap gap-2">
                  {SPECIALTIES_OPTIONS.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSpecialty(s)}
                      className={`text-xs px-3 py-1.5 rounded-xl border transition-all font-medium ${
                        selectedSpecialties.includes(s)
                          ? "bg-primary text-white border-primary"
                          : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-primary"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </Field>
            </Section>

            <Section title="📞 بيانات التواصل">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="رقم الجوال">
                  <Input type="tel" value={profile.phone ?? ""} onChange={e => set("phone", e.target.value)} placeholder="05XXXXXXXX" className="h-10 rounded-xl font-mono" dir="ltr" />
                </Field>
                <Field label="رقم الواتساب">
                  <Input type="tel" value={profile.whatsapp ?? ""} onChange={e => set("whatsapp", e.target.value)} placeholder="9665XXXXXXXX" className="h-10 rounded-xl font-mono" dir="ltr" />
                </Field>
                <Field label="البريد الإلكتروني">
                  <Input type="email" value={profile.email ?? ""} onChange={e => set("email", e.target.value)} placeholder="your@email.com" className="h-10 rounded-xl font-mono" dir="ltr" />
                </Field>
                <Field label="رابط الموقع">
                  <Input type="url" value={profile.websiteUrl ?? ""} onChange={e => set("websiteUrl", e.target.value)} placeholder="https://..." className="h-10 rounded-xl font-mono" dir="ltr" />
                </Field>
              </div>
            </Section>

            <Section title="🔗 روابط التواصل الاجتماعي">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: "twitterUrl", label: "تويتر / إكس", ph: "https://x.com/..." },
                  { key: "instagramUrl", label: "إنستغرام", ph: "https://instagram.com/..." },
                  { key: "facebookUrl", label: "فيسبوك", ph: "https://facebook.com/..." },
                  { key: "linkedinUrl", label: "لينكدإن", ph: "https://linkedin.com/in/..." },
                ].map(({ key, label, ph }) => (
                  <Field key={key} label={label}>
                    <Input
                      type="url"
                      value={(profile as Record<string, unknown>)[key] as string ?? ""}
                      onChange={e => set(key as keyof MarketerProfile, e.target.value)}
                      placeholder={ph}
                      className="h-10 rounded-xl font-mono text-xs"
                      dir="ltr"
                    />
                  </Field>
                ))}
              </div>
            </Section>

            <Section title="🖼️ الصورة الشخصية">
              <ImageUploader
                value={profile.photo ?? ""}
                onChange={v => set("photo", v.split("\n")[0]?.trim() ?? "")}
                maxImages={1}
                label="الصورة الشخصية"
              />
            </Section>

            {/* Save */}
            <div className="sticky bottom-6 z-10">
              <div className="bg-card/90 backdrop-blur-md rounded-2xl border border-border p-4 shadow-2xl flex gap-3">
                <Button onClick={() => void handleSave()} disabled={saving} className="flex-1 h-12 rounded-xl gap-2 font-bold text-base shadow-lg shadow-primary/20">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />جارٍ الحفظ…</> : <><Save className="w-4 h-4" />حفظ الملف الشخصي</>}
                </Button>
                {profile.id && (
                  <Button asChild variant="outline" className="rounded-xl h-12 px-5 gap-2 font-semibold">
                    <Link href={`/marketers/${profile.id}`}><Eye className="w-4 h-4" />معاينة ملفي</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Listings Tab */}
        {activeTab === "listings" && (
          <div className="space-y-5">
            {listings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-2xl border border-border border-dashed">
                <Building2 className="w-14 h-14 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-bold text-foreground mb-2">لا توجد إعلانات بعد</h3>
                <p className="text-muted-foreground mb-6">ابدأ بنشر أول إعلان عقاري</p>
                <Button asChild className="rounded-xl gap-2">
                  <Link href="/listings/new"><Plus className="w-4 h-4" />نشر إعلان جديد</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {listings.map(listing => (
                  <div key={listing.id} className="bg-card border border-border/60 rounded-2xl p-4 flex gap-4 items-center hover:border-primary/20 transition-all">
                    <div className="w-20 h-16 rounded-xl bg-muted shrink-0 overflow-hidden">
                      {listing.images ? (
                        <img src={getImageSrc(listing.images.split("\n")[0].trim()) ?? ""} alt={listing.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="w-7 h-7 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant={listing.status === "active" ? "default" : "secondary"} className="text-xs">
                          {listing.status === "active" ? "🟢 نشط" : listing.status === "sold" ? "🔵 مُباع" : listing.status === "rented" ? "🟣 مُؤجّر" : "🔴 ملغي"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{listing.city}</span>
                      </div>
                      <h4 className="font-semibold text-foreground truncate">{listing.title}</h4>
                      <p className="text-sm font-bold text-primary mt-0.5">{listing.price?.toLocaleString("ar-SA")} ريال</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button asChild size="sm" variant="ghost" className="rounded-lg w-9 h-9 p-0" title="معاينة">
                        <Link href={`/listings/${listing.id}`}><Eye className="w-4 h-4" /></Link>
                      </Button>
                      <Button asChild size="sm" variant="ghost" className="rounded-lg w-9 h-9 p-0 text-primary" title="تعديل">
                        <Link href={`/listings/${listing.id}/edit`}><Edit className="w-4 h-4" /></Link>
                      </Button>
                      <Button size="sm" variant="ghost" className="rounded-lg w-9 h-9 p-0 text-destructive hover:bg-destructive/10" title="حذف" onClick={() => void handleDeleteListing(listing.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
