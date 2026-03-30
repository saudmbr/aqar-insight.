import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, Wrench, Contact, Image as ImageIcon, Map, FileText, Globe, Video } from "lucide-react";
import { ImageUploader } from "@/components/image-uploader";
import { useAuth } from "@/contexts/auth-context";
import { SAUDI_REGIONS_LIST, getMuhafazat, getAllAhyaaForCity } from "@/lib/saudi-geo";


const CATEGORIES = [
  "بناء وتشييد", "تشطيبات وديكور", "كهرباء ومياه", "تكييف وتبريد", "دهانات", "أرضيات",
  "مطابخ", "مصاعد", "نظافة ومكافحة حشرات", "تصميم داخلي", "تصميم معماري", "تقييم عقاري",
  "إدارة عقارات", "تصوير عقاري", "صيانة", "مقاولات", "مواد بناء", "أخرى",
];

function FieldGroup({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-foreground flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

export default function ServiceForm() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [customDistrict, setCustomDistrict] = useState("");
  const [coveredAreas, setCoveredAreas] = useState("");
  const [description, setDescription] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [portfolioImages, setPortfolioImages] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [customCategory, setCustomCategory] = useState("");

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!businessName || !category || !city) {
      setError("يرجى ملء اسم النشاط، التصنيف، والمدينة"); 
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/service-providers", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, category: category === "أخرى" ? customCategory || "أخرى" : category, region: region || null, city, district: district === "أخرى" ? customDistrict || null : district || null, coveredAreas, description, startingPrice: startingPrice || null, contactPhone, whatsapp, workingHours, portfolioImages, coverImage: coverImage || null, websiteUrl: websiteUrl || null }),
      });
      const data = await res.json() as { id?: number; message?: string };
      if (!res.ok) throw new Error(data.message ?? "حدث خطأ");
      navigate("/services");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <form onSubmit={(e) => void handleSubmit(e)} className="max-w-3xl mx-auto space-y-8 pb-16">
        <div className="bg-card p-8 rounded-3xl border border-border shadow-sm">
          <h1 className="text-3xl font-extrabold text-foreground mb-2">إضافة خدمة جديدة</h1>
          <p className="text-lg text-muted-foreground">أضف نشاطك التجاري لمنصة الخدمات العقارية لتصل إلى مئات العملاء يومياً.</p>
        </div>

        {error && (
          <div className="rounded-2xl border border-destructive bg-destructive/10 p-5 text-destructive font-semibold flex items-center gap-3 shadow-sm">
            <span className="text-2xl">⚠️</span> {error}
          </div>
        )}

        <Card className="border-border rounded-3xl premium-shadow overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border py-5 px-6">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wrench className="w-5 h-5 text-primary" />
              معلومات النشاط الأساسية
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <FieldGroup label="اسم النشاط / الشركة" required>
              <Input placeholder="مثال: شركة الإتقان للمقاولات العامة" value={businessName} onChange={e => setBusinessName(e.target.value)} className="h-12 rounded-xl text-base font-bold text-foreground" />
            </FieldGroup>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FieldGroup label="التصنيف الرئيسي" required>
                <select value={category} onChange={e => setCategory(e.target.value)} className="h-12 w-full rounded-xl border border-input bg-background px-4 text-base focus:ring-2 focus:ring-primary/20 outline-none" style={{ color: "#111827" }}>
                  <option value="">اختر التصنيف</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {category === "أخرى" && (
                  <Input
                    placeholder="اكتب نوع نشاطك..."
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    className="h-12 rounded-xl text-base mt-2"
                  />
                )}
              </FieldGroup>
              <FieldGroup label="المنطقة" required>
                <select
                  value={region}
                  onChange={e => { setRegion(e.target.value); setCity(""); setDistrict(""); }}
                  className="h-12 w-full rounded-xl border border-input bg-background px-4 text-base focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  <option value="">اختر المنطقة</option>
                  {SAUDI_REGIONS_LIST.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </FieldGroup>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FieldGroup label="المحافظة (المدينة)" required>
                <select
                  value={city}
                  onChange={e => { setCity(e.target.value); setDistrict(""); }}
                  disabled={!region}
                  className="h-12 w-full rounded-xl border border-input bg-background px-4 text-base focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-40"
                >
                  <option value="">{region ? "اختر المحافظة" : "— اختر المنطقة أولاً"}</option>
                  {getMuhafazat(region).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="الحي">
                {getAllAhyaaForCity(region, city).length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={district}
                      onChange={e => { setDistrict(e.target.value); if (e.target.value !== "أخرى") setCustomDistrict(""); }}
                      disabled={!city}
                      className="h-12 w-full rounded-xl border border-input bg-background px-4 text-base focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-40"
                      style={{ color: "#111827", background: "#fff" }}
                    >
                      <option value="" style={{ color: "#111827", background: "#fff" }}>{city ? "كل الأحياء" : "— اختر المحافظة أولاً"}</option>
                      {getAllAhyaaForCity(region, city).map(h => <option key={h} value={h} style={{ color: "#111827", background: "#fff" }}>{h}</option>)}
                      <option value="أخرى" style={{ color: "#111827", background: "#fff" }}>أخرى (غير مدرج)</option>
                    </select>
                    {district === "أخرى" && (
                      <Input
                        placeholder="اكتب اسم الحي…"
                        value={customDistrict}
                        onChange={e => setCustomDistrict(e.target.value)}
                        className="h-12 rounded-xl text-base"
                      />
                    )}
                  </div>
                ) : (
                  <Input
                    placeholder={city ? "اكتب اسم الحي" : "— اختر المحافظة أولاً"}
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    disabled={!city}
                    className="h-12 rounded-xl text-base disabled:opacity-40"
                  />
                )}
              </FieldGroup>
            </div>
            
            <FieldGroup label="المناطق والأحياء المغطاة">
              <div className="relative">
                <Map className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <Input placeholder="مثال: جميع أحياء شمال الرياض" value={coveredAreas} onChange={e => setCoveredAreas(e.target.value)} className="h-12 pr-12 rounded-xl text-base" />
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card className="border-border rounded-3xl premium-shadow overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border py-5 px-6">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              تفاصيل الخدمات المقدمة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <FieldGroup label="وصف الخدمات">
              <textarea 
                rows={5} 
                placeholder="اشرح بالتفصيل طبيعة الخدمات التي تقدمها، خبراتك، وأي ميزات تنافسية تمتلكها..." 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                className="w-full rounded-2xl border border-input bg-background p-4 text-base leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary/20" 
              />
            </FieldGroup>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-border">
              <FieldGroup label="الأسعار تبدأ من (ر.س)">
                <Input type="number" min="0" placeholder="مثال: 500" value={startingPrice} onChange={e => setStartingPrice(e.target.value)} className="h-12 rounded-xl text-base font-bold text-primary" />
              </FieldGroup>
              <FieldGroup label="أوقات العمل">
                <Input placeholder="مثال: من 8 صباحاً حتى 6 مساءً" value={workingHours} onChange={e => setWorkingHours(e.target.value)} className="h-12 rounded-xl text-base" />
              </FieldGroup>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-border rounded-3xl premium-shadow overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border py-5 px-6">
              <CardTitle className="text-lg flex items-center gap-2">
                <Contact className="w-5 h-5 text-primary" />
                معلومات التواصل
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <FieldGroup label="رقم الهاتف الأساسي">
                <Input type="tel" placeholder="05XXXXXXXX" value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="h-12 rounded-xl text-left font-mono text-lg tracking-wider" dir="ltr" />
              </FieldGroup>
              <FieldGroup label="رقم الواتساب">
                <Input type="tel" placeholder="9665XXXXXXXX" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="h-12 rounded-xl text-left font-mono text-lg tracking-wider" dir="ltr" />
              </FieldGroup>
              <FieldGroup label="رابط الموقع الإلكتروني">
                <div className="relative">
                  <Globe className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  <Input type="url" placeholder="https://www.example.com" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} className="h-12 rounded-xl text-left font-mono text-sm pr-12" dir="ltr" />
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card className="border-border rounded-3xl premium-shadow overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border py-5 px-6">
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                الصور والغلاف
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">صورة الغلاف (خلفية الملف الشخصي)</p>
                <ImageUploader
                  value={coverImage}
                  onChange={v => setCoverImage(v.split("\n")[0] ?? "")}
                  maxImages={1}
                  label="صورة الغلاف"
                />
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-sm font-semibold text-foreground mb-2">معرض الأعمال</p>
                <ImageUploader
                  value={portfolioImages}
                  onChange={setPortfolioImages}
                  maxImages={8}
                  label="معرض الأعمال"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sticky bottom-6 z-10 bg-card/90 backdrop-blur-md p-4 rounded-3xl border border-border shadow-2xl">
          <Button type="submit" disabled={saving} size="lg" className="flex-1 h-14 rounded-2xl text-lg font-bold gap-2 shadow-lg shadow-primary/30">
            {saving ? <><Loader2 className="w-5 h-5 animate-spin" />جارٍ التسجيل…</> : <><Save className="w-5 h-5" />تأكيد ونشر الخدمة</>}
          </Button>
          <Button type="button" variant="outline" size="lg" className="rounded-2xl h-14 sm:w-48 font-bold border-border bg-white" onClick={() => navigate("/services")}>
            إلغاء والعودة
          </Button>
        </div>
      </form>
    </Layout>
  );
}
