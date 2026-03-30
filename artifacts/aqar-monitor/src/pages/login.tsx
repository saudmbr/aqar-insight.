import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Loader2, LockKeyhole, User, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { LogoBrand } from "@/components/logo-brand";

export default function Login() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword]     = useState("");
  const [showPass, setShowPass]     = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(identifier, password);
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "service_provider") navigate("/services/dashboard");
      else navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "خطأ في تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen flex"
      style={{ background: "#F6F7FA" }}
    >
      {/* ── Left decorative panel (hidden on mobile) ─────────────── */}
      <div
        className="hidden lg:flex flex-col items-center justify-center w-[42%] shrink-0 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0B1628 0%, #0F2A45 60%, #0F7BA0 100%)" }}
      >
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 25% 35%, #0F7BA0 0%, transparent 55%), radial-gradient(circle at 75% 70%, #0B1628 0%, transparent 60%)" }} />
        <div className="relative z-10 text-center px-10 space-y-6">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-2"
            style={{ background: "rgba(15,123,160,0.25)", border: "1.5px solid rgba(15,123,160,0.4)" }}>
            <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
              <path d="M20 4L4 14v22h10V24h12v12h10V14L20 4z" fill="#0F7BA0" opacity="0.9" />
              <rect x="16" y="24" width="8" height="12" rx="1" fill="white" opacity="0.15" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white leading-tight">
            عقار إنسايت
          </h1>
          <p className="text-base text-white/60 leading-relaxed max-w-xs mx-auto">
            منصة ذكية للسوق العقاري السعودي — تحليلات، إعلانات، ومقارنات في مكان واحد
          </p>
          <div className="flex flex-col gap-3 mt-4 text-right max-w-xs mx-auto">
            {[
              "تحليلات السوق العقاري الفورية",
              "آلاف الإعلانات العقارية",
              "خبراء ومقدمو خدمات موثوقون",
            ].map(f => (
              <div key={f} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(15,123,160,0.3)" }}>
                  <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                    <path d="M2 6l3 3 5-5" stroke="#0F7BA0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-sm text-white/70">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: login form ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-[400px] space-y-7">

          {/* Logo (mobile only) */}
          <div className="flex flex-col items-center lg:hidden">
            <LogoBrand variant="hero" linkTo="/" />
          </div>

          {/* Card */}
          <div
            className="rounded-3xl border border-white/80 p-8 space-y-6"
            style={{ background: "#fff", boxShadow: "0 4px 32px rgba(11,22,40,0.08)" }}
          >
            {/* Header */}
            <div className="space-y-1">
              <h2 className="text-[22px] font-black text-foreground tracking-tight">تسجيل الدخول</h2>
              <p className="text-sm text-muted-foreground">أدخل بياناتك للوصول إلى حسابك</p>
            </div>

            <form onSubmit={e => void handleSubmit(e)} className="space-y-4" noValidate>

              {/* Identifier */}
              <div className="space-y-1.5">
                <label htmlFor="identifier" className="text-[13px] font-bold text-foreground block">
                  اسم المستخدم أو البريد الإلكتروني
                </label>
                <div className="relative">
                  <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    id="identifier"
                    type="text"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="admin أو example@email.com"
                    disabled={loading}
                    required
                    className="w-full h-11 pr-10 pl-4 rounded-xl border text-sm text-foreground bg-background outline-none transition-all placeholder:text-muted-foreground/50"
                    style={{ borderColor: "#E2E8F0" }}
                    onFocus={e => { e.currentTarget.style.borderColor = "#0F7BA0"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(15,123,160,0.1)"; }}
                    onBlur={e  => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-[13px] font-bold text-foreground">كلمة المرور</label>
                  <Link href="/forgot-password" className="text-[12px] font-semibold transition-colors" style={{ color: "#0F7BA0" }}>
                    نسيت كلمة المرور؟
                  </Link>
                </div>
                <div className="relative">
                  <LockKeyhole className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    id="password"
                    type={showPass ? "text" : "password"}
                    autoComplete="current-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    required
                    className="w-full h-11 pr-10 pl-10 rounded-xl border text-sm text-foreground bg-background outline-none transition-all"
                    style={{ borderColor: "#E2E8F0" }}
                    onFocus={e => { e.currentTarget.style.borderColor = "#0F7BA0"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(15,123,160,0.1)"; }}
                    onBlur={e  => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    tabIndex={-1}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPass ? "إخفاء" : "إظهار"}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div role="alert" className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm"
                  style={{ background: "#FEF2F2", borderColor: "#FECACA", color: "#DC2626" }}>
                  <span className="text-base leading-none">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !identifier || !password}
                className="w-full h-12 rounded-xl text-sm font-bold text-white transition-all mt-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: loading || !identifier || !password ? "#94A3B8" : "linear-gradient(135deg, #0B1628, #0F7BA0)", boxShadow: "0 4px 14px rgba(15,123,160,0.3)" }}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />جارٍ التحقق…</>
                ) : (
                  <><span>تسجيل الدخول</span><ArrowLeft className="w-4 h-4" /></>
                )}
              </button>
            </form>

            {/* Signup link */}
            <p className="text-center text-[13px] text-muted-foreground pt-1">
              ليس لديك حساب؟{" "}
              <Link href="/signup" className="font-bold transition-colors" style={{ color: "#0F7BA0" }}>
                إنشاء حساب جديد
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-muted-foreground/70">
            © {new Date().getFullYear()} عقار إنسايت — جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </div>
  );
}
