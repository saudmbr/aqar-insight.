import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, FileText, Banknote, Contact, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

const CITIES = ["الرياض", "جدة", "الدمام", "مكة المكرمة", "المدينة المنورة", "الخبر", "تبوك", "أبها", "الطائف", "بريدة"];
const CATEGORIES = ["بحث عن عقار", "بحث عن مقاول", "تشطيبات", "سباكة وكهرباء", "تكييف", "دهانات", "تنظيف", "تصميم داخلي", "أخرى"];
const CONTACT_METHODS = ["واتساب", "هاتف", "بريد إلكتروني", "داخل المنصة"];

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

export default function RequestForm() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [details, setDetails] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const [contactInfo, setContactInfo] = useState("");

  if (!isAuthenticated) { navigate("/login"); return null; }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title || !category || !city) {
      setError("يرجى ملء الحقول الإلزامية: العنوان، التصنيف، والمدينة"); 
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/customer-requests", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, city, district: district || null, budgetMin: budgetMin || null, budgetMax: budgetMax || null, details, contactMethod, contactInfo }),
      });
      const data = await res.json() as { message?: string };
      if (!res.ok) throw new Error(data.message ?? "حدث خطأ");
      navigate("/requests");
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
        <div className="bg-card p-8 rounded-3xl border border-border shadow-sm text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground mb-3">نشر طلب جديد</h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">هل تبحث عن عقار محدد أو خدمة متخصصة؟ انشر طلبك هنا وسيتواصل معك مقدمي الخدمات المناسبين.</p>
        </div>

        {error && (
          <div className="rounded-2xl border border-destructive bg-destructive/10 p-5 text-destructive font-semibold flex items-center gap-3 shadow-sm">
            <span className="text-2xl">⚠️</span> {error}
          </div>
        )}

        <Card className="border-border rounded-3xl premium-shadow overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border py-5 px-6">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              تفاصيل الطلب
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <FieldGroup label="عنوان الطلب" required>
              <Input placeholder="مثال: أبحث عن شقة 3 غرف في حي النرجس بالرياض" value={title} onChange={e => setTitle(e.target.value)} className="h-14 rounded-2xl text-lg font-bold" />
            </FieldGroup>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <FieldGroup label="التصنيف" required>
                <select value={category} onChange={e => setCategory(e.target.value)} className="h-12 w-full rounded-xl border border-input bg-background px-4 text-base focus:ring-2 focus:ring-primary/20 outline-none">
                  <option value="">اختر التصنيف</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="المدينة" required>
                <select value={city} onChange={e => setCity(e.target.value)} className="h-12 w-full rounded-xl border border-input bg-background px-4 text-base focus:ring-2 focus:ring-primary/20 outline-none">
                  <option value="">اختر المدينة</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="الحي (مفضل)">
                <Input placeholder="اسم الحي" value={district} onChange={e => setDistrict(e.target.value)} className="h-12 rounded-xl text-base" />
              </FieldGroup>
            </div>
            
            <FieldGroup label="الوصف الكامل لطلبك">
              <textarea 
                rows={5} 
                placeholder="اكتب تفاصيل احتياجك بدقة، المواصفات المطلوبة، وأي شروط خاصة لتسهيل وصول العرض المناسب لك..." 
                value={details} 
                onChange={e => setDetails(e.target.value)} 
                className="w-full rounded-2xl border border-input bg-background p-4 text-base leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary/20" 
              />
            </FieldGroup>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-border rounded-3xl premium-shadow overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border py-5 px-6">
              <CardTitle className="text-lg flex items-center gap-2">
                <Banknote className="w-5 h-5 text-primary" />
                الميزانية المتوقعة
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 gap-5">
              <FieldGroup label="من (ريال سعودي)">
                <Input type="number" min="0" placeholder="الحد الأدنى" value={budgetMin} onChange={e => setBudgetMin(e.target.value)} className="h-12 rounded-xl font-bold text-lg" />
              </FieldGroup>
              <FieldGroup label="إلى (ريال سعودي)">
                <Input type="number" min="0" placeholder="الحد الأعلى (اختياري)" value={budgetMax} onChange={e => setBudgetMax(e.target.value)} className="h-12 rounded-xl font-bold text-lg" />
              </FieldGroup>
            </CardContent>
          </Card>

          <Card className="border-border rounded-3xl premium-shadow overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border py-5 px-6">
              <CardTitle className="text-lg flex items-center gap-2">
                <Contact className="w-5 h-5 text-primary" />
                طريقة التواصل المفضلة
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <FieldGroup label="كيف تفضل أن يتواصل معك مقدمو الخدمة؟">
                <select value={contactMethod} onChange={e => setContactMethod(e.target.value)} className="h-12 w-full rounded-xl border border-input bg-background px-4 text-base focus:ring-2 focus:ring-primary/20 outline-none">
                  <option value="">اختر الطريقة</option>
                  {CONTACT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="معلومات التواصل (رقم أو إيميل)">
                <Input placeholder="أدخل رقم الهاتف أو البريد الإلكتروني" value={contactInfo} onChange={e => setContactInfo(e.target.value)} className="h-12 rounded-xl font-mono text-left tracking-wide" dir="ltr" />
              </FieldGroup>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sticky bottom-6 z-10 bg-card/90 backdrop-blur-md p-4 rounded-3xl border border-border shadow-2xl">
          <Button type="submit" disabled={saving} size="lg" className="flex-1 h-14 rounded-2xl text-lg font-bold gap-2 shadow-lg shadow-primary/30">
            {saving ? <><Loader2 className="w-5 h-5 animate-spin" />جاري النشر…</> : <><Save className="w-5 h-5" />تأكيد ونشر الطلب</>}
          </Button>
          <Button type="button" variant="outline" size="lg" className="rounded-2xl h-14 sm:w-48 font-bold border-border bg-white" onClick={() => navigate("/requests")}>
            إلغاء
          </Button>
        </div>
      </form>
    </Layout>
  );
}
