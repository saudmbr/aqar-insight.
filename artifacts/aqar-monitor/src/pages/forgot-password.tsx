import { useState, useEffect, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { Building2, Mail, Loader2, ArrowRight, CheckCircle2, Copy, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.title = "استعادة كلمة المرور – عقار إنسايت";
    return () => { document.title = "عقار إنسايت"; };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      const data = (await res.json()) as { success?: boolean; resetToken?: string; message?: string };
      if (!res.ok) {
        setError(data.message ?? "حدث خطأ، يرجى المحاولة مجدداً");
        return;
      }
      // Always show success regardless — but surface token if present
      setResetToken(data.resetToken ?? null);
    } catch {
      setError("تعذّر الاتصال بالخادم، يرجى التحقق من اتصالك بالإنترنت");
    } finally {
      setLoading(false);
    }
  };

  const copyToken = () => {
    if (!resetToken) return;
    void navigator.clipboard.writeText(resetToken).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const goToReset = () => {
    if (resetToken) navigate(`/reset-password?token=${encodeURIComponent(resetToken)}`);
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-background flex items-center justify-center p-4"
      style={{
        background:
          "radial-gradient(ellipse at 70% 20%, hsl(191 80% 28% / 0.08) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, hsl(218 55% 10% / 0.05) 0%, transparent 60%), hsl(var(--background))",
      }}
    >
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/25">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">عقار إنسايت</h1>
            <p className="text-sm text-muted-foreground">منصة ذكية لتحليل سوق العقار</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-lg shadow-black/5">

          {/* Sent state */}
          {resetToken !== null ? (
            <div className="space-y-5">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">تم إنشاء رابط الاستعادة</h2>
                  <p className="text-sm text-muted-foreground mt-1">انقر على الزر أدناه للانتقال إلى صفحة تغيير كلمة المرور</p>
                </div>
              </div>

              {/* Dev token display */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
                <p className="text-xs font-medium text-amber-800 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  رمز الاستعادة (مؤقت — سيُرسَل بالبريد مستقبلاً)
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-[11px] font-mono text-amber-900 bg-amber-100 rounded-lg px-3 py-2 break-all leading-relaxed">
                    {resetToken}
                  </code>
                  <button
                    type="button"
                    onClick={copyToken}
                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-amber-200 hover:bg-amber-300 transition-colors"
                    title="نسخ الرمز"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-700" /> : <Copy className="w-3.5 h-3.5 text-amber-800" />}
                  </button>
                </div>
                <p className="text-[11px] text-amber-700">صالح لمدة 20 دقيقة · للاستخدام مرة واحدة فقط</p>
              </div>

              <Button onClick={goToReset} className="w-full h-11 rounded-xl text-sm font-semibold shadow-md shadow-primary/20">
                متابعة إعادة تعيين كلمة المرور
              </Button>
            </div>
          ) : (
            /* Form state */
            <>
              <div className="mb-6 space-y-1">
                <h2 className="text-lg font-semibold text-foreground">استعادة كلمة المرور</h2>
                <p className="text-sm text-muted-foreground">أدخل بريدك الإلكتروني وسنرسل لك رابط الاستعادة</p>
              </div>

              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="identifier" className="text-sm font-medium text-foreground">
                    البريد الإلكتروني
                  </Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="identifier"
                      type="email"
                      autoComplete="email"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="example@email.com"
                      className="pr-9 h-11 rounded-xl border-border/60 bg-background/50 text-right"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive"
                  >
                    <span className="text-base leading-none">⚠</span>
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || !identifier.trim()}
                  className="w-full h-11 rounded-xl text-sm font-semibold shadow-md shadow-primary/20 transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                      جارٍ الإرسال…
                    </>
                  ) : (
                    "إرسال رابط الاستعادة"
                  )}
                </Button>
              </form>
            </>
          )}

          <div className="mt-6 pt-5 border-t border-border/50 flex justify-center">
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              العودة إلى تسجيل الدخول
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} عقار إنسايت — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
