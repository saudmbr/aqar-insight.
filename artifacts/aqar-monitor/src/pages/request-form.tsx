import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, FileText, Banknote, Contact, Building2, Wrench, UserCheck } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

import { SAUDI_CITIES as CITIES } from "@/lib/saudi-cities";
const PROPERTY_TYPES = ["شقة", "فيلا", "دوبلكس", "أرض", "مكتب", "محل تجاري", "مستودع", "فندق", "أخرى"];
const SERVICE_TYPES  = ["مقاول بناء", "تشطيبات", "سباكة وكهرباء", "تكييف", "دهانات", "تنظيف", "تصميم داخلي", "مساحة وتقييم", "صيانة عامة", "أخرى"];
const CONTACT_METHODS = ["واتساب", "هاتف", "بريد إلكتروني", "داخل المنصة"];

const REQUEST_TYPES = [
  {
    value: "property",
    icon: Building2,
    label: "بحث عن عقار",
    desc: "تبحث عن شقة، فيلا، أرض، أو أي عقار آخر للشراء أو الإيجار",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-300",
    activeBg: "bg-blue-600",
  },
  {
    value: "service",
    icon: Wrench,
    label: "بحث عن خدمة",
    desc: "تحتاج إلى مقاول، مصمم، أو أي خدمة عقارية متخصصة",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-300",
    activeBg: "bg-orange-600",
  },
  {
    value: "marketer",
    icon: UserCheck,
    label: "بحث عن مسوّق عقاري",
    desc: "تبحث عن مسوّق عقاري محدد أو تريد التواصل مع أفضل المسوّقين",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    activeBg: "bg-emerald-600",
  },
];

