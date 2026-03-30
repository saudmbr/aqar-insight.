import { useState, useEffect, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Loader2, LockKeyhole, User, ShieldCheck, BadgeCheck, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

// ── Animated counter ──────────────────────────────────────────────────────────
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(to / 60);
    const t = setInterval(() => {
      start += step;
      if (start >= to) { setVal(to); clearInterval(t); } else setVal(start);
    }, 18);
    return () => clearInterval(t);
  }, [to]);
  return <>{val.toLocaleString("ar-SA")}{suffix}</>;
}

// ── Arabic geometric SVG pattern ──────────────────────────────────────────────
const GeometricPattern = () => (
  <svg className="absolute inset-0 w-full h-full opacity-[0.045]" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="geo" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
        <polygon points="30,2 58,16 58,44 30,58 2,44 2,16" fill="none" stroke="white" strokeWidth="0.8" />
        <polygon points="30,12 48,21 48,39 30,48 12,39 12,21" fill="none" stroke="white" strokeWidth="0.5" />
        <circle cx="30" cy="30" r="3" fill="none" stroke="white" strokeWidth="0.6" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#geo)" />
  </svg>
);

// ── Skyline SVG ───────────────────────────────────────────────────────────────
const SkylineSVG = () => (
  <svg viewBox="0 0 520 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-md opacity-25">
    {/* Riyadh Kingdom Tower inspired */}
    <rect x="230" y="10" width="18" height="100" rx="2" fill="white" />
    <polygon points="239,2 233,18 245,18" fill="white" />
    <rect x="234" y="35" width="10" height="6" rx="1" fill="#0F7BA0" />
    {/* Tall buildings */}
    <rect x="40"  y="40" width="22" height="70" rx="2" fill="white" />
    <rect x="70"  y="55" width="18" height="55" rx="2" fill="white" />
    <rect x="95"  y="30" width="28" height="80" rx="2" fill="white" />
    <rect x="100" y="26" width="18" height="8"  rx="1" fill="white" />
    <rect x="130" y="50" width="16" height="60" rx="2" fill="white" />
    <rect x="155" y="35" width="24" height="75" rx="2" fill="white" />
    <rect x="185" y="60" width="14" height="50" rx="2" fill="white" />
    <rect x="206" y="45" width="20" height="65" rx="2" fill="white" />
    <rect x="255" y="50" width="18" height="60" rx="2" fill="white" />
    <rect x="280" y="25" width="26" height="85" rx="2" fill="white" />
    <rect x="285" y="20" width="16" height="10" rx="1" fill="white" />
    <rect x="313" y="42" width="20" height="68" rx="2" fill="white" />
    <rect x="340" y="56" width="16" height="54" rx="2" fill="white" />
    <rect x="362" y="32" width="24" height="78" rx="2" fill="white" />
    <rect x="393" y="48" width="18" height="62" rx="2" fill="white" />
    <rect x="418" y="38" width="22" height="72" rx="2" fill="white" />
    <rect x="447" y="60" width="14" height="50" rx="2" fill="white" />
    <rect x="468" y="44" width="20" height="66" rx="2" fill="white" />
    {/* Ground */}
    <rect x="0" y="110" width="520" height="10" fill="white" opacity="0.4" />
    {/* Windows */}
    {[40,70,95,130,155,185,206,255,280,313,362,418,468].map((x, i) => (
      Array.from({ length: 4 }).map((_, row) => (
        Array.from({ length: 2 }).map((_, col) => (
          <rect key={`${i}-${row}-${col}`} x={x + 4 + col * 8} y={55 + row * 12} width="4" height="5" rx="0.5" fill="#0F7BA0" opacity="0.7" />
        ))
      ))
    ))}
  </svg>
);

