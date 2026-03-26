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
const CATEGORIES = [
  "بناء وتشييد", "تشطيبات وديكور", "كهرباء ومياه", "تكييف وتبريد", "دهانات", "أرضيات",
  "مطابخ", "مصاعد", "نظافة ومكافحة حشرات", "تصميم داخلي", "تصميم معماري", "تقييم عقاري",
  "إدارة عقارات", "تصوير عقاري", "صيانة", "مقاولات", "مواد بناء",
];

function FieldGroup({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-destructive ml-1">*</span>}</Label>
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
  const [city, setCity] = useState("");
  const [coveredAreas, setCoveredAreas] = useState("");
  const [description, setDescription] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [portfolioImages, setPortfolioImages] = useState("");

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!businessName || !category || !city) {
      setError("يرجى ملء اسم النشاط، التصنيف، والمدينة"); return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/service-providers", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, category, city, coveredAreas, description, startingPrice: startingPrice || null, contactPhone, whatsapp, workingHours, portfolioImages }),
      });
      const data = await res.json() as { id?: number; message?: string };
      if (!res.ok) throw new Error(data.message ?? "حدث خطأ");
      navigate("/services");
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
          <h1 className="text-3xl font-bold text-foreground">إضافة خدمة</h1>
          <p className="text-muted-foreground mt-1">أضف خدمتك لمنصة سوق الخدمات العقارية</p>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">⚠ {error}</div>
        )}

        <Card className="border-border/60">
          <CardHeader className="pb-3"><CardTitle className="text-base">معلومات النشاط</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FieldGroup label="اسم النشاط" required>
              <Input placeholder="مثال: شركة الإتقان للتشطيبات" value={businessName} onChange={e => setBusinessName(e.target.value)} className="h-10 rounded-xl" />
            </FieldGroup>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldGroup label="التصنيف" required>
                <select value={category} onChange={e => setCategory(e.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm">
                  <option value="">اختر التصنيف</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="المدينة" required>
                <select value={city} onChange={e => setCity(e.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm">
                  <option value="">اختر المدينة</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FieldGroup>
            </div>
            <FieldGroup label="المناطق المغطاة">
              <Input placeholder="مثال: الرياض - جدة - الدمام" value={coveredAreas} onChange={e => setCoveredAreas(e.target.value)} className="h-10 rounded-xl" />
            </FieldGroup>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-3"><CardTitle className="text-base">تفاصيل الخدمة</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FieldGroup label="وصف الخدمة">
              <textarea rows={4} placeholder="اكتب وصفاً تفصيلياً لخدمتك…" value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </FieldGroup>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldGroup label="السعر يبدأ من (ر.س)">
                <Input type="number" min="0" placeholder="0" value={startingPrice} onChange={e => setStartingPrice(e.target.value)} className="h-10 rounded-xl" />
              </FieldGroup>
              <FieldGroup label="ساعات العمل">
                <Input placeholder="مثال: 8 صباحاً – 10 مساءً" value={workingHours} onChange={e => setWorkingHours(e.target.value)} className="h-10 rounded-xl" />
              </FieldGroup>
            </div>
            <FieldGroup label="صور أعمالنا (رابط واحد في كل سطر)">
              <textarea rows={3} placeholder={"https://example.com/image1.jpg\nhttps://example.com/image2.jpg"} value={portfolioImages} onChange={e => setPortfolioImages(e.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" dir="ltr" />
            </FieldGroup>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-3"><CardTitle className="text-base">التواصل</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldGroup label="رقم الهاتف">
              <Input type="tel" placeholder="05XXXXXXXX" value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="h-10 rounded-xl" dir="ltr" />
            </FieldGroup>
            <FieldGroup label="رقم واتساب">
              <Input type="tel" placeholder="966XXXXXXXXX" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="h-10 rounded-xl" dir="ltr" />
            </FieldGroup>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="flex-1 h-11 rounded-xl text-base gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />جارٍ الحفظ…</> : <><Save className="w-4 h-4" />نشر الخدمة</>}
          </Button>
          <Button type="button" variant="outline" className="rounded-xl h-11" onClick={() => navigate("/services")}>إلغاء</Button>
        </div>
      </form>
    </Layout>
  );
}