function FieldGroup({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-foreground flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function RequestForm() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [requestType, setRequestType] = useState("property");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [details, setDetails] = useState("");
  const [marketerName, setMarketerName] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const [contactInfo, setContactInfo] = useState("");

  if (!isAuthenticated) { navigate("/login"); return null; }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title || !city) {
      setError("يرجى ملء العنوان والمدينة على الأقل");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        requestType,
        title,
        city,
        district: district || null,
        budgetMin: budgetMin || null,
        budgetMax: budgetMax || null,
        details: details || null,
        contactMethod: contactMethod || null,
        contactInfo: contactInfo || null,
      };
      if (requestType === "property" || requestType === "service") {
        body.category = category || null;
      }
      if (requestType === "marketer") {
        body.marketerName = marketerName || null;
      }

      const res = await fetch("/api/customer-requests", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { message?: string };
      if (!res.ok) throw new Error(data.message ?? "حدث خطأ");
      toast({ title: "تم نشر طلبك بنجاح" });
      navigate("/requests");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  const selectedType = REQUEST_TYPES.find(t => t.value === requestType)!;

  return (
    <Layout>
      <form onSubmit={(e) => void handleSubmit(e)} className="max-w-3xl mx-auto space-y-8 pb-16">

        {/* Header */}
        <div className="bg-card p-8 rounded-3xl border border-border shadow-sm text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold mb-2">نشر طلب جديد</h1>
          <p className="text-muted-foreground max-w-lg mx-auto text-base leading-relaxed">
            حدّد نوع طلبك وأضف تفاصيله، وسيتواصل معك أصحاب العروض المناسبة مباشرةً.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-destructive bg-destructive/10 p-5 text-destructive font-semibold flex items-center gap-3">
            <span className="text-2xl">⚠️</span> {error}
          </div>
        )}

        {/* ─── Request Type Selector ─────────────────────────────────────── */}
        <Card className="border-border rounded-3xl overflow-hidden shadow-sm">
          <CardHeader className="bg-muted/30 border-b border-border py-5 px-6">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              نوع الطلب
              <span className="text-destructive text-sm">*</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {REQUEST_TYPES.map(({ value, icon: Icon, label, desc, color, bg, border }) => {
                const isActive = requestType === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { setRequestType(value); setCategory(""); }}
                    className={`relative flex flex-col items-start gap-3 p-5 rounded-2xl border-2 text-right transition-all cursor-pointer
                      ${isActive
                        ? `${bg} ${border} shadow-sm`
                        : "bg-background border-border hover:border-primary/30 hover:bg-muted/30"
                      }`}
                  >
                    {isActive && (
                      <div className="absolute top-3 left-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${isActive ? bg : "bg-muted"}`}>
                      <Icon className={`w-6 h-6 ${isActive ? color : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className={`font-bold text-base mb-1 ${isActive ? color : "text-foreground"}`}>{label}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ─── Main Details ──────────────────────────────────────────────── */}
        <Card className="border-border rounded-3xl shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border py-5 px-6">
            <CardTitle className="text-lg flex items-center gap-2">
              <selectedType.icon className={`w-5 h-5 ${selectedType.color}`} />
              تفاصيل الطلب
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">

            {/* Title */}
            <FieldGroup label="عنوان الطلب" required hint="اكتب عنواناً واضحاً يوضح ما تبحث عنه">
              <Input
                placeholder={
                  requestType === "property" ? "مثال: أبحث عن شقة 3 غرف في حي النرجس بالرياض" :
                  requestType === "service"  ? "مثال: أبحث عن مقاول تشطيبات للمنطقة الشرقية" :
                                               "مثال: أبحث عن المسوّق العقاري أحمد الشهري"
                }
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="h-14 rounded-2xl text-base font-semibold"
              />
            </FieldGroup>

            {/* Sub-type: property type OR service type */}
            {requestType === "property" && (
              <FieldGroup label="نوع العقار">
                <select value={category} onChange={e => setCategory(e.target.value)} className="h-12 w-full rounded-xl border border-input bg-background px-4 text-base focus:ring-2 focus:ring-primary/20 outline-none">
                  <option value="">اختر نوع العقار (اختياري)</option>
                  {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </FieldGroup>
            )}

            {requestType === "service" && (
              <FieldGroup label="نوع الخدمة">
                <select value={category} onChange={e => setCategory(e.target.value)} className="h-12 w-full rounded-xl border border-input bg-background px-4 text-base focus:ring-2 focus:ring-primary/20 outline-none">
                  <option value="">اختر نوع الخدمة (اختياري)</option>
                  {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </FieldGroup>
            )}

            {/* Marketer name — for type=marketer */}
            {requestType === "marketer" && (
              <FieldGroup label="اسم المسوّق العقاري المطلوب" hint="اكتب الاسم إذا كنت تبحث عن مسوّق بعينه، أو اتركه فارغاً للبحث العام">
                <Input
                  placeholder="مثال: محمد العتيبي، أو شركة الراجحي العقارية"
                  value={marketerName}
                  onChange={e => setMarketerName(e.target.value)}
                  className="h-12 rounded-xl text-base"
                />
              </FieldGroup>
            )}

            {/* City + District */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FieldGroup label="المدينة" required>
                <select value={city} onChange={e => setCity(e.target.value)} className="h-12 w-full rounded-xl border border-input bg-background px-4 text-base focus:ring-2 focus:ring-primary/20 outline-none">
                  <option value="">اختر المدينة</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="الحي" hint="اختياري">
                <Input
                  placeholder="اسم الحي أو المنطقة"
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  className="h-12 rounded-xl text-base"
                />
              </FieldGroup>
            </div>

            {/* Description */}
            <FieldGroup label="وصف مختصر لطلبك">
              <textarea
                rows={4}
                placeholder="أضف أي تفاصيل إضافية تساعد في تحديد احتياجاتك بدقة…"
                value={details}
                onChange={e => setDetails(e.target.value)}
                className="w-full rounded-2xl border border-input bg-background p-4 text-base leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </FieldGroup>
          </CardContent>
        </Card>

        {/* ─── Budget + Contact ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Budget — shown for property and service */}
          {(requestType === "property" || requestType === "service") && (
            <Card className="border-border rounded-3xl shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border py-5 px-6">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-primary" />
                  الميزانية المتوقعة
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <FieldGroup label="من (ريال سعودي)">
                  <Input type="number" min="0" placeholder="الحد الأدنى" value={budgetMin} onChange={e => setBudgetMin(e.target.value)} className="h-12 rounded-xl font-bold" />
                </FieldGroup>
                <FieldGroup label="إلى (ريال سعودي)">
                  <Input type="number" min="0" placeholder="الحد الأعلى (اختياري)" value={budgetMax} onChange={e => setBudgetMax(e.target.value)} className="h-12 rounded-xl font-bold" />
                </FieldGroup>
              </CardContent>
            </Card>
          )}

          {/* Contact */}
          <Card className="border-border rounded-3xl shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border py-5 px-6">
              <CardTitle className="text-lg flex items-center gap-2">
                <Contact className="w-5 h-5 text-primary" />
                وسيلة التواصل
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <FieldGroup label="طريقة التواصل المفضلة">
                <select value={contactMethod} onChange={e => setContactMethod(e.target.value)} className="h-12 w-full rounded-xl border border-input bg-background px-4 text-base focus:ring-2 focus:ring-primary/20 outline-none">
                  <option value="">اختر الطريقة</option>
                  {CONTACT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="رقم الهاتف أو البريد الإلكتروني">
                <Input
                  placeholder="05XXXXXXXX أو email@example.com"
                  value={contactInfo}
                  onChange={e => setContactInfo(e.target.value)}
                  className="h-12 rounded-xl font-mono tracking-wide text-left"
                  dir="ltr"
                />
              </FieldGroup>
            </CardContent>
          </Card>
        </div>

        {/* ─── Submit Bar ───────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-4 sticky bottom-6 z-10 bg-card/90 backdrop-blur-md p-4 rounded-3xl border border-border shadow-2xl">
          <Button type="submit" disabled={saving} size="lg" className="flex-1 h-14 rounded-2xl text-base font-bold gap-2 shadow-lg shadow-primary/30">
            {saving
              ? <><Loader2 className="w-5 h-5 animate-spin" />جاري النشر…</>
              : <><Save className="w-5 h-5" />تأكيد ونشر الطلب</>
            }
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="rounded-2xl h-14 sm:w-48 font-bold border-border bg-white"
            onClick={() => navigate("/requests")}
          >
            إلغاء
          </Button>
        </div>
      </form>
    </Layout>
  );
}