// ── Trust badge ───────────────────────────────────────────────────────────────
function TrustBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 bg-white/8 border border-white/12 rounded-2xl px-4 py-2.5">
      <span style={{ color: "#C9A84C" }}>{icon}</span>
      <span className="text-white/80 text-[12px] font-semibold">{label}</span>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ number, suffix, label, color }: {
  number: number; suffix?: string; label: string; color: string;
}) {
  return (
    <div className="flex-1 text-center px-3 py-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
      <div className="text-xl font-black leading-none mb-0.5" style={{ color }}>
        <Counter to={number} suffix={suffix} />
      </div>
      <div className="text-white/50 text-[11px] font-medium leading-tight">{label}</div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Login() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password,   setPassword]   = useState("");
  const [showPass,   setShowPass]   = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [focusId,    setFocusId]    = useState(false);
  const [focusPw,    setFocusPw]    = useState(false);

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

  const canSubmit = identifier.trim() && password.length >= 1 && !loading;

  return (
    <div dir="rtl" className="min-h-screen flex overflow-hidden" style={{ background: "#0B1628" }}>

      {/* ══════════════════════════════════════════════════════════════
          LEFT — HERO PANEL
      ══════════════════════════════════════════════════════════════ */}
      <div
        className="hidden lg:flex flex-col justify-between w-[52%] shrink-0 relative overflow-hidden px-12 py-12"
        style={{ background: "linear-gradient(160deg, #060E1E 0%, #0B1E38 45%, #0C2D50 75%, #0F4A74 100%)" }}
      >
        {/* Geometric bg */}
        <GeometricPattern />

        {/* Gold glow top-right */}
        <div className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)" }} />
        {/* Teal glow bottom */}
        <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(15,123,160,0.18) 0%, transparent 65%)" }} />

        {/* ── Top: Logo ── */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #0F7BA0, #0B5E7A)", boxShadow: "0 4px 20px rgba(15,123,160,0.4)" }}>
              <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
                <path d="M16 3L3 11.5V29H11V21h10v8h8V11.5L16 3z" fill="white" opacity="0.95" />
                <rect x="13" y="21" width="6" height="8" rx="1" fill="#0F7BA0" opacity="0.6" />
              </svg>
            </div>
            <div>
              <div className="text-white font-black text-xl leading-none">عقار إنسايت</div>
              <div className="text-[11px] font-medium mt-0.5" style={{ color: "#C9A84C" }}>Aqar Insight™</div>
            </div>
          </div>
        </div>

        {/* ── Middle: Main content ── */}
        <div className="relative z-10 space-y-8">
          {/* Headline */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold"
              style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.25)", color: "#C9A84C" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: "#C9A84C" }} />
              المنصة العقارية الأولى في المملكة
            </div>
            <h1 className="text-[40px] font-black text-white leading-[1.15] tracking-tight">
              استثمر بذكاء<br />
              <span style={{ color: "#0F7BA0" }}>في العقار</span><br />
              السعودي
            </h1>
            <p className="text-white/50 text-[15px] leading-relaxed max-w-sm">
              تحليلات سوقية فورية، آلاف الإعلانات، وخبراء موثوقون — كل ما تحتاجه في منصة واحدة.
            </p>
          </div>

          {/* Stats row */}
          <div className="flex gap-3">
            <StatCard number={1240}  suffix="+"  label="إعلان نشط"      color="#0F7BA0" />
            <StatCard number={18}    suffix=""   label="مدينة رئيسية"   color="#C9A84C" />
            <StatCard number={350}   suffix="+"  label="مستخدم مسجّل"   color="#10B981" />
          </div>

          {/* Skyline */}
          <div className="flex justify-center">
            <SkylineSVG />
          </div>

          {/* Testimonial */}
          <div className="rounded-3xl p-5 relative overflow-hidden"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
            <div className="absolute top-3 right-4 text-5xl leading-none font-serif opacity-20 text-white select-none">"</div>
            <p className="text-white/70 text-[13px] leading-relaxed pr-2 relative z-10">
              أفضل منصة عقارية استخدمتها — التحليلات دقيقة والواجهة سلسة جداً. ساعدتني في اتخاذ قرار استثماري صحيح.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg, #0F7BA0, #C9A84C)" }}>م</div>
              <div>
                <div className="text-white/80 text-[12px] font-bold">محمد الشهراني</div>
                <div className="text-white/40 text-[10px]">مستثمر عقاري — الرياض</div>
              </div>
              <div className="flex gap-0.5 mr-auto">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} viewBox="0 0 12 12" className="w-3 h-3" fill="#C9A84C"><polygon points="6,1 7.5,4.5 11,5 8.5,7.5 9,11 6,9.5 3,11 3.5,7.5 1,5 4.5,4.5" /></svg>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom: Trust badges ── */}
        <div className="relative z-10 space-y-3">
          <div className="flex gap-3 flex-wrap">
            <TrustBadge icon={<ShieldCheck className="w-4 h-4" />} label="بيانات مشفرة SSL" />
            <TrustBadge icon={<BadgeCheck  className="w-4 h-4" />} label="حسابات موثقة" />
            <TrustBadge icon={<TrendingUp  className="w-4 h-4" />} label="بيانات محدّثة يومياً" />
          </div>
          <p className="text-white/25 text-[11px]">© {new Date().getFullYear()} عقار إنسايت — جميع الحقوق محفوظة</p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          RIGHT — FORM PANEL
      ══════════════════════════════════════════════════════════════ */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-5 py-12 relative"
        style={{ background: "#F7F9FC" }}
      >
        {/* Subtle top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(15,123,160,0.07) 0%, transparent 75%)" }} />

        <div className="w-full max-w-[400px] space-y-6 relative z-10">

          {/* Mobile logo */}
          <div className="flex flex-col items-center gap-1 lg:hidden">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #0B1628, #0F7BA0)", boxShadow: "0 4px 20px rgba(15,123,160,0.35)" }}>
              <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
                <path d="M16 3L3 11.5V29H11V21h10v8h8V11.5L16 3z" fill="white" opacity="0.95" />
              </svg>
            </div>
            <div className="text-center">
              <div className="font-black text-lg text-foreground">عقار إنسايت</div>
              <div className="text-[11px] font-semibold" style={{ color: "#C9A84C" }}>Aqar Insight™</div>
            </div>
          </div>

          {/* ── CARD ── */}
          <div
            className="rounded-[28px] overflow-hidden"
            style={{
              background: "#FFFFFF",
              boxShadow: "0 0 0 1px rgba(15,123,160,0.08), 0 8px 40px rgba(11,22,40,0.10), 0 2px 8px rgba(11,22,40,0.06)",
            }}
          >
            {/* Card top accent bar */}
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #0B1628 0%, #0F7BA0 50%, #C9A84C 100%)" }} />

            <div className="p-8 space-y-7">
              {/* Header */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(15,123,160,0.1)" }}>
                    <LockKeyhole className="w-3.5 h-3.5" style={{ color: "#0F7BA0" }} />
                  </div>
                  <h2 className="text-[22px] font-black text-foreground tracking-tight">تسجيل الدخول</h2>
                </div>
                <p className="text-[13px] text-muted-foreground pr-9">
                  مرحباً بعودتك — أدخل بياناتك للوصول إلى حسابك
                </p>
              </div>

              <form onSubmit={e => void handleSubmit(e)} className="space-y-5" noValidate>

                {/* ── Identifier ── */}
                <div className="space-y-2">
                  <label htmlFor="identifier" className="text-[12px] font-bold tracking-wide uppercase text-muted-foreground block">
                    اسم المستخدم أو البريد الإلكتروني
                  </label>
                  <div
                    className="flex items-center gap-3 rounded-2xl px-4 h-[52px] transition-all duration-200"
                    style={{
                      background:  focusId ? "#F0F9FF" : "#F8FAFC",
                      border:      `1.5px solid ${focusId ? "#0F7BA0" : "#E2E8F0"}`,
                      boxShadow:   focusId ? "0 0 0 4px rgba(15,123,160,0.08)" : "none",
                    }}
                  >
                    <User className="w-4 h-4 shrink-0 transition-colors" style={{ color: focusId ? "#0F7BA0" : "#94A3B8" }} />
                    <input
                      id="identifier"
                      type="text"
                      autoComplete="username"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      onFocus={() => setFocusId(true)}
                      onBlur={() => setFocusId(false)}
                      placeholder="admin أو example@email.com"
                      disabled={loading}
                      required
                      className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/40 font-medium"
                    />
                  </div>
                </div>

                {/* ── Password ── */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-[12px] font-bold tracking-wide uppercase text-muted-foreground">
                      كلمة المرور
                    </label>
                    <Link href="/forgot-password"
                      className="text-[12px] font-semibold transition-all hover:opacity-70"
                      style={{ color: "#0F7BA0" }}>
                      نسيت كلمة المرور؟
                    </Link>
                  </div>
                  <div
                    className="flex items-center gap-3 rounded-2xl px-4 h-[52px] transition-all duration-200"
                    style={{
                      background: focusPw ? "#F0F9FF" : "#F8FAFC",
                      border:     `1.5px solid ${focusPw ? "#0F7BA0" : "#E2E8F0"}`,
                      boxShadow:  focusPw ? "0 0 0 4px rgba(15,123,160,0.08)" : "none",
                    }}
                  >
                    <LockKeyhole className="w-4 h-4 shrink-0 transition-colors" style={{ color: focusPw ? "#0F7BA0" : "#94A3B8" }} />
                    <input
                      id="password"
                      type={showPass ? "text" : "password"}
                      autoComplete="current-password"
                      autoCapitalize="none"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onFocus={() => setFocusPw(true)}
                      onBlur={() => setFocusPw(false)}
                      placeholder="••••••••"
                      disabled={loading}
                      required
                      className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/40 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(p => !p)}
                      tabIndex={-1}
                      className="shrink-0 p-1 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* ── Error ── */}
                {error && (
                  <div role="alert"
                    className="flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm"
                    style={{ background: "#FFF1F2", borderColor: "#FFD6DA", color: "#BE123C" }}
                  >
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-black"
                      style={{ background: "#FFD6DA", color: "#BE123C" }}>!</div>
                    <span className="font-medium">{error}</span>
                  </div>
                )}

                {/* ── Submit button ── */}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="relative w-full h-[54px] rounded-2xl text-sm font-black text-white overflow-hidden transition-all duration-200 flex items-center justify-center gap-2.5"
                  style={{
                    background: canSubmit
                      ? "linear-gradient(135deg, #0B1628 0%, #0F3A5C 45%, #0F7BA0 100%)"
                      : "#CBD5E1",
                    boxShadow: canSubmit ? "0 6px 24px rgba(15,123,160,0.35), 0 2px 8px rgba(11,22,40,0.2)" : "none",
                    transform: canSubmit ? "translateY(0)" : undefined,
                  }}
                  onMouseEnter={e => { if (canSubmit) (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
                >
                  {/* Shimmer overlay */}
                  {canSubmit && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                      <div className="absolute inset-0 opacity-10"
                        style={{ background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.6) 50%, transparent 60%)", animation: "shimmer 3s infinite" }} />
                    </div>
                  )}
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>جارٍ التحقق…</span></>
                  ) : (
                    <span className="text-[15px]">دخول إلى حسابي</span>
                  )}
                </button>
              </form>

              {/* ── Trust row ── */}
              <div className="flex items-center justify-center gap-4 pt-1">
                {[
                  { icon: <ShieldCheck className="w-3.5 h-3.5" />, text: "اتصال آمن" },
                  { icon: <BadgeCheck  className="w-3.5 h-3.5" />, text: "بيانات مشفرة" },
                ].map(t => (
                  <div key={t.text} className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "#64748B" }}>
                    <span style={{ color: "#0F7BA0" }}>{t.icon}</span>
                    {t.text}
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: "#F1F5F9" }} />
                <span className="text-[11px] font-semibold text-muted-foreground/50">أو</span>
                <div className="flex-1 h-px" style={{ background: "#F1F5F9" }} />
              </div>

              {/* Signup CTA */}
              <div className="rounded-2xl p-4 text-center"
                style={{ background: "linear-gradient(135deg, #F0F9FF, #F8FAFC)", border: "1.5px solid #E0F2FE" }}>
                <p className="text-[13px] text-muted-foreground">
                  ليس لديك حساب بعد؟
                </p>
                <Link href="/signup"
                  className="inline-flex items-center gap-1.5 mt-1.5 text-[14px] font-black transition-all hover:opacity-80"
                  style={{ color: "#0B1628" }}>
                  أنشئ حسابك مجاناً الآن
                  <span className="text-lg leading-none" style={{ color: "#C9A84C" }}>←</span>
                </Link>
              </div>

            </div>
          </div>

          {/* Bottom note */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/60">
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: "#10B981" }} />
            <span>بياناتك محمية وفق أعلى معايير الأمان • SSL 256-bit</span>
          </div>
        </div>
      </div>

      {/* Shimmer keyframe */}
      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
