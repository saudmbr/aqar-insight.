import { useState, useEffect, type FormEvent } from "react";
import { Link, useLocation, useSearch } from "wouter";
import {
  LockKeyhole, Eye, EyeOff, Loader2, ArrowRight,
  CheckCircle2, AlertTriangle, ShieldCheck
} from "lucide-react";
import { LogoBrand } from "@/components/logo-brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TokenState = "validating" | "valid" | "invalid";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const token = params.get("token") ?? "";

  const [tokenState, setTokenState] = useState<TokenState>("validating");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    document.title = "إعادة تعيين كلمة المرور – عقار إنسايت";
    return () => { document.title = "عقار إنسايت"; };
  }, []);

  // Validate token on mount
  useEffect(() => {
    if (!token) { setTokenState("invalid"); return; }
    const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
    fetch(`${BASE}/api/auth/validate-reset-token?token=${encodeURIComponent(token)}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d: { valid?: boolean }) => setTokenState(d.valid ? "valid" : "invalid"))
      .catch(() => setTokenState("invalid"));
  }, [token]);

  // Password strength helpers
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password === confirm && confirm.length > 0;
  const isValid = hasMinLength && hasLetter && hasNumber && passwordsMatch;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setError(null);
    setLoading(true);
    try {
      const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json()) as { success?: boolean; message?: string };
      if (!res.ok) {
        setError(data.message ?? "حدث خطأ، يرجى المحاولة مجدداً");
        return;
      }
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch {
      setError("تعذّر الاتصال بالخادم، يرجى التحقق من اتصالك بالإنترنت");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-background flex items-center justify-center p-4"
      style={{
        background:
          "radial-gradient(ellipse at 70% 20%, hsl(191 80% 28% / 0.08) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, hsl(218 55% 10% / 0.05) 0%, transparent 60%), var(--background)",
      }}
    >
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <LogoBrand variant="stacked" linkTo="/" light={false} />
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-lg shadow-black/5">

          {/* Validating */}
          {tokenState === "validating" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">جارٍ التحقق من الرابط…</p>
            </div>
          )}

          {/* Invalid token */}
          {tokenState === "invalid" && (
            <div className="space-y-5">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-destructive" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">الرابط غير صالح</h2>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    هذا الرابط منتهي الصلاحية أو تم استخدامه مسبقاً. يرجى طلب رابط استعادة جديد.
                  </p>
                </div>
              </div>
              <Button asChild className="w-full h-11 rounded-xl text-sm font-semibold">
                <Link href="/forgot-password">طلب رابط جديد</Link>
              </Button>
            </div>
          )}

          {/* Success */}
          {tokenState === "valid" && success && (
            <div className="flex flex-col items-center gap-4 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">تم تغيير كلمة المرور بنجاح</h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.<br />
                  سيتم تحويلك تلقائياً خلال ثوانٍ…
                </p>
              </div>
              <Button asChild variant="outline" className="mt-2 rounded-xl h-10 px-6 text-sm">
                <Link href="/login">الانتقال إلى تسجيل الدخول</Link>
              </Button>
            </div>
          )}

          {/* Form */}
          {tokenState === "valid" && !success && (
            <>
              <div className="mb-6 space-y-1">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">إعادة تعيين كلمة المرور</h2>
                </div>
                <p className="text-sm text-muted-foreground">اختر كلمة مرور جديدة قوية لحسابك</p>
              </div>

              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5" noValidate>
                {/* New password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    كلمة المرور الجديدة
                  </Label>
                  <div className="relative">
                    <LockKeyhole className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="password"
                      type={showPw ? "text" : "password"}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pr-9 pl-10 h-11 rounded-xl border-border/60 bg-background/50 text-right"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((p) => !p)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Strength indicators */}
                  {password.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <StrengthRow met={hasMinLength} label="8 أحرف على الأقل" />
                      <StrengthRow met={hasLetter} label="يحتوي على أحرف" />
                      <StrengthRow met={hasNumber} label="يحتوي على أرقام" />
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-sm font-medium text-foreground">
                    تأكيد كلمة المرور
                  </Label>
                  <div className="relative">
                    <LockKeyhole className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      className={`pr-9 pl-10 h-11 rounded-xl bg-background/50 text-right transition-colors ${
                        confirm.length > 0
                          ? passwordsMatch
                            ? "border-green-400 focus-visible:ring-green-400"
                            : "border-destructive focus-visible:ring-destructive"
                          : "border-border/60"
                      }`}
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((p) => !p)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirm.length > 0 && !passwordsMatch && (
                    <p className="text-xs text-destructive">كلمتا المرور غير متطابقتين</p>
                  )}
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
                  disabled={loading || !isValid}
                  className="w-full h-11 rounded-xl text-sm font-semibold shadow-md shadow-primary/20 transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                      جارٍ الحفظ…
                    </>
                  ) : (
                    "تعيين كلمة المرور الجديدة"
                  )}
                </Button>
              </form>
            </>
          )}

          {tokenState !== "validating" && (
            <div className="mt-6 pt-5 border-t border-border/50 flex justify-center">
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                العودة إلى تسجيل الدخول
              </Link>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground/80">
          © {new Date().getFullYear()} عقار إنسايت — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}

function StrengthRow({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${met ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"}`}>
        {met ? "✓" : "○"}
      </span>
      <span className={`text-xs ${met ? "text-green-700" : "text-muted-foreground"}`}>{label}</span>
    </div>
  );
}
