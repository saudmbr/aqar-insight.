import { getMuhafazat, getMarakiz, getAhyaa, SAUDI_REGIONS_LIST } from "@/lib/saudi-geo";
import { PROPERTY_TYPE_GROUPS } from "@/lib/property-types";
import { useState, useEffect, lazy, Suspense, type FormEvent } from "react";
import { useParams, useLocation } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, Building, Map, Info, Grid2X2, FileText, Image as ImageIcon, Contact, Zap } from "lucide-react";
import { ImageUploader } from "@/components/image-uploader";
import { VideoUploader } from "@/components/video-uploader";
import { useAuth } from "@/contexts/auth-context";
import type { Listing } from "@workspace/db";
import type { LocationValue } from "@/components/location-picker";

const LocationPicker = lazy(() => import("@/components/location-picker"));


const LISTING_TYPES = [
  { value: "sale", label: "للبيع" },
  { value: "rent", label: "للإيجار" },
  { value: "monthly_rent", label: "إيجار شهري" },
  { value: "investment", label: "استثماري" },
  { value: "auction", label: "مزاد" },
];
const LISTING_PURPOSES = ["سكني", "تجاري", "صناعي", "زراعي", "استثماري"];
const FURNISHING = ["مفروش", "غير مفروش", "نصف مفروش"];
const DEED_PRESETS = ["صك إلكتروني مستقل", "صك ورقي", "صك مشترك", "تحت الإفراز", "قيد التسجيل", "وقف"];
const FACADES = [
  "شمالي", "جنوبي", "شرقي", "غربي",
  "شمالي شرقي", "شمالي غربي", "جنوبي شرقي", "جنوبي غربي",
  "شمالي وجنوبي", "شرقي وغربي",
  "شمالي وشرقي وجنوبي", "شمالي وغربي وجنوبي",
  "شمالي وشرقي وغربي", "جنوبي وشرقي وغربي",
  "ثلاث واجهات", "أربع واجهات",
];
const BUILDING_QUALITY = ["فاخر", "ممتاز", "جيد", "متوسط", "يحتاج تجديد"];
const FINISHING = ["كامل التشطيب", "شبه مشطّب", "هيكل", "مشطّب فاخر"];

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
      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${checked ? "bg-primary border-primary" : "bg-background border-input"}`}>
        {checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input type="checkbox" className="hidden" checked={checked} onChange={e => onChange(e.target.checked)} />
    </label>
  );
}

function SSelect({ value, onChange, children, className }: { value: string; onChange: (v: string) => void; children: React.ReactNode; className?: string }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`h-12 w-full rounded-xl border border-input bg-background px-4 text-base focus:ring-2 focus:ring-primary/20 outline-none ${className ?? ""}`}
    >
      {children}
    </select>
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
  const [deedOtherMode, setDeedOtherMode] = useState(false);
  const [locationValue, setLocationValue] = useState<LocationValue | null>(null);

  const [form, setForm] = useState<PartialListing>({
    status: "active",
    parking: false, elevator: false, garden: false, roof: false,
    pool: false, maidRoom: false, driverRoom: false, kitchen: false,
    airConditioning: false, electricityMeter: false, waterMeter: false,
    storageRoom: false, balcony: false, basement: false,
    smartHome: false, securitySystem: false, internet: false, sewage: false,
    mortgageEligibility: false, negotiable: false,
    nearbySchools: false, nearbyHospitals: false, nearbyMosques: false,
    nearbyMalls: false, nearbyTransport: false, nearbyParks: false, nearbyMainRoads: false,
    urgent: false, exclusive: false, ownerDirect: false,
  });

  const set = (key: keyof PartialListing, value: unknown) => setForm(f => ({ ...f, [key]: value }));

  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
    if (!isEdit) return;
    const load = async () => {
      const res = await fetch(`/api/listings/${id}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json() as PartialListing;
        setForm(data);
        if (data.deedStatus && !DEED_PRESETS.includes(data.deedStatus)) setDeedOtherMode(true);
        if (data.latitude != null && data.longitude != null) {
          setLocationValue({
            lat: data.latitude as number,
            lng: data.longitude as number,
            city: data.city ?? undefined,
            district: data.district ?? undefined,
          });
        }
      }
      setLoading(false);
    };
    void load();
  }, [id, isAuthenticated, isEdit]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.title || !form.propertyType || !form.listingType || !form.city || !form.price) {
      setError("يرجى ملء الحقول الإلزامية: العنوان، نوع العقار، الغرض، المحافظة، السعر");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSaving(true);
    try {
      const url = isEdit ? `/api/listings/${id}` : "/api/listings";
      const method = isEdit ? "PUT" : "POST";
      const payload = {
        ...form,
        ...(locationValue
          ? { latitude: locationValue.lat, longitude: locationValue.lng }
          : { latitude: null, longitude: null }),
      };
      const res = await fetch(url, {
        method, credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { id?: number; message?: string };
      if (!res.ok) throw new Error(data.message ?? "حدث خطأ");
      navigate(`/listings/${data.id ?? id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
      window.scrollTo({ top: 0, behavior: "smooth" });
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
      <form onSubmit={(e) => void handleSubmit(e)} className="max-w-4xl mx-auto space-y-8 pb-24">
        {/* Page header */}
        <div className="bg-card p-8 rounded-3xl border border-border shadow-sm">
          <h1 className="text-3xl font-extrabold text-foreground mb-2">
            {isEdit ? "تعديل الإعلان" : "نشر إعلان عقاري جديد"}
          </h1>
          <p className="text-lg text-muted-foreground">أدخل تفاصيل العقار بدقة لجذب أكبر عدد من المهتمين والمشترين المحتملين.</p>
        </div>

        {error && (
          <div className="rounded-2xl border border-destructive bg-destructive/10 p-5 text-destructive font-semibold flex items-center gap-3">
            <span className="text-2xl">⚠️</span> {error}
          </div>
        )}

        {/* ── Section 1: Core Info ─────────────────────────────── */}
        <Card className="border-border rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border py-5 px-6">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />المعلومات الأساسية
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <FieldGroup label="عنوان الإعلان" required>
              <Input
                placeholder="مثال: فيلا فاخرة للبيع في حي الياسمين مع مسبح"
                value={form.title ?? ""}
                onChange={e => set("title", e.target.value)}
                className="h-12 rounded-xl text-base"
              />
            </FieldGroup>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <FieldGroup label="نوع العقار" required>
                <SSelect value={form.propertyType ?? ""} onChange={v => set("propertyType", v)}>
                  <option value="">اختر نوع العقار</option>
                  {PROPERTY_TYPE_GROUPS.map(group => (
                    <optgroup key={group.label} label={`── ${group.label}`}>
                      {group.types.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </optgroup>
                  ))}
                </SSelect>
              </FieldGroup>
              <FieldGroup label="نوع الإعلان" required>
                <SSelect value={form.listingType ?? ""} onChange={v => set("listingType", v)}>
                  <option value="">اختر</option>
                  {LISTING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </SSelect>
              </FieldGroup>
              <FieldGroup label="الغرض">
                <SSelect value={form.listingPurpose ?? ""} onChange={v => set("listingPurpose", v)}>
                  <option value="">اختر</option>
                  {LISTING_PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                </SSelect>
              </FieldGroup>
              <FieldGroup label="حالة الإعلان">
                <SSelect value={form.status ?? "active"} onChange={v => set("status", v)}>
                  <option value="active">🟢 نشط</option>
                  <option value="sold">🔵 مُباع</option>
                  <option value="rented">🟣 مُؤجّر</option>
                  <option value="cancelled">🔴 ملغي</option>
                </SSelect>
              </FieldGroup>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <FieldGroup label="تاريخ الإتاحة">
                <Input
                  type="date"
                  value={form.availabilityDate ?? ""}
                  onChange={e => set("availabilityDate", e.target.value)}
                  className="h-12 rounded-xl"
                  dir="ltr"
                />
              </FieldGroup>
            </div>
          </CardContent>
        </Card>

        {/* ── Section 2: Location & Price ─────────────────────── */}
        <Card className="border-border rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border py-5 px-6">
            <CardTitle className="text-lg flex items-center gap-2">
              <Map className="w-5 h-5 text-primary" />الموقع والتسعير
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* 4-level geo cascade: منطقة → محافظة → مركز → حي */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* منطقة */}
              <FieldGroup label="المنطقة">
                <SSelect value={form.region ?? ""} onChange={v => {
                  set("region", v);
                  set("city", "");
                  set("markaz", "");
                  set("district", "");
                }}>
                  <option value="">اختر المنطقة</option>
                  {SAUDI_REGIONS_LIST.map(r => <option key={r} value={r}>{r}</option>)}
                </SSelect>
              </FieldGroup>

              {/* محافظة */}
              <FieldGroup label="المحافظة" required>
                <SSelect value={form.city ?? ""} onChange={v => {
                  set("city", v);
                  set("markaz", "");
                  set("district", "");
                  if (locationValue && !locationValue.city) {
                    setLocationValue(lv => lv ? { ...lv, city: v } : lv);
                  }
                }}>
                  <option value="">
                    {form.region ? "اختر المحافظة" : "اختر المنطقة أولاً"}
                  </option>
                  {getMuhafazat(form.region ?? "").map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </SSelect>
              </FieldGroup>

              {/* مركز */}
              <FieldGroup label="المركز">
                <SSelect value={form.markaz ?? ""} onChange={v => {
                  set("markaz", v);
                  set("district", "");
                }}>
                  <option value="">
                    {!form.city ? "اختر المحافظة أولاً" : "اختر المركز (اختياري)"}
                  </option>
                  {getMarakiz(form.region ?? "", form.city ?? "").map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </SSelect>
              </FieldGroup>

              {/* حي */}
              <FieldGroup label="الحي">
                {getAhyaa(form.region ?? "", form.city ?? "", form.markaz ?? "").length > 0 ? (
                  <SSelect value={form.district ?? ""} onChange={v => set("district", v)}>
                    <option value="">اختر الحي (اختياري)</option>
                    {getAhyaa(form.region ?? "", form.city ?? "", form.markaz ?? "").map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </SSelect>
                ) : (
                  <Input
                    placeholder="مثال: حي الملقا"
                    value={form.district ?? ""}
                    onChange={e => set("district", e.target.value)}
                    className="h-12 rounded-xl"
                  />
                )}
                <p className="text-xs text-primary/80 mt-1.5 flex items-center gap-1">
                  <span>📍</span>
                  <span>تعبئة الحي ضرورية لظهور إعلانك في تحليلات الأحياء ومقارنة الأسعار</span>
                </p>
              </FieldGroup>
            </div>

            {/* Map location picker */}
            <FieldGroup label="تحديد الموقع على الخريطة">
              <Suspense fallback={
                <div className="flex items-center justify-center h-32 rounded-2xl border border-border bg-muted/30">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              }>
                <LocationPicker
                  value={locationValue}
                  defaultCity={form.city ?? undefined}
                  onChange={(v) => {
                    setLocationValue(v);
                    if (v?.city && !form.city) set("city", v.city);
                    if (v?.district && !form.district) set("district", v.district);
                  }}
                />
              </Suspense>
            </FieldGroup>

            <FieldGroup label="الموقع التفصيلي (اختياري)">
              <Input
                placeholder="مثال: طريق الملك عبدالله، أمام مجمع..."
                value={form.location ?? ""}
                onChange={e => set("location", e.target.value)}
                className="h-12 rounded-xl"
              />
            </FieldGroup>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-border">
              <FieldGroup label="السعر (ريال سعودي)" required>
                <Input type="number" min="0" placeholder="0" value={form.price ?? ""} onChange={e => set("price", e.target.value)} className="h-12 rounded-xl text-base font-bold text-primary" />
              </FieldGroup>
              <FieldGroup label="المساحة (م²)">
                <Input type="number" min="0" placeholder="0" value={form.areaSqm ?? ""} onChange={e => set("areaSqm", e.target.value)} className="h-12 rounded-xl" />
              </FieldGroup>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
              <div className="h-12 flex items-center">
                <Checkbox label="قابل للتفاوض" checked={!!form.negotiable} onChange={v => set("negotiable", v)} />
              </div>
              <div className="h-12 flex items-center">
                <Checkbox label="مؤهل للتمويل العقاري" checked={!!form.mortgageEligibility} onChange={v => set("mortgageEligibility", v)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Section 3: Property Specs ────────────────────────── */}
        <Card className="border-border rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border py-5 px-6">
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />مواصفات العقار
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              {[
                { label: "غرف النوم", key: "bedrooms" as const },
                { label: "دورات المياه", key: "bathrooms" as const },
                { label: "غرف الجلوس", key: "livingRooms" as const },
                { label: "المطابخ", key: "kitchens" as const },
                { label: "عمر العقار (سنة)", key: "propertyAge" as const },
                { label: "رقم الطابق", key: "floorNumber" as const },
                { label: "إجمالي الطوابق", key: "totalFloors" as const },
                { label: "عدد الشوارع", key: "numberOfStreets" as const },
              ].map(({ label, key }) => (
                <FieldGroup key={key} label={label}>
                  <Input type="number" min="0" placeholder="—" value={form[key] ?? ""} onChange={e => set(key, e.target.value)} className="h-12 rounded-xl text-center text-lg font-medium" />
                </FieldGroup>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 pt-4 border-t border-border">
              <FieldGroup label="التأثيث">
                <SSelect value={form.furnishingStatus ?? ""} onChange={v => set("furnishingStatus", v)}>
                  <option value="">غير محدد</option>
                  {FURNISHING.map(f => <option key={f} value={f}>{f}</option>)}
                </SSelect>
              </FieldGroup>
              <FieldGroup label="الواجهة">
                <SSelect value={form.facade ?? ""} onChange={v => set("facade", v)}>
                  <option value="">غير محدد</option>
                  {FACADES.map(f => <option key={f} value={f}>{f}</option>)}
                </SSelect>
              </FieldGroup>
              <FieldGroup label="جودة البناء">
                <SSelect value={form.buildingQuality ?? ""} onChange={v => set("buildingQuality", v)}>
                  <option value="">غير محدد</option>
                  {BUILDING_QUALITY.map(q => <option key={q} value={q}>{q}</option>)}
                </SSelect>
              </FieldGroup>
              <FieldGroup label="نوع التشطيب">
                <SSelect value={form.finishingType ?? ""} onChange={v => set("finishingType", v)}>
                  <option value="">غير محدد</option>
                  {FINISHING.map(f => <option key={f} value={f}>{f}</option>)}
                </SSelect>
              </FieldGroup>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-border">
              <FieldGroup label="عرض الشارع (م)">
                <Input type="number" min="0" placeholder="—" value={form.streetWidth ?? ""} onChange={e => set("streetWidth", e.target.value)} className="h-12 rounded-xl" />
              </FieldGroup>
              <div />
            </div>
          </CardContent>
        </Card>

        {/* ── Section 4: Amenities ─────────────────────────────── */}
        <Card className="border-border rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border py-5 px-6">
            <CardTitle className="text-lg flex items-center gap-2">
              <Grid2X2 className="w-5 h-5 text-primary" />المميزات والخدمات
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <p className="text-sm text-muted-foreground font-medium">المرافق الأساسية</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              <Checkbox label="موقف سيارات" checked={!!form.parking} onChange={v => set("parking", v)} />
              <Checkbox label="مصعد" checked={!!form.elevator} onChange={v => set("elevator", v)} />
              <Checkbox label="حديقة" checked={!!form.garden} onChange={v => set("garden", v)} />
              <Checkbox label="روف" checked={!!form.roof} onChange={v => set("roof", v)} />
              <Checkbox label="مسبح" checked={!!form.pool} onChange={v => set("pool", v)} />
              <Checkbox label="مجلس / استقبال" checked={!!form.majlis} onChange={v => set("majlis", v)} />
              <Checkbox label="غرفة مربية" checked={!!form.maidRoom} onChange={v => set("maidRoom", v)} />
              <Checkbox label="غرفة سائق" checked={!!form.driverRoom} onChange={v => set("driverRoom", v)} />
              <Checkbox label="مطبخ" checked={!!form.kitchen} onChange={v => set("kitchen", v)} />
              <Checkbox label="تكييف مركزي" checked={!!form.airConditioning} onChange={v => set("airConditioning", v)} />
              <Checkbox label="تدفئة مركزية" checked={!!form.heating} onChange={v => set("heating", v)} />
              <Checkbox label="بلكونة / شرفة" checked={!!form.balcony} onChange={v => set("balcony", v)} />
              <Checkbox label="غرفة تخزين" checked={!!form.storageRoom} onChange={v => set("storageRoom", v)} />
              <Checkbox label="قبو / بدروم" checked={!!form.basement} onChange={v => set("basement", v)} />
              <Checkbox label="ملحق خارجي" checked={!!form.annex} onChange={v => set("annex", v)} />
              <Checkbox label="غرفة ملابس" checked={!!form.wardrobeRoom} onChange={v => set("wardrobeRoom", v)} />
              <Checkbox label="غرفة صلاة / مصلى" checked={!!form.prayerRoom} onChange={v => set("prayerRoom", v)} />
              <Checkbox label="صالة رياضية / جيم" checked={!!form.gym} onChange={v => set("gym", v)} />
              <Checkbox label="جاكوزي / بانيو" checked={!!form.jacuzzi} onChange={v => set("jacuzzi", v)} />
              <Checkbox label="سخان شمسي" checked={!!form.solarHeater} onChange={v => set("solarHeater", v)} />
            </div>
            <p className="text-sm text-muted-foreground font-medium pt-2 border-t border-border">البنية التحتية</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              <Checkbox label="عداد كهرباء" checked={!!form.electricityMeter} onChange={v => set("electricityMeter", v)} />
              <Checkbox label="عداد ماء" checked={!!form.waterMeter} onChange={v => set("waterMeter", v)} />
              <Checkbox label="شبكة صرف صحي" checked={!!form.sewage} onChange={v => set("sewage", v)} />
              <Checkbox label="إنترنت / ألياف بصري" checked={!!form.internet} onChange={v => set("internet", v)} />
              <Checkbox label="غاز طبيعي" checked={!!form.naturalGas} onChange={v => set("naturalGas", v)} />
              <Checkbox label="خزان مياه" checked={!!form.waterTank} onChange={v => set("waterTank", v)} />
              <Checkbox label="فلتر / تحلية مياه" checked={!!form.waterFilter} onChange={v => set("waterFilter", v)} />
              <Checkbox label="مولد كهرباء" checked={!!form.generator} onChange={v => set("generator", v)} />
              <Checkbox label="طاقة شمسية" checked={!!form.solarEnergy} onChange={v => set("solarEnergy", v)} />
              <Checkbox label="منزل ذكي" checked={!!form.smartHome} onChange={v => set("smartHome", v)} />
              <Checkbox label="كاميرات مراقبة / نظام أمني" checked={!!form.securitySystem} onChange={v => set("securitySystem", v)} />
            </div>
            <p className="text-sm text-muted-foreground font-medium pt-2 border-t border-border">المرافق القريبة</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              <Checkbox label="مدارس" checked={!!form.nearbySchools} onChange={v => set("nearbySchools", v)} />
              <Checkbox label="جامعات / كليات" checked={!!form.nearbyUniversities} onChange={v => set("nearbyUniversities", v)} />
              <Checkbox label="حضانات / رياض أطفال" checked={!!form.nearbyNurseries} onChange={v => set("nearbyNurseries", v)} />
              <Checkbox label="مستشفيات / مراكز صحية" checked={!!form.nearbyHospitals} onChange={v => set("nearbyHospitals", v)} />
              <Checkbox label="صيدليات" checked={!!form.nearbyPharmacies} onChange={v => set("nearbyPharmacies", v)} />
              <Checkbox label="مساجد" checked={!!form.nearbyMosques} onChange={v => set("nearbyMosques", v)} />
              <Checkbox label="مراكز تجارية / أسواق" checked={!!form.nearbyMalls} onChange={v => set("nearbyMalls", v)} />
              <Checkbox label="مطاعم" checked={!!form.nearbyRestaurants} onChange={v => set("nearbyRestaurants", v)} />
              <Checkbox label="بنوك / صرافات" checked={!!form.nearbyBanks} onChange={v => set("nearbyBanks", v)} />
              <Checkbox label="مواصلات عامة" checked={!!form.nearbyTransport} onChange={v => set("nearbyTransport", v)} />
              <Checkbox label="حدائق عامة" checked={!!form.nearbyParks} onChange={v => set("nearbyParks", v)} />
              <Checkbox label="ملاعب رياضية" checked={!!form.nearbySports} onChange={v => set("nearbySports", v)} />
              <Checkbox label="محطة وقود" checked={!!form.nearbyGasStation} onChange={v => set("nearbyGasStation", v)} />
              <Checkbox label="طرق رئيسية" checked={!!form.nearbyMainRoads} onChange={v => set("nearbyMainRoads", v)} />
            </div>
          </CardContent>
        </Card>

        {/* ── Section 5: Marketing flags ───────────────────────── */}
        <Card className="border-border rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border py-5 px-6">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />خيارات تسويقية
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Checkbox label="⚡ عرض عاجل" checked={!!form.urgent} onChange={v => set("urgent", v)} />
              <Checkbox label="⭐ حصري" checked={!!form.exclusive} onChange={v => set("exclusive", v)} />
              <Checkbox label="🤝 من المالك مباشرة" checked={!!form.ownerDirect} onChange={v => set("ownerDirect", v)} />
              <Checkbox label="🥽 جولة افتراضية VR" checked={!!form.virtualTour} onChange={v => set("virtualTour", v)} />
            </div>
          </CardContent>
        </Card>

        {/* ── Documents + Contact side by side ─────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-border rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border py-5 px-6">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />الوثائق والترخيص
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <FieldGroup label="حالة الصك">
                <div className="flex flex-wrap gap-2">
                  {DEED_PRESETS.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => { set("deedStatus", opt); setDeedOtherMode(false); }}
                      className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors ${
                        form.deedStatus === opt && !deedOtherMode
                          ? "bg-primary text-white border-primary"
                          : "bg-background border-input text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => { setDeedOtherMode(true); set("deedStatus", ""); }}
                    className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors ${
                      deedOtherMode
                        ? "bg-primary text-white border-primary"
                        : "bg-background border-input text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    }`}
                  >
                    أخرى...
                  </button>
                </div>
                {deedOtherMode && (
                  <Input
                    placeholder="اكتب حالة الصك..."
                    value={form.deedStatus ?? ""}
                    onChange={e => set("deedStatus", e.target.value)}
                    className="h-12 rounded-xl mt-3"
                    autoFocus
                  />
                )}
              </FieldGroup>
              <FieldGroup label="رقم رخصة فال">
                <Input placeholder="مثال: 12000XXXXX" value={form.licenseStatus ?? ""} onChange={e => set("licenseStatus", e.target.value)} className="h-12 rounded-xl font-mono" dir="ltr" />
              </FieldGroup>
            </CardContent>
          </Card>

          <Card className="border-border rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border py-5 px-6">
              <CardTitle className="text-lg flex items-center gap-2">
                <Contact className="w-5 h-5 text-primary" />معلومات التواصل
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <FieldGroup label="رقم الهاتف">
                <Input type="tel" placeholder="05XXXXXXXX" value={form.contactPhone ?? ""} onChange={e => set("contactPhone", e.target.value)} className="h-12 rounded-xl font-mono text-left" dir="ltr" />
              </FieldGroup>
              <FieldGroup label="رقم الواتساب">
                <Input type="tel" placeholder="9665XXXXXXXX" value={form.whatsapp ?? ""} onChange={e => set("whatsapp", e.target.value)} className="h-12 rounded-xl font-mono text-left" dir="ltr" />
              </FieldGroup>
            </CardContent>
          </Card>
        </div>

        {/* ── Description ──────────────────────────────────────── */}
        <Card className="border-border rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border py-5 px-6">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />الوصف التفصيلي
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <textarea
              rows={7}
              placeholder="اكتب وصفاً جذاباً للعقار يوضح أهم معالمه وموقعه وما يميزه..."
              value={form.description ?? ""}
              onChange={e => set("description", e.target.value)}
              className="w-full rounded-2xl border border-input bg-background p-5 text-base leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </CardContent>
        </Card>

        {/* ── Media ────────────────────────────────────────────── */}
        <Card className="border-border rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border py-5 px-6">
            <CardTitle className="text-lg flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />الصور والميديا
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <ImageUploader
              value={form.images ?? ""}
              onChange={v => set("images", v)}
              maxImages={10}
            />
            <div className="pt-2 border-t border-border space-y-3">
              <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                فيديو العقار (رفع مباشر أو رابط يوتيوب / Vimeo)
              </p>
              <VideoUploader
                value={form.videoUrl ?? ""}
                onChange={v => set("videoUrl", v)}
              />
            </div>
            <div className="pt-2 border-t border-border">
              <FieldGroup label="رابط المخطط الهندسي">
                <Input type="url" placeholder="https://example.com/floor-plan.jpg" value={form.floorPlan ?? ""} onChange={e => set("floorPlan", e.target.value)} className="h-12 rounded-xl font-mono text-sm" dir="ltr" />
              </FieldGroup>
            </div>
          </CardContent>
        </Card>

        {/* ── Sticky submit ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-4 sticky bottom-6 z-10 bg-card/80 backdrop-blur-md p-4 rounded-3xl border border-border shadow-2xl">
          <Button type="submit" disabled={saving} size="lg" className="flex-1 h-14 rounded-2xl text-lg font-bold gap-2 shadow-lg shadow-primary/30">
            {saving ? <><Loader2 className="w-5 h-5 animate-spin" />جارٍ الحفظ…</> : <><Save className="w-5 h-5" />{isEdit ? "حفظ وتحديث الإعلان" : "نشر الإعلان الآن"}</>}
          </Button>
          <Button type="button" variant="outline" size="lg" className="rounded-2xl h-14 sm:w-48 font-bold" onClick={() => navigate(isEdit ? `/listings/${id}` : "/listings")}>
            إلغاء والعودة
          </Button>
        </div>
      </form>
    </Layout>
  );
}
