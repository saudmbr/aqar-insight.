import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import {
  Eye, EyeOff, Loader2, LockKeyhole, Mail, User,
  Briefcase, Wrench, Search, ChevronDown, CheckCircle2, AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { LogoBrand } from "@/components/logo-brand";


const CATEGORIES = [
  "بناء وتشييد", "تشطيبات وديكور", "كهرباء ومياه", "تكييف وتبريد", "دهانات", "أرضيات",
  "مطابخ", "مصاعد", "نظافة ومكافحة حشرات", "تصميم داخلي", "تصميم معماري", "تقييم عقاري",
  "إدارة عقارات", "تصوير عقاري", "صيانة", "مقاولات", "مواد بناء", "أخرى",
];

type AccountType = "user" | "real_estate_marketer" | "service_provider";

const ACCOUNT_TYPES = [
  { key: "user"                 as AccountType, label: "عميل / باحث عن عقار",  sub: "أبحث عن شراء أو استئجار عقار", icon: <Search    className="w-4 h-4" /> },
  { key: "real_estate_marketer" as AccountType, label: "مسوّق عقاري",           sub: "أعمل في تسويق وبيع العقارات",  icon: <Briefcase className="w-4 h-4" /> },
  { key: "service_provider"     as AccountType, label: "مزوّد خدمة عقارية",     sub: "أقدم خدمات متعلقة بالعقار",   icon: <Wrench    className="w-4 h-4" /> },
];

// ── Geometric background pattern ─────────────────────────────────────────────
const BgPattern = () => (
  <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="sgp" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
        <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#sgp)" />
  </svg>
);

// ── Signup illustration ───────────────────────────────────────────────────────
const SignupIllustration = () => (
  <svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg"
    className="w-full max-w-[280px]" aria-hidden="true">
    <circle cx="150" cy="150" r="120" fill="rgba(15,123,160,0.06)" />
    <circle cx="150" cy="150" r="80"  fill="rgba(15,123,160,0.05)" />
    <g transform="translate(14, 120)">
      <polygon points="50,0 0,32 100,32" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      <rect x="68" y="-14" width="10" height="20" rx="1" fill="rgba(255,255,255,0.15)" />
      <rect x="8" y="30" width="84" height="60" rx="2" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <rect x="37" y="62" width="18" height="28" rx="2" fill="rgba(15,123,160,0.5)" />
      <circle cx="50" cy="77" r="1.5" fill="rgba(255,255,255,0.6)" />
      <rect x="14" y="40" width="18" height="16" rx="1.5" fill="rgba(15,123,160,0.5)" />
      <rect x="68" y="40" width="18" height="16" rx="1.5" fill="rgba(15,123,160,0.4)" />
      <line x1="23" y1="40" x2="23" y2="56" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
      <line x1="14" y1="48" x2="32" y2="48" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
    </g>
    <g transform="translate(110, 52)">
      <polygon points="40,0 33,22 47,22" fill="rgba(255,255,255,0.85)" />
      <rect x="38.5" y="0" width="3" height="10" fill="rgba(201,168,76,0.8)" />
      <rect x="28" y="20" width="24" height="10" rx="2" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      <rect x="30" y="28" width="20" height="160" rx="2" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      {[38,52,66,80,94,108,122,136,150,164].map(y => (
        <g key={y}>
          <rect x="33" y={y} width="5" height="7" rx="1" fill="rgba(15,123,160,0.65)" />
          <rect x="41" y={y} width="5" height="7" rx="1" fill="rgba(15,123,160,0.45)" />
        </g>
      ))}
      <rect x="34" y="172" width="12" height="16" rx="1" fill="rgba(15,123,160,0.5)" />
    </g>
    <g transform="translate(196, 100)">
      <rect x="0" y="0" width="80" height="8" rx="2" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      <rect x="4" y="6" width="72" height="122" rx="2" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
      {[16,32,48,64,80,96].map(y => (
        <g key={y}>
          <rect x="10" y={y} width="14" height="10" rx="1.5" fill="rgba(15,123,160,0.5)" />
          <rect x="32" y={y} width="14" height="10" rx="1.5" fill="rgba(15,123,160,0.35)" />
          <rect x="54" y={y} width="14" height="10" rx="1.5" fill="rgba(15,123,160,0.45)" />
        </g>
      ))}
      <rect x="28" y="106" width="24" height="22" rx="2" fill="rgba(15,123,160,0.45)" />
    </g>
    <rect x="14" y="248" width="272" height="2" rx="1" fill="rgba(255,255,255,0.1)" />
    <path d="M55 248 Q150 260 245 248" stroke="rgba(15,123,160,0.3)" strokeWidth="1" fill="none" strokeDasharray="4 3" />
    <g transform="translate(138, 258)">
      <circle cx="12" cy="8" r="7" stroke="rgba(201,168,76,0.7)" strokeWidth="2" fill="none" />
      <rect x="17" y="7" width="14" height="2.5" rx="1" fill="rgba(201,168,76,0.7)" />
      <rect x="27" y="9.5" width="2.5" height="4" rx="0.5" fill="rgba(201,168,76,0.7)" />
      <rect x="22" y="9.5" width="2.5" height="3" rx="0.5" fill="rgba(201,168,76,0.7)" />
    </g>
    <circle cx="30"  cy="62"  r="1.5" fill="rgba(255,255,255,0.3)" />
    <circle cx="270" cy="78"  r="1"   fill="rgba(255,255,255,0.25)" />
    <circle cx="96"  cy="96"  r="1"   fill="rgba(255,255,255,0.2)" />
    <circle cx="260" cy="138" r="1.5" fill="rgba(255,255,255,0.2)" />
  </svg>
);

// ── Field label component ─────────────────────────────────────────────────────
function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] font-black uppercase tracking-widest text-muted-foreground block">
        {label}{required && <span className="text-red-400 mr-0.5 normal-case">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground/70">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full h-[46px] rounded-xl border text-[13.5px] text-foreground bg-[#F7FAFD] outline-none transition-all placeholder:text-muted-foreground/40 font-medium";
const focusH = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "#0F7BA0";
    e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(15,123,160,0.08)";
    e.currentTarget.style.background  = "#EFF8FF";
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "#DFE8F0";
    e.currentTarget.style.boxShadow   = "none";
    e.currentTarget.style.background  = "#F7FAFD";
  },
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Signup() {
  const { signup } = useAuth();
  const [, navigate] = useLocation();

  const [fullName,         setFullName]         = useState("");
  const [username,         setUsername]         = useState("");
  const [email,            setEmail]            = useState("");
  const [password,         setPassword]         = useState("");
  const [confirmPassword,  setConfirmPassword]  = useState("");
  const [showPass,         setShowPass]         = useState(false);
  const [showConfirmPass,  setShowConfirmPass]  = useState(false);
  const [accountType,      setAccountType]      = useState<AccountType>("user");
  const [serviceCategory,  setServiceCategory]  = useState("");
  const [customCategory,   setCustomCategory]   = useState("");
  const [termsAccepted,    setTermsAccepted]    = useState(false);
  const [error,  setError]  = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isOther = serviceCategory === "أخرى";
  const finalCategory = isOther ? (customCategory.trim() ? `أخرى: ${customCategory.trim()}` : "") : serviceCategory;

  const validate = (): string | null => {
    if (!fullName.trim() || fullName.trim().length < 2)  return "الاسم الكامل يجب أن يكون حرفين على الأقل";
    if (!username.trim() || username.trim().length < 3)  return "اسم المستخدم يجب أن يكون 3 أحرف على الأقل";
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim()))        return "اسم المستخدم: أحرف إنجليزية وأرقام وشرطة سفلية فقط";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "يرجى إدخال بريد إلكتروني صحيح";
    if (password.length < 8)                              return "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
    if (password !== confirmPassword)                     return "كلمة المرور وتأكيدها غير متطابقتين";
    if (accountType === "service_provider" && !serviceCategory) return "يرجى اختيار تصنيف الخدمة";
    if (accountType === "service_provider" && isOther && !customCategory.trim()) return "يرجى كتابة نوع خدمتك";
    if (!termsAccepted) return "يجب الموافقة على الشروط والأحكام للمتابعة";
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    setLoading(true);
    try {
      const user = await signup(
        fullName.trim(),
        username.trim(),
        email.trim(),
        password,
        accountType,
        accountType === "service_provider" ? finalCategory : undefined,
      );
      if (user.role === "real_estate_marketer") navigate("/marketer/dashboard");
      else if (user.role === "service_provider") navigate("/services/dashboard");
      else navigate("/");
    } catch {
      setError("حدث خطأ في الاتصال، يرجى المحاولة مجدداً");
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = confirmPassword === "" || password === confirmPassword;

  return (
    <div dir="rtl" className="min-h-screen flex overflow-hidden" style={{ background: "#0B1628" }}>

      {/* ══════════════════════════════════════════════════════════════
          RIGHT — HERO PANEL
      ══════════════════════════════════════════════════════════════ */}
      <div
        className="hidden lg:flex flex-col justify-between w-[44%] shrink-0 relative overflow-hidden px-12 py-12"
        style={{ background: "linear-gradient(160deg, #060D1C 0%, #091828 40%, #0B2340 70%, #0D3560 100%)" }}
      >
        <BgPattern />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(15,123,160,0.15) 0%, transparent 68%)" }} />
        <div className="absolute top-0 right-0 w-56 h-56 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)" }} />

        {/* Logo — matches site */}
        <div className="relative z-10">
          <LogoBrand variant="sidebar" linkTo="/" />
        </div>

        {/* Illustration + headline */}
        <div className="relative z-10 flex flex-col items-center gap-5">
          <SignupIllustration />
          <div className="text-center space-y-3 max-w-xs">
            <h1 className="text-[26px] font-black text-white leading-snug tracking-tight">
              ابدأ رحلتك العقارية<br />
              <span style={{ color: "#0F7BA0" }}>بخطوة واحدة</span>
            </h1>
            <p className="text-white/45 text-[13px] leading-relaxed">
              سواء كنت عميلاً أو مسوّقاً أو مزوّد خدمة — منصة عقار إنسايت تخدم احتياجاتك
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-white/20 text-[11px]">© {new Date().getFullYear()} عقار إنسايت — جميع الحقوق محفوظة</p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          LEFT — FORM PANEL
      ══════════════════════════════════════════════════════════════ */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-5 py-10 relative"
        style={{ background: "#F6F8FC" }}
      >
        <div className="absolute top-0 inset-x-0 h-40 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 100% at 50% 0%, rgba(15,123,160,0.06), transparent)" }} />

        <div className="w-full max-w-[430px] space-y-5 relative z-10">

          {/* Mobile logo */}
          <div className="flex flex-col items-center gap-1 lg:hidden mb-1">
            <LogoBrand variant="hero" linkTo="/" />
          </div>

          {/* Card */}
          <div
            className="rounded-[26px] overflow-hidden"
            style={{ background: "#fff", boxShadow: "0 0 0 1px rgba(15,123,160,0.07), 0 8px 40px rgba(11,22,40,0.09)" }}
          >
            <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, #0B1628 0%, #0F7BA0 55%, #C9A84C 100%)" }} />

            <div className="px-7 pt-6 pb-7 space-y-5">
              {/* Header */}
              <div>
                <h2 className="text-[20px] font-black text-foreground tracking-tight">إنشاء حساب جديد</h2>
                <p className="text-[12.5px] text-muted-foreground mt-0.5">أنشئ حسابك للاستفادة من جميع خدمات المنصة</p>
              </div>

              <form onSubmit={e => void handleSubmit(e)} className="space-y-4" noValidate>

                {/* Account type */}
                <div className="space-y-2">
                  <p className="text-[12px] font-black uppercase tracking-widest text-muted-foreground">نوع الحساب</p>
                  <div className="grid grid-cols-1 gap-2">
                    {ACCOUNT_TYPES.map(t => {
                      const active = accountType === t.key;
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => {
                            setAccountType(t.key);
                            if (t.key !== "service_provider") { setServiceCategory(""); setCustomCategory(""); }
                          }}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl border text-right transition-all"
                          style={{ borderColor: active ? "#0F7BA0" : "#E2E8F0", background: active ? "rgba(15,123,160,0.04)" : "#FAFBFD" }}
                        >
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all"
                            style={{ background: active ? "rgba(15,123,160,0.12)" : "#F0F4F8", color: active ? "#0F7BA0" : "#94A3B8" }}>
                            {t.icon}
                          </div>
                          <div className="flex-1 text-right min-w-0">
                            <p className="text-[13px] font-bold leading-tight" style={{ color: active ? "#0F7BA0" : "#1E293B" }}>{t.label}</p>
                            <p className="text-[11px] text-muted-foreground/80 truncate mt-0.5">{t.sub}</p>
                          </div>
                          <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                            style={{ borderColor: active ? "#0F7BA0" : "#CBD5E1", background: active ? "#0F7BA0" : "transparent" }}>
                            {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Service category */}
                {accountType === "service_provider" && (
                  <div className="rounded-2xl p-4 space-y-3" style={{ background: "#F7FAFD", border: "1px solid #E2E8F0" }}>
                    <Field label="تصنيف الخدمة" required>
                      <div className="relative">
                        <Wrench className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                        <select
                          value={serviceCategory}
                          onChange={e => { setServiceCategory(e.target.value); if (e.target.value !== "أخرى") setCustomCategory(""); }}
                          className={`${inputCls} pr-9 pl-8 appearance-none`}
                          style={{ borderColor: "#DFE8F0", color: "#111827", background: "#F7FAFD" }}
                          {...focusH}
                        >
                          <option value="" style={{ color: "#111827", background: "#fff" }}>اختر تصنيف خدمتك</option>
                          {CATEGORIES.map(c => <option key={c} value={c} style={{ color: "#111827", background: "#fff" }}>{c}</option>)}
                        </select>
                        <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                      </div>
                    </Field>
                    {isOther && (
                      <Field label="اكتب نوع الخدمة" required>
                        <input
                          type="text"
                          value={customCategory}
                          onChange={e => setCustomCategory(e.target.value)}
                          placeholder="مثال: تنسيق حدائق، ري..."
                          className={`${inputCls} px-4`}
                          style={{ borderColor: "#DFE8F0" }}
                          {...focusH}
                        />
                      </Field>
                    )}
                  </div>
                )}

                {/* Full name */}
                <Field label="الاسم الكامل" required>
                  <div className="relative">
                    <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      autoComplete="name"
                      autoCapitalize="words"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="محمد العمري"
                      className={`${inputCls} pr-9 pl-4`}
                      style={{ borderColor: "#DFE8F0" }}
                      {...focusH}
                    />
                  </div>
                </Field>

                {/* Username — no @ prefix */}
                <Field label="اسم المستخدم" required hint="أحرف إنجليزية، أرقام، وشرطة سفلية فقط">
                  <input
                    type="text"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="m_alomari"
                    dir="ltr"
                    className={`${inputCls} px-4 font-mono`}
                    style={{ borderColor: "#DFE8F0" }}
                    {...focusH}
                  />
                </Field>

                {/* Email */}
                <Field label="البريد الإلكتروني" required>
                  <div className="relative">
                    <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="example@email.com"
                      dir="ltr"
                      className={`${inputCls} pr-9 pl-4`}
                      style={{ borderColor: "#DFE8F0" }}
                      {...focusH}
                    />
                  </div>
                </Field>

                {/* Password */}
                <Field label="كلمة المرور" required hint="8 أحرف على الأقل">
                  <div className="relative">
                    <LockKeyhole className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      type={showPass ? "text" : "password"}
                      autoComplete="new-password"
                      autoCapitalize="none"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`${inputCls} pr-9 pl-10`}
                      style={{ borderColor: "#DFE8F0" }}
                      {...focusH}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(p => !p)}
                      tabIndex={-1}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </Field>

                {/* Confirm Password */}
                <Field label="تأكيد كلمة المرور" required>
                  <div className="relative">
                    <LockKeyhole className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      type={showConfirmPass ? "text" : "password"}
                      autoComplete="new-password"
                      autoCapitalize="none"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`${inputCls} pr-9 pl-10`}
                      style={{ borderColor: !passwordsMatch ? "#EF4444" : "#DFE8F0" }}
                      onFocus={e => { e.currentTarget.style.borderColor = !passwordsMatch ? "#EF4444" : "#0F7BA0"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(15,123,160,0.08)"; e.currentTarget.style.background = "#EFF8FF"; }}
                      onBlur={e => { e.currentTarget.style.borderColor = !passwordsMatch ? "#EF4444" : "#DFE8F0"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "#F7FAFD"; }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(p => !p)}
                      tabIndex={-1}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {!passwordsMatch && confirmPassword !== "" && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />
                      <p className="text-[11px] text-red-500 font-semibold">كلمة المرور غير متطابقة</p>
                    </div>
                  )}
                  {passwordsMatch && confirmPassword !== "" && password !== "" && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                      <p className="text-[11px] text-green-600 font-semibold">كلمتا المرور متطابقتان</p>
                    </div>
                  )}
                </Field>

                {/* Terms */}
                <div
                  className="rounded-xl px-4 py-3.5"
                  style={{
                    background: termsAccepted ? "rgba(15,123,160,0.03)" : "#F7FAFD",
                    border: `1.5px solid ${termsAccepted ? "rgba(15,123,160,0.25)" : "#DFE8F0"}`,
                    transition: "all 0.2s",
                  }}
                >
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <div className="relative shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={e => setTermsAccepted(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className="w-[18px] h-[18px] rounded-md flex items-center justify-center transition-all"
                        style={{ background: termsAccepted ? "#0F7BA0" : "#fff", border: `2px solid ${termsAccepted ? "#0F7BA0" : "#CBD5E1"}` }}
                      >
                        {termsAccepted && <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />}
                      </div>
                    </div>
                    <span className="text-[12.5px] leading-relaxed text-foreground">
                      أوافق على{" "}
                      <a href="/terms" target="_blank" rel="noopener noreferrer"
                        className="font-bold underline underline-offset-2"
                        style={{ color: "#0F7BA0" }}
                        onClick={e => e.stopPropagation()}>
                        الشروط والأحكام
                      </a>
                      {" "}و{" "}
                      <a href="/privacy" target="_blank" rel="noopener noreferrer"
                        className="font-bold underline underline-offset-2"
                        style={{ color: "#0F7BA0" }}
                        onClick={e => e.stopPropagation()}>
                        سياسة الخصوصية
                      </a>
                    </span>
                  </label>
                </div>

                {/* Error */}
                {error && (
                  <div role="alert" className="flex items-center gap-2.5 rounded-xl border px-4 py-3 text-[13px]"
                    style={{ background: "#FFF1F2", borderColor: "#FECDD3", color: "#BE123C" }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-black"
                      style={{ background: "#FECDD3", color: "#BE123C" }}>!</div>
                    <span className="font-semibold">{error}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[52px] rounded-2xl text-[14px] font-black text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: loading ? "#CBD5E1" : "linear-gradient(130deg, #0B1628 0%, #0F3A5C 50%, #0F7BA0 100%)",
                    boxShadow: loading ? "none" : "0 5px 20px rgba(15,123,160,0.3)",
                  }}
                  onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.opacity = "0.92"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /><span>جارٍ إنشاء الحساب…</span></>
                    : <span>إنشاء الحساب</span>
                  }
                </button>
              </form>

              {/* Login link */}
              <p className="text-center text-[12.5px] text-muted-foreground">
                لديك حساب بالفعل؟{" "}
                <Link href="/login" className="font-black hover:opacity-75 transition-opacity" style={{ color: "#0F7BA0" }}>
                  تسجيل الدخول
                </Link>
              </p>
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

