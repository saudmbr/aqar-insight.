import { useState, useEffect, type FormEvent } from "react";
import { useParams, useLocation } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
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
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-destructive ml-1">*</span>}</Label>
      {children}
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-input accent-primary" />
      {label}
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
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Layout><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;
  }

  return (
    <Layout>
      <form onSubmit={(e) => void handleSubmit(e)} className="max-w-3xl mx-auto space-y-6 pb-10">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{isEdit ? "تعديل الإعلان" : "نشر إعلان جديد"}</h1>
          <p className="text-muted-foreground mt-1">أدخل تفاصيل العقار بدقة لجذب أكبر عدد من المهتمين</p>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">⚠ {error}</div>
        )}

        {/* Section 1: Basic Info */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">المعلومات الأساسية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldGroup label="عنوان الإعلان" required>
              <Input placeholder="مثال: شقة للبيع في حي الملقا - الرياض" value={form.title ?? ""} onChange={e => set("title", e.target.value)} className="h-10 rounded-xl" />
            </FieldGroup>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FieldGroup label="نوع العقار" required>
                <select value={form.propertyType ?? ""} onChange={e => set("propertyType", e.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm">
                  <option value="">اختر النوع</option>
                  {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="الغرض" required>
                <select value={form.listingType ?? ""} onChange={e => set("listingType", e.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm">
                  <option value="">اختر الغرض</option>
                  {LISTING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="حالة الإعلان">
                <select value={form.status ?? "active"} onChange={e => set("status", e.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm">
                  <option value="active">نشط</option>
                  <option value="sold">مُباع</option>
                  <option value="rented">مُؤجّر</option>
                  <option value="cancelled">ملغي</option>
                </select>
              </FieldGroup>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldGroup label="المدينة" required>
                <select value={form.city ?? ""} onChange={e => set("city", e.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm">
                  <option value="">اختر المدينة</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="الحي">
                <Input placeholder="مثال: حي الملقا" value={form.district ?? ""} onChange={e => set("district", e.target.value)} className="h-10 rounded-xl" />
              </FieldGroup>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Pricing */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">التسعير والمساحة</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldGroup label="السعر (ريال سعودي)" required>
              <Input type="number" min="0" placeholder="0" value={form.price ?? ""} onChange={e => set("price", e.target.value)} className="h-10 rounded-xl" />
            </FieldGroup>
            <FieldGroup label="المساحة (م²)">
              <Input type="number" min="0" placeholder="0" value={form.areaSqm ?? ""} onChange={e => set("areaSqm", e.target.value)} className="h-10 rounded-xl" />
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Section 3: Property Details */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">تفاصيل العقار</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <FieldGroup label="غرف النوم">
                <Input type="number" min="0" placeholder="—" value={form.bedrooms ?? ""} onChange={e => set("bedrooms", e.target.value)} className="h-10 rounded-xl" />
              </FieldGroup>
              <FieldGroup label="دورات المياه">
                <Input type="number" min="0" placeholder="—" value={form.bathrooms ?? ""} onChange={e => set("bathrooms", e.target.value)} className="h-10 rounded-xl" />
              </FieldGroup>
              <FieldGroup label="غرف الجلوس">
                <Input type="number" min="0" placeholder="—" value={form.livingRooms ?? ""} onChange={e => set("livingRooms", e.target.value)} className="h-10 rounded-xl" />
              </FieldGroup>
              <FieldGroup label="عمر العقار (سنة)">
                <Input type="number" min="0" placeholder="—" value={form.propertyAge ?? ""} onChange={e => set("propertyAge", e.target.value)} className="h-10 rounded-xl" />
              </FieldGroup>
              <FieldGroup label="رقم الطابق">
                <Input type="number" placeholder="—" value={form.floorNumber ?? ""} onChange={e => set("floorNumber", e.target.value)} className="h-10 rounded-xl" />
              </FieldGroup>
              <FieldGroup label="إجمالي الطوابق">
                <Input type="number" min="1" placeholder="—" value={form.totalFloors ?? ""} onChange={e => set("totalFloors", e.target.value)} className="h-10 rounded-xl" />
              </FieldGroup>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FieldGroup label="التأثيث">
                <select value={form.furnishingStatus ?? ""} onChange={e => set("furnishingStatus", e.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm">
                  <option value="">غير محدد</option>
                  {FURNISHING.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="الواجهة">
                <select value={form.facade ?? ""} onChange={e => set("facade", e.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm">
                  <option value="">غير محدد</option>
                  {FACADES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="عرض الشارع (م)">
                <Input type="number" min="0" placeholder="—" value={form.streetWidth ?? ""} onChange={e => set("streetWidth", e.target.value)} className="h-10 rounded-xl" />
              </FieldGroup>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Features */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">المميزات والخدمات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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

        {/* Section 5: Documents */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">الوثائق والترخيص</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldGroup label="حالة الصك">
              <Input placeholder="مثال: صك إلكتروني" value={form.deedStatus ?? ""} onChange={e => set("deedStatus", e.target.value)} className="h-10 rounded-xl" />
            </FieldGroup>
            <FieldGroup label="حالة الترخيص">
              <Input placeholder="مثال: مرخّص" value={form.licenseStatus ?? ""} onChange={e => set("licenseStatus", e.target.value)} className="h-10 rounded-xl" />
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Section 6: Media */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">الصور</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup label="روابط الصور (رابط واحد في كل سطر)">
              <textarea
                rows={4}
                placeholder={"https://example.com/image1.jpg\nhttps://example.com/image2.jpg"}
                value={form.images ?? ""}
                onChange={e => set("images", e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                dir="ltr"
              />
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Section 7: Description */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">وصف العقار</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              rows={5}
              placeholder="اكتب وصفاً تفصيلياً للعقار…"
              value={form.description ?? ""}
              onChange={e => set("description", e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </CardContent>
        </Card>

        {/* Section 8: Contact */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">معلومات التواصل</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldGroup label="رقم الهاتف">
              <Input type="tel" placeholder="05XXXXXXXX" value={form.contactPhone ?? ""} onChange={e => set("contactPhone", e.target.value)} className="h-10 rounded-xl" dir="ltr" />
            </FieldGroup>
            <FieldGroup label="رقم واتساب">
              <Input type="tel" placeholder="966XXXXXXXXX" value={form.whatsapp ?? ""} onChange={e => set("whatsapp", e.target.value)} className="h-10 rounded-xl" dir="ltr" />
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="flex-1 h-11 rounded-xl text-base gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />جارٍ الحفظ…</> : <><Save className="w-4 h-4" />{isEdit ? "حفظ التعديلات" : "نشر الإعلان"}</>}
          </Button>
          <Button type="button" variant="outline" className="rounded-xl h-11" onClick={() => navigate(isEdit ? `/listings/${id}` : "/listings")}>
            إلغاء
          </Button>
        </div>
      </form>
    </Layout>
  );
}
