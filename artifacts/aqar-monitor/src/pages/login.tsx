import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Loader2, LockKeyhole, User, ShieldCheck, BadgeCheck } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { LogoBrand } from "@/components/logo-brand";

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
        <div className="relative z-10">
          <LogoBrand variant="sidebar" linkTo="/" />
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
          {/* Social icons row */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              {[
                { href: "https://tiktok.com",    title: "TikTok",    color: "rgba(255,255,255,0.95)", path: "M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.53V6.77a4.85 4.85 0 01-1.01-.08z" },
                { href: "https://snapchat.com",  title: "Snapchat",  color: "#FFFC00",               path: "M12.166.8C9.924.8 7.25 1.8 5.79 4.566c-.724 1.363-.582 3.695-.52 4.72a1.16 1.16 0 0 1-.44.038c-.42-.048-.855-.215-1.29-.497a.5.5 0 0 0-.284-.09.86.86 0 0 0-.517.194.706.706 0 0 0-.29.57c0 .486.427.84 1.278 1.053l.196.044c.368.073.614.22.714.427.088.183.056.407-.094.648-.424.685-1.11 1.145-1.94 1.296-.398.072-.8.094-1.22.065a.52.52 0 0 0-.062-.004c-.383 0-.63.217-.676.595-.03.24.013.44.128.59.277.365.947.593 2.044.697.082.01.155.053.21.117a2.42 2.42 0 0 1 .4.763c.048.153.118.248.218.3a.77.77 0 0 0 .356.08c.217 0 .47-.05.742-.103.439-.086.984-.192 1.668-.192.367 0 .748.035 1.13.108.76.14 1.313.612 1.94 1.146.737.633 1.574 1.35 2.965 1.35 1.39 0 2.228-.717 2.965-1.35.627-.534 1.18-1.006 1.94-1.146.382-.073.763-.108 1.13-.108.684 0 1.229.106 1.668.192.272.053.525.103.742.103a.77.77 0 0 0 .356-.08c.1-.052.17-.147.218-.3a2.42 2.42 0 0 1 .4-.763.336.336 0 0 1 .21-.117c1.097-.104 1.767-.332 2.044-.697.115-.15.158-.35.128-.59-.046-.378-.293-.595-.676-.595a.52.52 0 0 0-.062.004c-.42.03-.822.007-1.22-.065-.83-.151-1.516-.611-1.94-1.296-.15-.241-.182-.465-.094-.648.1-.207.346-.354.714-.427l.196-.044c.851-.213 1.278-.567 1.278-1.053a.706.706 0 0 0-.29-.57.86.86 0 0 0-.517-.194.5.5 0 0 0-.284.09c-.435.282-.87.449-1.29.497a1.16 1.16 0 0 1-.44-.038c.062-1.025.204-3.357-.52-4.72C17.082 1.8 14.408.8 12.166.8z" },
                { href: "https://youtube.com",   title: "YouTube",   color: "#FF0000",               path: "M21.593 7.203a2.506 2.506 0 0 0-1.762-1.766C18.265 5.007 12 5 12 5s-6.264-.007-7.831.44a2.56 2.56 0 0 0-1.766 1.778c-.413 1.566-.417 4.814-.417 4.814s-.004 3.264.406 4.814c.23.857.905 1.534 1.763 1.765 1.582.43 7.83.437 7.83.437s6.265.007 7.831-.44a2.515 2.515 0 0 0 1.767-1.763c.414-1.565.417-4.812.417-4.812s.02-3.265-.407-4.83zM9.996 15.005l.005-6 5.207 3.005-5.212 2.995z" },
                { href: "https://instagram.com", title: "Instagram",  color: "#e1306c",               path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" },
                { href: "https://x.com",         title: "X",         color: "rgba(255,255,255,0.9)", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
                { href: "https://linkedin.com",  title: "LinkedIn",  color: "#0A66C2",               path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
                { href: "https://facebook.com",  title: "Facebook",  color: "#1877F2",               path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
              ].map(s => (
                <a key={s.title} href={s.href} target="_blank" rel="noopener noreferrer" title={s.title}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200"
                  style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.06)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = s.color; (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.12)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.4)"; (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.06)"; }}
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden><path d={s.path} /></svg>
                </a>
              ))}
            </div>
            <p className="text-white/20 text-[11px]">© {new Date().getFullYear()} عقار إنسايت — جميع الحقوق محفوظة</p>
          </div>
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
            <LogoBrand variant="hero" linkTo="/" />
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
