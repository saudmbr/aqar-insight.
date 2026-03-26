import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

const CITIES = ["الرياض", "جدة", "الدمام", "مكة المكرمة", "المدينة المنورة", "الخبر", "تبوك", "أبها", "الطائف", "بريدة"];
const CATEGORIES = ["بحث عن عقار", "بحث عن مقاول", "تشطيبات", "سباكة وكهرباء", "تكييف", "دهانات", "تنظيف", "تصميم داخلي", "أخرى"];
const CONTACT_METHODS = ["واتساب", "هاتف", "بريد إلكتروني", "داخل المنصة"];

function FieldGroup({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-destructive ml-1">*</span>}</Label>
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
      setError("يرجى ملء العنوان، التصنيف، والمدينة"); return;
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
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <form onSubmit={(e) => void handleSubmit(e)} className="max-w-2xl mx-auto space-y-6 pb-10">
        <div>
          <h1 className="text-3xl font-bold text-foreground">نشر طلب</h1>
          <p className="text-muted-foreground mt-1">أخبرنا بما تبحث عنه وسيتواصل معك المختصون</p>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">⚠ {error}</div>
        )}

        <Card className="border-border/60">
          <CardHeader className="pb-3"><CardTitle className="text-base">تفاصيل الطلب</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FieldGroup label="عنوان الطلب" required>
              <Input placeholder="مثال: أبحث عن شقة في حي النرجس بالرياض" value={title} onChange={e => setTitle(e.target.value)} className="h-10 rounded-xl" />
            </FieldGroup>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FieldGroup label="التصنيف" required>
                <select value={category} onChange={e => setCategory(e.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm">
                  <option value="">اختر</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="المدينة" required>
                <select value={city} onChange={e => setCity(e.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm">
                  <option value="">اختر</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="الحي">
                <Input placeholder="اختياري" value={district} onChange={e => setDistrict(e.target.value)} className="h-10 rounded-xl" />
              </FieldGroup>
            </div>
            <FieldGroup label="تفاصيل الطلب">
              <textarea rows={4} placeholder="اكتب تفاصيل احتياجك بدقة…" value={details} onChange={e => setDetails(e.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </FieldGroup>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-3"><CardTitle className="text-base">الميزانية</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <FieldGroup label="الميزانية من (ر.س)">
              <Input type="number" min="0" placeholder="0" value={budgetMin} onChange={e => setBudgetMin(e.target.value)} className="h-10 rounded-xl" />
            </FieldGroup>
            <FieldGroup label="الميزانية إلى (ر.س)">
              <Input type="number" min="0" placeholder="∞" value={budgetMax} onChange={e => setBudgetMax(e.target.value)} className="h-10 rounded-xl" />
            </FieldGroup>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-3"><CardTitle className="text-base">طريقة التواصل</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldGroup label="طريقة التواصل المفضلة">
              <select value={contactMethod} onChange={e => setContactMethod(e.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm">
                <option value="">اختر</option>
                {CONTACT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </FieldGroup>
            <FieldGroup label="معلومات التواصل">
              <Input placeholder="رقم الهاتف أو البريد الإلكتروني" value={contactInfo} onChange={e => setContactInfo(e.target.value)} className="h-10 rounded-xl" dir="ltr" />
            </FieldGroup>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="flex-1 h-11 rounded-xl text-base gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />جارٍ النشر…</> : <><Save className="w-4 h-4" />نشر الطلب</>}
          </Button>
          <Button type="button" variant="outline" className="rounded-xl h-11" onClick={() => navigate("/requests")}>إلغاء</Button>
        </div>
      </form>
    </Layout>
  );
}
