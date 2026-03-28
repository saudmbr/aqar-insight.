import { SAUDI_CITIES as CITIES } from "@/lib/saudi-cities";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { getImageSrc } from "@/lib/utils";
import {
  Wrench, Save, Loader2, MapPin, Phone, MessageSquare, Clock,
  BadgeCheck, Trash2, Eye, Star, Plus, X, Building2, AlertTriangle,
  Globe, DollarSign,
} from "lucide-react";
import { ImageUploader } from "@/components/image-uploader";

interface ServiceProfile {
  id?: number;
  businessName?: string;
  category?: string;
  city?: string;
  coveredAreas?: string;
  description?: string;
  startingPrice?: number | null;
  contactPhone?: string | null;
  whatsapp?: string | null;
  workingHours?: string | null;
  portfolioImages?: string | null;
  verified?: boolean;
  ratingAvg?: number;
  ratingCount?: number;
  status?: string;
  createdAt?: string;
}

const CATEGORIES = [
  "بناء وتشييد", "تشطيبات وديكور", "كهرباء ومياه", "تكييف وتبريد", "دهانات", "أرضيات",
  "مطابخ", "مصاعد", "نظافة ومكافحة حشرات", "تصميم داخلي", "تصميم معماري", "تقييم عقاري",
  "إدارة عقارات", "تصوير عقاري", "صيانة", "مقاولات", "مواد بناء",
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

export default function ServiceProviderDashboard() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();

  const [profile, setProfile] = useState<ServiceProfile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "portfolio">("profile");
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Portfolio images as array
  const [portfolioList, setPortfolioList] = useState<string[]>([]);

  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
    const load = async () => {
      const res = await fetch("/api/service-providers/my/profile", { credentials: "include" });
      if (res.ok) {
        const p = await res.json() as ServiceProfile | null;
        if (p) {
          setProfile(p);
          setPortfolioList(p.portfolioImages ? p.portfolioImages.split("\n").filter(Boolean) : []);
        }
      }
      setLoading(false);
    };
    void load();
  }, [isAuthenticated]);

  const handleSave = async () => {
    setSaving(true); setError(null); setSuccess(false);
    try {
      const body = {
        ...profile,
        portfolioImages: portfolioList.join("\n"),
      };
      const res = await fetch("/api/service-providers/my/profile", {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json() as { message?: string };
        throw new Error(d.message ?? "حدث خطأ");
      }
      const updated = await res.json() as ServiceProfile;
      setProfile(updated);
      setPortfolioList(updated.portfolioImages ? updated.portfolioImages.split("\n").filter(Boolean) : []);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  const handleAddPortfolioImage = (url: string) => {
    setPortfolioList(prev => [...prev, url]);
  };

  const handleRemovePortfolioImage = (idx: number) => {
    setPortfolioList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDelete = async () => {
    if (!profile.id) return;
    setDeleting(true);
    const res = await fetch(`/api/service-providers/${profile.id}`, {
      method: "DELETE", credentials: "include",
    });
    if (res.ok) {
      navigate("/services");
    } else {
      setDeleting(false);
      setConfirmDelete(false);
      alert("فشل الحذف، يرجى المحاولة مجدداً");
    }
  };

  if (!isAuthenticated) return null;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Page header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">لوحة تحكم مزود الخدمة</h1>
            <p className="text-sm text-muted-foreground mt-0.5">أدر خدماتك ومعلوماتك المهنية</p>
          </div>
          <div className="flex items-center gap-2">
            {profile.id && (
              <Button asChild variant="outline" size="sm" className="rounded-xl gap-2">
                <Link href={`/services/${profile.id}`}>
                  <Eye className="w-4 h-4" />عرض الصفحة العامة
                </Link>
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => void handleSave()}
              disabled={saving}
              className="rounded-xl gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              حفظ التغييرات
            </Button>
          </div>
        </div>

        {/* Profile summary card */}
        <Card className="rounded-2xl border-border overflow-hidden">
          <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #0F1C3F 0%, #0F7BA0 100%)" }} />
          <CardContent className="p-5">
            {loading ? (
              <div className="flex items-center gap-4">
                <Skeleton className="w-14 h-14 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 flex-wrap">
                <div className="w-14 h-14 rounded-xl bg-primary/10 border border-border flex items-center justify-center shrink-0">
                  <Wrench className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-foreground text-lg">
                      {profile.businessName ?? user?.fullName ?? "نشاطك التجاري"}
                    </p>
                    {profile.verified && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        <BadgeCheck className="w-3 h-3" />موثّق
                      </span>
                    )}
                    {profile.status && (
                      <Badge
                        variant="outline"
                        className={`text-xs rounded-lg ${profile.status === "active" ? "border-green-500/30 text-green-600 bg-green-50" : "border-orange-500/30 text-orange-600 bg-orange-50"}`}
                      >
                        {profile.status === "active" ? "نشط" : "موقوف"}
                      </Badge>
                    )}
                  </div>
                  {profile.category && (
                    <p className="text-sm text-muted-foreground mt-0.5">{profile.category}</p>
                  )}
                  {profile.city && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />{profile.city}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 text-center">
                  {(profile.ratingAvg ?? 0) > 0 && (
                    <div>
                      <p className="text-lg font-bold text-foreground">{(profile.ratingAvg ?? 0).toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-0.5 justify-center">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />تقييم
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-lg font-bold text-foreground">{portfolioList.length}</p>
                    <p className="text-xs text-muted-foreground">صورة</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex border-b border-border gap-1">
          {([
            { key: "profile", label: "بياناتي" },
            { key: "portfolio", label: "معرض الأعمال" },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
            <span className="text-base">⚠</span>{error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/8 px-4 py-3 text-sm text-green-700">
            <span>✓</span>تم حفظ التغييرات بنجاح
          </div>
        )}

        {/* ── Profile tab ─────────────────────────────────────────────────────── */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            {/* Basic info */}
            <Section title="المعلومات الأساسية">
              <Field label="اسم النشاط التجاري *">
                <Input
                  value={profile.businessName ?? ""}
                  onChange={e => setProfile(p => ({ ...p, businessName: e.target.value }))}
                  placeholder="مثال: شركة الفيصل للتشطيبات"
                  className="rounded-xl"
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="التصنيف *">
                  <select
                    value={profile.category ?? ""}
                    onChange={e => setProfile(p => ({ ...p, category: e.target.value }))}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">اختر التصنيف</option>
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="المدينة *">
                  <select
                    value={profile.city ?? ""}
                    onChange={e => setProfile(p => ({ ...p, city: e.target.value }))}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">اختر المدينة</option>
                    {CITIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="المناطق المغطاة">
                <Input
                  value={profile.coveredAreas ?? ""}
                  onChange={e => setProfile(p => ({ ...p, coveredAreas: e.target.value }))}
                  placeholder="مثال: شمال الرياض، العليا، النرجس"
                  className="rounded-xl"
                />
              </Field>
              <Field label="وصف الخدمة">
                <textarea
                  value={profile.description ?? ""}
                  onChange={e => setProfile(p => ({ ...p, description: e.target.value }))}
                  placeholder="اكتب وصفاً مفصلاً لخدمتك وخبرتك وما تقدمه..."
                  rows={4}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </Field>
            </Section>

            {/* Contact & pricing */}
            <Section title="التواصل والأسعار">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="رقم الجوال">
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={profile.contactPhone ?? ""}
                      onChange={e => setProfile(p => ({ ...p, contactPhone: e.target.value }))}
                      placeholder="05xxxxxxxx"
                      className="rounded-xl pr-9"
                      dir="ltr"
                    />
                  </div>
                </Field>
                <Field label="واتساب">
                  <div className="relative">
                    <MessageSquare className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={profile.whatsapp ?? ""}
                      onChange={e => setProfile(p => ({ ...p, whatsapp: e.target.value }))}
                      placeholder="966xxxxxxxxx"
                      className="rounded-xl pr-9"
                      dir="ltr"
                    />
                  </div>
                </Field>
                <Field label="ساعات العمل">
                  <div className="relative">
                    <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={profile.workingHours ?? ""}
                      onChange={e => setProfile(p => ({ ...p, workingHours: e.target.value }))}
                      placeholder="مثال: السبت - الخميس 8ص - 6م"
                      className="rounded-xl pr-9"
                    />
                  </div>
                </Field>
                <Field label="السعر يبدأ من (ر.س)">
                  <div className="relative">
                    <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={profile.startingPrice ?? ""}
                      onChange={e => setProfile(p => ({ ...p, startingPrice: e.target.value ? parseFloat(e.target.value) : null }))}
                      placeholder="1000"
                      className="rounded-xl pr-9"
                      min={0}
                    />
                  </div>
                </Field>
              </div>
            </Section>

            {/* Save button */}
            <div className="flex justify-end">
              <Button onClick={() => void handleSave()} disabled={saving} className="rounded-xl gap-2 px-8">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                حفظ التغييرات
              </Button>
            </div>

            {/* Danger zone */}
            {profile.id && (
              <Card className="border-destructive/30 rounded-2xl">
                <CardHeader className="bg-destructive/5 border-b border-destructive/20 py-4 px-5">
                  <CardTitle className="text-sm font-bold text-destructive flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />منطقة الخطر
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground mb-4">
                    حذف خدمتك سيزيلها نهائياً من قاعدة البيانات ولا يمكن التراجع عن هذا الإجراء.
                  </p>
                  {!confirmDelete ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl gap-2 border-destructive/30 text-destructive hover:bg-destructive hover:text-white"
                      onClick={() => setConfirmDelete(true)}
                    >
                      <Trash2 className="w-4 h-4" />حذف الخدمة
                    </Button>
                  ) : (
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-sm font-semibold text-destructive">هل أنت متأكد تماماً؟</p>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="rounded-xl gap-2"
                        onClick={() => void handleDelete()}
                        disabled={deleting}
                      >
                        {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        نعم، احذف نهائياً
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => setConfirmDelete(false)}
                      >
                        إلغاء
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── Portfolio tab ────────────────────────────────────────────────────── */}
        {activeTab === "portfolio" && (
          <div className="space-y-4">
            <Section title="إضافة صورة جديدة">
              <p className="text-xs text-muted-foreground">أضف صور أعمالك ومشاريعك السابقة لإقناع العملاء.</p>
              <ImageUploader
                onUpload={(url) => handleAddPortfolioImage(url)}
                label="رفع صورة عمل"
              />
            </Section>

            <Section title={`صور معرض الأعمال (${portfolioList.length})`}>
              {portfolioList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">لا توجد صور بعد — أضف صور أعمالك لتبرز في دليل الخدمات</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {portfolioList.map((img, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-border aspect-video bg-muted">
                      <img
                        src={getImageSrc(img) ?? ""}
                        alt={`صورة عمل ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleRemovePortfolioImage(idx)}
                        className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                        title="حذف الصورة"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {portfolioList.length > 0 && (
                <div className="flex justify-end">
                  <Button onClick={() => void handleSave()} disabled={saving} className="rounded-xl gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    حفظ معرض الأعمال
                  </Button>
                </div>
              )}
            </Section>
          </div>
        )}
      </div>
    </Layout>
  );
}
