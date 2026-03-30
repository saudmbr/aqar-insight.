import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Loader2, LockKeyhole, User, ShieldCheck, BadgeCheck } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

// ── Geometric background pattern ──────────────────────────────────────────────
const BgPattern = () => (
  <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="lgp" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
        <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#lgp)" />
  </svg>
);

// ── Main real-estate illustration ─────────────────────────────────────────────
const RealEstateIllustration = () => (
  <svg
    viewBox="0 0 320 380"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full max-w-[300px]"
    aria-hidden="true"
  >
    {/* ── Background glow circles ── */}
    <circle cx="160" cy="200" r="140" fill="rgba(15,123,160,0.07)" />
    <circle cx="160" cy="200" r="100" fill="rgba(15,123,160,0.06)" />

    {/* ── Ground base line ── */}
    <rect x="30" y="318" width="260" height="2" rx="1" fill="rgba(255,255,255,0.12)" />

    {/* ── Far-left small building ── */}
    <rect x="32" y="248" width="36" height="70" rx="3" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
    <rect x="38" y="258" width="7" height="8" rx="1" fill="rgba(15,123,160,0.5)" />
    <rect x="53" y="258" width="7" height="8" rx="1" fill="rgba(15,123,160,0.3)" />
    <rect x="38" y="274" width="7" height="8" rx="1" fill="rgba(15,123,160,0.4)" />
    <rect x="53" y="274" width="7" height="8" rx="1" fill="rgba(15,123,160,0.5)" />
    <rect x="38" y="290" width="7" height="8" rx="1" fill="rgba(15,123,160,0.3)" />
    <rect x="53" y="290" width="7" height="8" rx="1" fill="rgba(15,123,160,0.4)" />

    {/* ── Left mid building ── */}
    <rect x="76" y="200" width="48" height="118" rx="3" fill="rgba(255,255,255,0.09)" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
    <rect x="83" y="212" width="9" height="10" rx="1.5" fill="rgba(15,123,160,0.55)" />
    <rect x="99" y="212" width="9" height="10" rx="1.5" fill="rgba(15,123,160,0.35)" />
    <rect x="83" y="230" width="9" height="10" rx="1.5" fill="rgba(15,123,160,0.45)" />
    <rect x="99" y="230" width="9" height="10" rx="1.5" fill="rgba(15,123,160,0.55)" />
    <rect x="83" y="248" width="9" height="10" rx="1.5" fill="rgba(15,123,160,0.35)" />
    <rect x="99" y="248" width="9" height="10" rx="1.5" fill="rgba(15,123,160,0.5)" />
    <rect x="83" y="266" width="9" height="10" rx="1.5" fill="rgba(15,123,160,0.45)" />
    <rect x="99" y="266" width="9" height="10" rx="1.5" fill="rgba(15,123,160,0.3)" />
    <rect x="83" y="284" width="9" height="10" rx="1.5" fill="rgba(15,123,160,0.4)" />
    <rect x="99" y="284" width="9" height="10" rx="1.5" fill="rgba(15,123,160,0.5)" />

    {/* ── Central tower (Kingdom-inspired) ── */}
    {/* Spire */}
    <polygon points="160,42 152,80 168,80" fill="rgba(255,255,255,0.9)" />
    <rect x="158" y="42" width="4" height="12" fill="rgba(201,168,76,0.8)" />
    {/* Tower body */}
    <rect x="140" y="78" width="40" height="240" rx="3" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
    {/* Tower top detail */}
    <rect x="136" y="78" width="48" height="16" rx="3" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
    {/* Tower windows - column 1 */}
    {[100,120,140,160,180,200,220,240,260,280].map(y => (
      <rect key={`tw1-${y}`} x="146" y={y} width="9" height="12" rx="1.5" fill="rgba(15,123,160,0.65)" />
    ))}
    {/* Tower windows - column 2 */}
    {[100,120,140,160,180,200,220,240,260,280].map(y => (
      <rect key={`tw2-${y}`} x="163" y={y} width="9" height="12" rx="1.5" fill="rgba(15,123,160,0.5)" />
    ))}
    {/* Central teal accent */}
    <rect x="155" y="175" width="10" height="40" rx="2" fill="rgba(15,123,160,0.4)" />
    {/* Tower entrance */}
    <rect x="152" y="296" width="16" height="22" rx="2" fill="rgba(15,123,160,0.5)" />

    {/* ── Right mid building ── */}
    <rect x="196" y="188" width="50" height="130" rx="3" fill="rgba(255,255,255,0.09)" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
    <rect x="196" y="184" width="50" height="10" rx="2" fill="rgba(255,255,255,0.13)" />
    {[200,218,236,254,272,290].map(y => (
      <g key={`rb-${y}`}>
        <rect x="203" y={y} width="9" height="10" rx="1.5" fill="rgba(15,123,160,0.5)" />
        <rect x="220" y={y} width="9" height="10" rx="1.5" fill="rgba(15,123,160,0.35)" />
        <rect x="228" y={y} width="9" height="10" rx="1.5" fill="rgba(15,123,160,0.45)" />
      </g>
    ))}

    {/* ── Far-right small building ── */}
    <rect x="252" y="255" width="36" height="63" rx="3" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
    <rect x="258" y="264" width="7" height="8" rx="1" fill="rgba(15,123,160,0.4)" />
    <rect x="272" y="264" width="7" height="8" rx="1" fill="rgba(15,123,160,0.5)" />
    <rect x="258" y="280" width="7" height="8" rx="1" fill="rgba(15,123,160,0.35)" />
    <rect x="272" y="280" width="7" height="8" rx="1" fill="rgba(15,123,160,0.45)" />
    <rect x="258" y="296" width="7" height="8" rx="1" fill="rgba(15,123,160,0.5)" />
    <rect x="272" y="296" width="7" height="8" rx="1" fill="rgba(15,123,160,0.3)" />

    {/* ── Location pin ── */}
    <circle cx="160" cy="352" r="5" fill="rgba(201,168,76,0.7)" />
    <path d="M160 342 Q155 349 160 355 Q165 349 160 342Z" fill="rgba(201,168,76,0.8)" />

    {/* ── Subtle arc below buildings ── */}
    <path d="M60 330 Q160 345 260 330" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" fill="none" />

    {/* ── Stars / sparkles ── */}
    <circle cx="60"  cy="65"  r="1.5" fill="rgba(255,255,255,0.35)" />
    <circle cx="258" cy="55"  r="1"   fill="rgba(255,255,255,0.3)" />
    <circle cx="88"  cy="100" r="1"   fill="rgba(255,255,255,0.2)" />
    <circle cx="240" cy="112" r="1.5" fill="rgba(255,255,255,0.25)" />
    <circle cx="40"  cy="145" r="1"   fill="rgba(255,255,255,0.2)" />
    <circle cx="285" cy="165" r="1"   fill="rgba(255,255,255,0.2)" />
  </svg>
);

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
          RIGHT — HERO PANEL  (RTL: appears on right side)
      ══════════════════════════════════════════════════════════════ */}
      <div
        className="hidden lg:flex flex-col justify-between w-[50%] shrink-0 relative overflow-hidden px-14 py-14"
        style={{ background: "linear-gradient(160deg, #060D1C 0%, #091828 40%, #0B2340 70%, #0D3560 100%)" }}
      >
        <BgPattern />

        {/* Ambient glows */}
        <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[480px] h-[480px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(15,123,160,0.16) 0%, transparent 68%)" }} />
        <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)" }} />

        {/* ── Logo ── */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #0F7BA0, #0A5C78)", boxShadow: "0 4px 18px rgba(15,123,160,0.45)" }}>
            <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
              <path d="M16 3L3 11.5V29H11V20h10v9h8V11.5L16 3z" fill="white" opacity="0.95" />
              <rect x="13" y="20" width="6" height="9" rx="1" fill="#0F7BA0" opacity="0.55" />
            </svg>
          </div>
          <div>
            <div className="text-white font-black text-xl leading-none tracking-tight">عقار إنسايت</div>
            <div className="text-[11px] font-medium tracking-wider mt-0.5" style={{ color: "#C9A84C" }}>Aqar Insight™</div>
          </div>
        </div>

        {/* ── Illustration + headline ── */}
        <div className="relative z-10 flex flex-col items-center gap-6">
          <RealEstateIllustration />

          <div className="text-center space-y-3 max-w-xs">
            <h1 className="text-[28px] font-black text-white leading-snug tracking-tight">
              بوابتك للسوق<br />
              <span style={{ color: "#0F7BA0" }}>العقاري السعودي</span>
            </h1>
            <p className="text-white/45 text-[13.5px] leading-relaxed">
              تحليلات دقيقة، إعلانات موثوقة، وخبراء معتمدون — في منصة واحدة متكاملة
            </p>
          </div>
        </div>

        {/* ── Trust badges ── */}
        <div className="relative z-10 space-y-4">
          <div className="flex gap-2.5 flex-wrap">
            {[
              { icon: <ShieldCheck className="w-3.5 h-3.5" />, label: "اتصال مشفّر SSL" },
              { icon: <BadgeCheck  className="w-3.5 h-3.5" />, label: "حسابات موثّقة" },
            ].map(b => (
              <div key={b.label}
                className="flex items-center gap-2 rounded-xl px-3.5 py-2"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <span style={{ color: "#C9A84C" }}>{b.icon}</span>
                <span className="text-white/65 text-[11.5px] font-semibold">{b.label}</span>
              </div>
            ))}
          </div>
          <p className="text-white/20 text-[11px]">© {new Date().getFullYear()} عقار إنسايت — جميع الحقوق محفوظة</p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          LEFT — FORM PANEL
      ══════════════════════════════════════════════════════════════ */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-5 py-12 relative"
        style={{ background: "#F6F8FC" }}
      >
        {/* Top glow */}
        <div className="absolute top-0 inset-x-0 h-40 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 100% at 50% 0%, rgba(15,123,160,0.06), transparent)" }} />

        <div className="w-full max-w-[390px] space-y-5 relative z-10">

          {/* Mobile logo */}
          <div className="flex flex-col items-center gap-1 lg:hidden mb-2">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #0B1628, #0F7BA0)", boxShadow: "0 4px 18px rgba(15,123,160,0.35)" }}>
              <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
                <path d="M16 3L3 11.5V29H11V20h10v9h8V11.5L16 3z" fill="white" opacity="0.95" />
              </svg>
            </div>
            <div className="text-center mt-1">
              <div className="font-black text-lg text-foreground">عقار إنسايت</div>
              <div className="text-[11px] font-semibold" style={{ color: "#C9A84C" }}>Aqar Insight™</div>
            </div>
          </div>

          {/* ── Card ── */}
          <div
            className="rounded-[26px] overflow-hidden"
            style={{
              background: "#FFFFFF",
              boxShadow: "0 0 0 1px rgba(15,123,160,0.07), 0 8px 40px rgba(11,22,40,0.09)",
            }}
          >
            {/* Accent bar */}
            <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, #0B1628 0%, #0F7BA0 55%, #C9A84C 100%)" }} />

            <div className="px-8 pt-7 pb-8 space-y-6">
              {/* Header */}
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(15,123,160,0.08)" }}>
                    <LockKeyhole className="w-4 h-4" style={{ color: "#0F7BA0" }} />
                  </div>
                  <h2 className="text-[21px] font-black text-foreground tracking-tight">تسجيل الدخول</h2>
                </div>
                <p className="text-[12.5px] text-muted-foreground pr-10">مرحباً بعودتك — أدخل بياناتك للوصول إلى حسابك</p>
              </div>

              <form onSubmit={e => void handleSubmit(e)} className="space-y-4" noValidate>

                {/* Identifier */}
                <div className="space-y-1.5">
                  <label htmlFor="identifier" className="text-[11.5px] font-black uppercase tracking-widest text-muted-foreground block">
                    اسم المستخدم أو البريد الإلكتروني
                  </label>
                  <div
                    className="flex items-center gap-3 rounded-2xl px-4 h-[50px] transition-all duration-200"
                    style={{
                      background: focusId ? "#EFF8FF" : "#F7FAFD",
                      border:     `1.5px solid ${focusId ? "#0F7BA0" : "#DFE8F0"}`,
                      boxShadow:  focusId ? "0 0 0 4px rgba(15,123,160,0.07)" : "none",
                    }}
                  >
                    <User className="w-4 h-4 shrink-0" style={{ color: focusId ? "#0F7BA0" : "#A0AEC0" }} />
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
                      className="flex-1 bg-transparent outline-none text-[13.5px] text-foreground placeholder:text-muted-foreground/40 font-medium"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-[11.5px] font-black uppercase tracking-widest text-muted-foreground">
                      كلمة المرور
                    </label>
                    <Link href="/forgot-password"
                      className="text-[11.5px] font-semibold hover:opacity-70 transition-opacity"
                      style={{ color: "#0F7BA0" }}>
                      نسيت كلمة المرور؟
                    </Link>
                  </div>
                  <div
                    className="flex items-center gap-3 rounded-2xl px-4 h-[50px] transition-all duration-200"
                    style={{
                      background: focusPw ? "#EFF8FF" : "#F7FAFD",
                      border:     `1.5px solid ${focusPw ? "#0F7BA0" : "#DFE8F0"}`,
                      boxShadow:  focusPw ? "0 0 0 4px rgba(15,123,160,0.07)" : "none",
                    }}
                  >
                    <LockKeyhole className="w-4 h-4 shrink-0" style={{ color: focusPw ? "#0F7BA0" : "#A0AEC0" }} />
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
                      className="flex-1 bg-transparent outline-none text-[13.5px] text-foreground placeholder:text-muted-foreground/40 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(p => !p)}
                      tabIndex={-1}
                      className="shrink-0 p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div role="alert"
                    className="flex items-center gap-3 rounded-2xl border px-4 py-3 text-[13px]"
                    style={{ background: "#FFF1F2", borderColor: "#FECDD3", color: "#BE123C" }}
                  >
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-black flex-shrink-0"
                      style={{ background: "#FECDD3", color: "#BE123C" }}>!</div>
                    <span className="font-semibold">{error}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="relative w-full h-[52px] rounded-2xl text-[14px] font-black text-white overflow-hidden transition-all duration-200 flex items-center justify-center gap-2.5 mt-1"
                  style={{
                    background:  canSubmit ? "linear-gradient(130deg, #0B1628 0%, #0F3A5C 50%, #0F7BA0 100%)" : "#CBD5E1",
                    boxShadow:   canSubmit ? "0 5px 20px rgba(15,123,160,0.32), 0 2px 6px rgba(11,22,40,0.18)" : "none",
                  }}
                  onMouseEnter={e => { if (canSubmit) (e.currentTarget as HTMLButtonElement).style.opacity = "0.93"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /><span>جارٍ التحقق…</span></>
                    : <span>دخول إلى حسابي</span>
                  }
                </button>
              </form>

              {/* Trust micro-row */}
              <div className="flex items-center justify-center gap-4">
                {[
                  { icon: <ShieldCheck className="w-3.5 h-3.5" />, text: "اتصال آمن" },
                  { icon: <BadgeCheck  className="w-3.5 h-3.5" />, text: "بيانات مشفرة" },
                ].map(t => (
                  <div key={t.text} className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "#94A3B8" }}>
                    <span style={{ color: "#0F7BA0" }}>{t.icon}</span>
                    {t.text}
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#F0F4F8]" />
                <span className="text-[11px] font-medium text-muted-foreground/40">أو</span>
                <div className="flex-1 h-px bg-[#F0F4F8]" />
              </div>

              {/* Signup CTA */}
              <div className="rounded-2xl px-5 py-4 text-center"
                style={{ background: "#F0F9FF", border: "1.5px solid #E0F2FE" }}>
                <p className="text-[12.5px] text-muted-foreground mb-1.5">ليس لديك حساب بعد؟</p>
                <Link href="/signup"
                  className="inline-flex items-center gap-1.5 text-[14px] font-black hover:opacity-80 transition-opacity"
                  style={{ color: "#0B1628" }}>
                  أنشئ حسابك مجاناً
                  <span style={{ color: "#C9A84C" }}>←</span>
                </Link>
              </div>
            </div>
          </div>

          <p className="text-center text-[11px] text-muted-foreground/50">
            بياناتك محمية وفق أعلى معايير الأمان
          </p>
        </div>
      </div>
    </div>
  );
}
