import { useState, useEffect, type FormEvent } from "react";
import { useParams, useLocation } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, Building, Map, Info, Grid2X2, FileText, Image as ImageIcon, Contact } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import type { Listing } from "@workspace/db";

const CITIES = ["الرياض", "جدة", "الدمام", "مكة المكرمة", "المدينة المنورة", "الخبر", "تبوك", "أبها", "الطائف", "بريدة"];
const PROPERTY_TYPES = ["شقة", "فيلا", "دور", "أرض", "عمارة", "مكتب", "محل", "مستودع", "مزرعة", "شاليه", "غرفة", "سكن عمالة", "عقار تجاري", "عقار صناعي", "مشروع تطويري"];
const LISTING_TYPES = [
  { value: "sale", label: "للبيع" },
  { value: "rent", label: "للإيجار" },
  { value: "daily_rent", label: "إيجار يومي" },
  { value: "monthly_rent", label: "إيجار شهري" },
  { value: "investment", label: "استثماري" },
  { value: "auction", label: "مزاد" },
];
const FURNISHING = ["مفروش", "غير مفروش", "نصف مفروش"];
const FACADES = ["شمالي", "جنوبي", "شرقي", "غربي", "شمالي شرقي", "شمالي غربي", "جنوبي شرقي", "جنوبي غربي"];

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

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 p-3 rounded-xl border border-border/60 hover:bg-muted/30 cursor-pointer transition-colors select-none">
      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${checked ? 'bg-primary border-primary' : 'bg-background border-input'}`}>
        {checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input type="checkbox" className="hidden" checked={checked} onChange={e => onChange(e.target.checked)} />
    </label>
  );
}

type PartialListing = Partial<Omit<Listing, "id" | "createdAt" | "updatedAt">>;

export default function ListingForm() {
  const { id } = useParams<{ id?: string }>();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<PartialListing>({
    status: "active", parking: false, elevator: false, garden: false, roof: false,
    pool: false, maidRoom: false, driverRoom: false, kitchen: false,
    airConditioning: false, electricityMeter: false, waterMeter: false,
  });

  const set = (key: keyof PartialListing, value: unknown) =>
    setForm(f => ({ ...f, [key]: value }));

  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
    if (!isEdit) return;
    const load = async () => {
      const res = await fetch(`/api/listings/${id}`, { credentials: "include" });
      if (res.ok) setForm(await res.json() as PartialListing);
      setLoading(false);
    };
    void load();
  }, [id, isAuthenticated, isEdit]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.title || !form.propertyType || !form.listingType || !form.city || !form.price) {
      setError("يرجى ملء الحقول الإلزامية: العنوان، النوع، الغرض، المدينة، السعر");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSaving(true);
    try {
      const url = isEdit ? `/api/listings/${id}` : "/api/listings";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method, credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { id?: number; message?: string };
      if (!res.ok) throw new Error(data.message ?? "حدث خطأ");
      navigate(`/listings/${data.id ?? id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground font-medium">جاري تحميل بيانات الإعلان...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <form onSubmit={(e) => void handleSubmit(e)} className="max-w-4xl mx-auto space-y-8 pb-16">
        <div className="bg-card p-8 rounded-3xl border border-border shadow-sm">
          <h1 className="text-3xl font-extrabold text-foreground mb-2">{isEdit ? "تعديل الإعلان" : "نشر إعلان عقاري جديد"}</h1>
          <p className="text-lg text-muted-foreground">أدخل تفاصيل العقار بدقة لجذب أكبر عدد من المهتمين والمشترين المحتملين.</p>
        </div>

        {error && (
          <div className="rounded-2xl border border-destructive bg-destructive/10 p-5 text-destructive font-semibold flex items-center gap-3 shadow-sm">
            <span className="text-2xl">⚠️</span> {error}
          </div>
        )}

        {/* Section 1: Basic Info */}
        <Card className="border-border rounded-3xl premium-shadow overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border py-5 px-6">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />
              المعلومات الأساسية
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <FieldGroup label="عنوان الإعلان" required>
              <Input placeholder="مثال: شقة فاخرة للبيع في حي الملقا بتشطيب مودرن" value={form.title ?? ""} onChange={e => set("title", e.target.value)} className="h-12 rounded-xl text-base" />
            </FieldGroup>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <FieldGroup label="نوع العقار" required>
                <select value={form.propertyType ?? ""} onChange={e => set("propertyType", e.target.value)} className="h-12 w-full rounded-xl border border-input bg-background px-4 text-base focus:ring-2 focus:ring-primary/20 outline-none">
                  <option value="">اختر النوع</option>
                  {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="الغرض" required>
                <select value={form.listingType ?? ""} onChange={e => set("listingType", e.target.value)} className="h-12 w-full rounded-xl border border-input bg-background px-4 text-base focus:ring-2 focus:ring-primary/20 outline-none">
                  <option value="">اختر الغرض</option>
                  {LISTING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="حالة الإعلان">
                <select value={form.status ?? "active"} onChange={e => set("status", e.target.value)} className="h-12 w-full rounded-xl border border-input bg-background px-4 text-base font-semibold focus:ring-2 focus:ring-primary/20 outline-none">
                  <option value="active">🟢 نشط</option>
                  <option value="sold">🔵 مُباع</option>
                  <option value="rented">🟣 مُؤجّر</option>
                  <option value="cancelled">🔴 ملغي</option>
                </select>
              </FieldGroup>
            </div>
          </CardContent>
        </Card>

        {/* Section: Location */}
        <Card className="border-border rounded-3xl premium-shadow overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border py-5 px-6">
            <CardTitle className="text-lg flex items-center gap-2">
              <Map className="w-5 h-5 text-primary" />
              الموقع والتسعير
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FieldGroup label="المدينة" required>
                <select value={form.city ?? ""} onChange={e => set("city", e.target.value)} className="h-12 w-full rounded-xl border border-input bg-background px-4 text-base focus:ring-2 focus:ring-primary/20 outline-none">
                  <option value="">اختر المدينة</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="الحي">
                <Input placeholder="مثال: حي الملقا" value={form.district ?? ""} onChange={e => set("district", e.target.value)} className="h-12 rounded-xl text-base" />
              </FieldGroup>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-border">
              <FieldGroup label="السعر (ريال سعودي)" required>
                <Input type="number" min="0" placeholder="0" value={form.price ?? ""} onChange={e => set("price", e.target.value)} className="h-12 rounded-xl text-base font-bold text-primary" />
              </FieldGroup>
              <FieldGroup label="المساحة (م²)">
                <Input type="number" min="0" placeholder="0" value={form.areaSqm ?? ""} onChange={e => set("areaSqm", e.target.value)} className="h-12 rounded-xl text-base" />
              </FieldGroup>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Property Details */}
        <Card className="border-border rounded-3xl premium-shadow overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border py-5 px-6">
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              مواصفات العقار
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              <FieldGroup label="غرف النوم">
                <Input type="number" min="0" placeholder="—" value={form.bedrooms ?? ""} onChange={e => set("bedrooms", e.target.value)} className="h-12 rounded-xl text-center text-lg font-medium" />
              </FieldGroup>
              <FieldGroup label="دورات المياه">
                <Input type="number" min="0" placeholder="—" value={form.bathrooms ?? ""} onChange={e => set("bathrooms", e.target.value)} className="h-12 rounded-xl text-center text-lg font-medium" />
              </FieldGroup>
              <FieldGroup label="غرف الجلوس">
                <Input type="number" min="0" placeholder="—" value={form.livingRooms ?? ""} onChange={e => set("livingRooms", e.target.value)} className="h-12 rounded-xl text-center text-lg font-medium" />
              </FieldGroup>
              <FieldGroup label="عمر العقار (سنة)">
                <Input type="number" min="0" placeholder="جديد = 0" value={form.propertyAge ?? ""} onChange={e => set("propertyAge", e.target.value)} className="h-12 rounded-xl text-center text-lg font-medium" />
              </FieldGroup>
              <FieldGroup label="رقم الطابق">
                <Input type="number" placeholder="—" value={form.floorNumber ?? ""} onChange={e => set("floorNumber", e.target.value)} className="h-12 rounded-xl text-center text-lg font-medium" />
              </FieldGroup>
              <FieldGroup label="إجمالي الطوابق">
                <Input type="number" min="1" placeholder="—" value={form.totalFloors ?? ""} onChange={e => set("totalFloors", e.target.value)} className="h-12 rounded-xl text-center text-lg font-medium" />
              </FieldGroup>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4 border-t border-border">
              <FieldGroup label="التأثيث">
                <select value={form.furnishingStatus ?? ""} onChange={e => set("furnishingStatus", e.target.value)} className="h-12 w-full rounded-xl border border-input bg-background px-4 focus:ring-2 focus:ring-primary/20 outline-none">
                  <option value="">غير محدد</option>
                  {FURNISHING.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="الواجهة">
                <select value={form.facade ?? ""} onChange={e => set("facade", e.target.value)} className="h-12 w-full rounded-xl border border-input bg-background px-4 focus:ring-2 focus:ring-primary/20 outline-none">
                  <option value="">غير محدد</option>
                  {FACADES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="عرض الشارع (م)">
                <Input type="number" min="0" placeholder="—" value={form.streetWidth ?? ""} onChange={e => set("streetWidth", e.target.value)} className="h-12 rounded-xl" />
              </FieldGroup>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Features */}
        <Card className="border-border rounded-3xl premium-shadow overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border py-5 px-6">
            <CardTitle className="text-lg flex items-center gap-2">
              <Grid2X2 className="w-5 h-5 text-primary" />
              المميزات والخدمات
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              <Checkbox label="موقف سيارات" checked={!!form.parking} onChange={v => set("parking", v)} />
              <Checkbox label="مصعد" checked={!!form.elevator} onChange={v => set("elevator", v)} />
              <Checkbox label="حديقة" checked={!!form.garden} onChange={v => set("garden", v)} />
              <Checkbox label="روف" checked={!!form.roof} onChange={v => set("roof", v)} />
              <Checkbox label="مسبح" checked={!!form.pool} onChange={v => set("pool", v)} />
              <Checkbox label="غرفة مربية" checked={!!form.maidRoom} onChange={v => set("maidRoom", v)} />
              <Checkbox label="غرفة سائق" checked={!!form.driverRoom} onChange={v => set("driverRoom", v)} />
              <Checkbox label="مطبخ" checked={!!form.kitchen} onChange={v => set("kitchen", v)} />
              <Checkbox label="تكييف مركزي" checked={!!form.airConditioning} onChange={v => set("airConditioning", v)} />
              <Checkbox label="عداد كهرباء" checked={!!form.electricityMeter} onChange={v => set("electricityMeter", v)} />
              <Checkbox label="عداد ماء" checked={!!form.waterMeter} onChange={v => set("waterMeter", v)} />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Section 5: Documents */}
          <Card className="border-border rounded-3xl premium-shadow overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border py-5 px-6">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                الوثائق والترخيص
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <FieldGroup label="رقم/حالة الصك">
                <Input placeholder="مثال: صك إلكتروني مستقل" value={form.deedStatus ?? ""} onChange={e => set("deedStatus", e.target.value)} className="h-12 rounded-xl" />
              </FieldGroup>
              <FieldGroup label="رقم رخصة فال (إن وجد)">
                <Input placeholder="مثال: 12000XXXXX" value={form.licenseStatus ?? ""} onChange={e => set("licenseStatus", e.target.value)} className="h-12 rounded-xl" />
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Section 8: Contact */}
          <Card className="border-border rounded-3xl premium-shadow overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border py-5 px-6">
              <CardTitle className="text-lg flex items-center gap-2">
                <Contact className="w-5 h-5 text-primary" />
                معلومات التواصل
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <FieldGroup label="رقم الهاتف للإتصال">
                <Input type="tel" placeholder="05XXXXXXXX" value={form.contactPhone ?? ""} onChange={e => set("contactPhone", e.target.value)} className="h-12 rounded-xl font-mono text-left" dir="ltr" />
              </FieldGroup>
              <FieldGroup label="رقم الواتساب">
                <Input type="tel" placeholder="9665XXXXXXXX" value={form.whatsapp ?? ""} onChange={e => set("whatsapp", e.target.value)} className="h-12 rounded-xl font-mono text-left" dir="ltr" />
              </FieldGroup>
            </CardContent>
          </Card>
        </div>

        {/* Section 7: Description */}
        <Card className="border-border rounded-3xl premium-shadow overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border py-5 px-6">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              الوصف التفصيلي
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <textarea
              rows={6}
              placeholder="اكتب وصفاً جذاباً وتفصيلياً للعقار يوضح أهم معالمه وموقعه الاستراتيجي والخدمات القريبة منه..."
              value={form.description ?? ""}
              onChange={e => set("description", e.target.value)}
              className="w-full rounded-2xl border border-input bg-background p-5 text-base leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </CardContent>
        </Card>

        {/* Section 6: Media */}
        <Card className="border-border rounded-3xl premium-shadow overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border py-5 px-6">
            <CardTitle className="text-lg flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              الصور
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <FieldGroup label="روابط الصور المباشرة (رابط واحد في كل سطر)">
              <textarea
                rows={5}
                placeholder={"https://example.com/image1.jpg\nhttps://example.com/image2.jpg"}
                value={form.images ?? ""}
                onChange={e => set("images", e.target.value)}
                className="w-full rounded-2xl border border-input bg-background p-5 text-sm font-mono leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 text-left"
                dir="ltr"
              />
            </FieldGroup>
            <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
              <Info className="w-4 h-4"/> ضع كل رابط في سطر منفصل. الصورة الأولى ستكون الصورة الرئيسية للإعلان.
            </p>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row gap-4 sticky bottom-6 z-10 bg-card/80 backdrop-blur-md p-4 rounded-3xl border border-border shadow-2xl">
          <Button type="submit" disabled={saving} size="lg" className="flex-1 h-14 rounded-2xl text-lg font-bold gap-2 shadow-lg shadow-primary/30">
            {saving ? <><Loader2 className="w-5 h-5 animate-spin" />جارٍ الحفظ…</> : <><Save className="w-5 h-5" />{isEdit ? "حفظ وتحديث الإعلان" : "نشر الإعلان الآن"}</>}
          </Button>
          <Button type="button" variant="outline" size="lg" className="rounded-2xl h-14 sm:w-48 font-bold border-border bg-white" onClick={() => navigate(isEdit ? `/listings/${id}` : "/listings")}>
            إلغاء والعودة
          </Button>
        </div>
      </form>
    </Layout>
  );
}
