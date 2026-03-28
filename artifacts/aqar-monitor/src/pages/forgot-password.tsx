import { useState, useEffect, type FormEvent } from "react";
import { Link } from "wouter";
import { Mail, Loader2, ArrowRight, CheckCircle2, Send } from "lucide-react";
import { LogoBrand } from "@/components/logo-brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    document.title = "استعادة كلمة المرور – عقار إنسايت";
    return () => { document.title = "عقار إنسايت"; };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
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
      const data = (await res.json()) as { success?: boolean; message?: string };
      if (!res.ok) {
        setError(data.message ?? "حدث خطأ، يرجى المحاولة مجدداً");
        return;
      }
      // Always show the generic success screen regardless of whether email was found
      setSent(true);
    } catch {
      setError("تعذّر الاتصال بالخادم، يرجى التحقق من اتصالك بالإنترنت");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "radial-gradient(ellipse at 70% 20%, hsl(191 80% 28% / 0.08) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, hsl(218 55% 10% / 0.05) 0%, transparent 60%), var(--background)",
      }}
    >
      <div className="w-full max-w-sm space-y-8">

        {/* Logo */}
        <div className="flex flex-col items-center">
          <LogoBrand variant="hero" linkTo="/" />
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-lg shadow-black/5">

          {sent ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center gap-5 text-center py-2">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">تم إرسال الرابط</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  إذا كان البريد الإلكتروني مسجّلاً لدينا، فسيتم إرسال رابط استعادة كلمة المرور إليه.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  يُرجى التحقق من صندوق الوارد وبريد السبام. الرابط صالح لمدة <strong>15 دقيقة</strong>.
                </p>
              </div>
              <Button
                variant="ghost"
                className="w-full h-10 rounded-xl text-sm border border-border/60 gap-2"
                onClick={() => { setSent(false); setIdentifier(""); }}
              >
                <Send className="w-4 h-4" />
                إعادة الإرسال
              </Button>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div className="mb-6 space-y-1">
                <h2 className="text-lg font-semibold text-foreground">استعادة كلمة المرور</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  أدخل بريدك الإلكتروني وسنرسل إليك رابط لإعادة تعيين كلمة المرور
                </p>
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

          {/* Back to login */}
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

        <p className="text-center text-xs text-muted-foreground/80">
          © {new Date().getFullYear()} عقار إنسايت — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
