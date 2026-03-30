import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import {
  Eye, EyeOff, Loader2, LockKeyhole, Mail, User,
  Briefcase, Wrench, Search, ChevronDown, ArrowLeft, CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { LogoBrand } from "@/components/logo-brand";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const CATEGORIES = [
  "بناء وتشييد", "تشطيبات وديكور", "كهرباء ومياه", "تكييف وتبريد", "دهانات", "أرضيات",
  "مطابخ", "مصاعد", "نظافة ومكافحة حشرات", "تصميم داخلي", "تصميم معماري", "تقييم عقاري",
  "إدارة عقارات", "تصوير عقاري", "صيانة", "مقاولات", "مواد بناء", "أخرى",
];

type AccountType = "user" | "real_estate_marketer" | "service_provider";

const ACCOUNT_TYPES = [
  {
    key: "user"                    as AccountType,
    label: "عميل / باحث عن عقار",
    sub:   "أبحث عن شراء أو استئجار عقار",
    icon:  <Search    className="w-5 h-5" />,
  },
  {
    key: "real_estate_marketer"    as AccountType,
    label: "مسوّق عقاري",
    sub:   "أعمل في تسويق وبيع العقارات",
    icon:  <Briefcase className="w-5 h-5" />,
  },
  {
    key: "service_provider"        as AccountType,
    label: "مزوّد خدمة عقارية",
    sub:   "أقدم خدمات متعلقة بالعقار",
    icon:  <Wrench    className="w-5 h-5" />,
  },
];

// ── Field component ────────────────────────────────────────────────────────────

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] font-bold text-foreground block">
        {label}
        {required && <span className="text-red-500 mr-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ── Input styling helpers ──────────────────────────────────────────────────────

const inputBase = "w-full h-11 rounded-xl border text-sm text-foreground bg-background outline-none transition-all placeholder:text-muted-foreground/50";
const focusHandlers = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "#0F7BA0";
    e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(15,123,160,0.1)";
  },
  onBlur:  (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "#E2E8F0";
    e.currentTarget.style.boxShadow   = "none";
  },
};

// ── Main Component ─────────────────────────────────────────────────────────────

export default function Signup() {
  const { signup } = useAuth();
  const [, navigate] = useLocation();

  const [fullName,         setFullName]         = useState("");
  const [username,         setUsername]         = useState("");
  const [email,            setEmail]            = useState("");
  const [password,         setPassword]         = useState("");
  const [showPass,         setShowPass]         = useState(false);
  const [accountType,      setAccountType]      = useState<AccountType>("user");
  const [serviceCategory,  setServiceCategory]  = useState("");
  const [customCategory,   setCustomCategory]   = useState("");
  const [termsAccepted,    setTermsAccepted]    = useState(false);

  const [error,   setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isOther = serviceCategory === "أخرى";
  const finalCategory = isOther ? (customCategory.trim() ? `أخرى: ${customCategory.trim()}` : "") : serviceCategory;

  const validate = (): string | null => {
    if (!fullName.trim() || fullName.trim().length < 2)
      return "الاسم الكامل يجب أن يكون حرفين على الأقل";
    if (!username.trim() || username.trim().length < 3)
      return "اسم المستخدم يجب أن يكون 3 أحرف على الأقل";
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim()))
      return "اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام وشرطة سفلية فقط";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return "يرجى إدخال بريد إلكتروني صحيح";
    if (password.length < 8)
      return "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
    if (accountType === "service_provider" && !serviceCategory)
      return "يرجى اختيار تصنيف الخدمة";
    if (accountType === "service_provider" && isOther && !customCategory.trim())
      return "يرجى كتابة نوع خدمتك";
    if (!termsAccepted)
      return "يجب الموافقة على الشروط والأحكام للمتابعة";
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/auth/signup`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName:        fullName.trim(),
          username:        username.trim(),
          email:           email.trim(),
          password,
          userType:        accountType,
          serviceCategory: accountType === "service_provider" ? finalCategory : undefined,
        }),
      });
      const data = await res.json() as { success?: boolean; message?: string; role?: string };
      if (!res.ok) { setError(data.message ?? "خطأ في إنشاء الحساب"); return; }

      if (data.role === "real_estate_marketer") navigate("/marketer/dashboard");
      else if (data.role === "service_provider") navigate("/services/dashboard");
      else navigate("/");
    } catch {
      setError("حدث خطأ في الاتصال، يرجى المحاولة مجدداً");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen flex" style={{ background: "#F6F7FA" }}>

      {/* ── Left decorative panel ─────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col items-center justify-center w-[38%] shrink-0 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0B1628 0%, #0F2A45 60%, #0F7BA0 100%)" }}
      >
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 25% 35%, #0F7BA0 0%, transparent 55%), radial-gradient(circle at 75% 70%, #0B1628 0%, transparent 60%)" }} />
        <div className="relative z-10 text-center px-10 space-y-5">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto"
            style={{ background: "rgba(15,123,160,0.25)", border: "1.5px solid rgba(15,123,160,0.4)" }}>
            <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
              <path d="M20 4L4 14v22h10V24h12v12h10V14L20 4z" fill="#0F7BA0" opacity="0.9" />
              <rect x="16" y="24" width="8" height="12" rx="1" fill="white" opacity="0.15" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white leading-tight">انضم إلينا</h1>
          <p className="text-base text-white/60 leading-relaxed max-w-xs mx-auto">
            أنشئ حسابك واستفد من كامل خدمات منصة عقار إنسايت
          </p>
          <div className="flex flex-col gap-3 mt-2 text-right max-w-xs mx-auto">
            {[
              { t: "عميل", d: "ابحث عن العقار المناسب" },
              { t: "مسوّق عقاري", d: "أعلن وتابع عقاراتك" },
              { t: "مزوّد خدمة", d: "اعرض خدماتك لآلاف العملاء" },
            ].map(f => (
              <div key={f.t} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "rgba(15,123,160,0.3)" }}>
                  <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                    <path d="M2 6l3 3 5-5" stroke="#0F7BA0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-sm text-white/70"><strong className="text-white">{f.t}:</strong> {f.d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: form ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-[440px] space-y-6">

          {/* Logo (mobile) */}
          <div className="flex flex-col items-center lg:hidden">
            <LogoBrand variant="hero" linkTo="/" />
          </div>

          {/* Card */}
          <div className="rounded-3xl border border-white/80 p-7 space-y-5"
            style={{ background: "#fff", boxShadow: "0 4px 32px rgba(11,22,40,0.08)" }}>

            {/* Header */}
            <div className="space-y-0.5">
              <h2 className="text-[22px] font-black text-foreground tracking-tight">إنشاء حساب جديد</h2>
              <p className="text-sm text-muted-foreground">أنشئ حسابك للاستفادة من جميع الخدمات</p>
            </div>

            <form onSubmit={e => void handleSubmit(e)} className="space-y-4" noValidate>

              {/* ── Account type ── */}
              <div className="space-y-2">
                <p className="text-[13px] font-bold text-foreground">نوع الحساب</p>
                <div className="grid grid-cols-1 gap-2">
                  {ACCOUNT_TYPES.map(t => {
                    const active = accountType === t.key;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => { setAccountType(t.key); if (t.key !== "service_provider") { setServiceCategory(""); setCustomCategory(""); } }}
                        className="flex items-center gap-3 p-3.5 rounded-xl border text-right transition-all"
                        style={{
                          borderColor: active ? "#0F7BA0" : "#E2E8F0",
                          background:  active ? "rgba(15,123,160,0.05)" : "#fff",
                        }}
                      >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all"
                          style={{ background: active ? "rgba(15,123,160,0.12)" : "#F1F5F9", color: active ? "#0F7BA0" : "#64748B" }}>
                          {t.icon}
                        </div>
                        <div className="flex-1 text-right min-w-0">
                          <p className="text-sm font-bold" style={{ color: active ? "#0F7BA0" : "#111827" }}>{t.label}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{t.sub}</p>
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

              {/* ── Service category (service_provider only) ── */}
              {accountType === "service_provider" && (
                <div className="space-y-2 p-4 rounded-2xl" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                  <Field label="تصنيف الخدمة" required>
                    <div className="relative">
                      <Wrench className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <select
                        value={serviceCategory}
                        onChange={e => { setServiceCategory(e.target.value); if (e.target.value !== "أخرى") setCustomCategory(""); }}
                        className={`${inputBase} pr-10 pl-8 appearance-none`}
                        style={{ borderColor: "#E2E8F0", color: "#111827", background: "#fff" }}
                        {...focusHandlers}
                      >
                        <option value="" style={{ color: "#111827", background: "#fff" }}>اختر تصنيف خدمتك</option>
                        {CATEGORIES.map(c => <option key={c} value={c} style={{ color: "#111827", background: "#fff" }}>{c}</option>)}
                      </select>
                      <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </Field>

                  {isOther && (
                    <div className="pt-1">
                      <Field label="اكتب نوع الخدمة" required>
                        <input
                          type="text"
                          value={customCategory}
                          onChange={e => setCustomCategory(e.target.value)}
                          placeholder="مثال: خدمات ري، تنسيق حدائق..."
                          className={`${inputBase} px-4`}
                          style={{ borderColor: "#E2E8F0" }}
                          {...focusHandlers}
                        />
                      </Field>
                    </div>
                  )}
                </div>
              )}

              {/* ── Full name ── */}
              <Field label="الاسم الكامل" required>
                <div className="relative">
                  <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    autoComplete="name"
                    autoCapitalize="words"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="محمد العمري"
                    className={`${inputBase} pr-10 pl-4`}
                    style={{ borderColor: "#E2E8F0" }}
                    {...focusHandlers}
                  />
                </div>
              </Field>

              {/* ── Username ── */}
              <Field label="اسم المستخدم" required hint="أحرف إنجليزية وأرقام وشرطة سفلية فقط">
                <div className="relative">
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium pointer-events-none select-none">@</span>
                  <input
                    type="text"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="m_alomari"
                    dir="ltr"
                    className={`${inputBase} pr-9 pl-4 font-mono`}
                    style={{ borderColor: "#E2E8F0" }}
                    {...focusHandlers}
                  />
                </div>
              </Field>

              {/* ── Email ── */}
              <Field label="البريد الإلكتروني" required>
                <div className="relative">
                  <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    dir="ltr"
                    className={`${inputBase} pr-10 pl-4`}
                    style={{ borderColor: "#E2E8F0" }}
                    {...focusHandlers}
                  />
                </div>
              </Field>

              {/* ── Password ── */}
              <Field label="كلمة المرور" required hint="8 أحرف على الأقل">
                <div className="relative">
                  <LockKeyhole className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type={showPass ? "text" : "password"}
                    autoComplete="new-password"
                    autoCapitalize="none"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputBase} pr-10 pl-10`}
                    style={{ borderColor: "#E2E8F0" }}
                    {...focusHandlers}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    tabIndex={-1}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>

              {/* ── Terms & Conditions ── */}
              <div
                className="rounded-2xl p-4 space-y-1"
                style={{
                  background:   termsAccepted ? "rgba(15,123,160,0.04)" : "#F8FAFC",
                  border:       `1.5px solid ${termsAccepted ? "rgba(15,123,160,0.3)" : "#E2E8F0"}`,
                  transition:   "all 0.2s",
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
                      className="w-5 h-5 rounded-md flex items-center justify-center transition-all"
                      style={{
                        background:   termsAccepted ? "#0F7BA0" : "#fff",
                        border:       `2px solid ${termsAccepted ? "#0F7BA0" : "#CBD5E1"}`,
                      }}
                    >
                      {termsAccepted && <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                    </div>
                  </div>
                  <span className="text-[13px] leading-relaxed text-foreground">
                    أوافق على{" "}
                    <Link href="/legal-terms" target="_blank"
                      className="font-bold underline underline-offset-2 hover:opacity-80 transition-opacity"
                      style={{ color: "#0F7BA0" }}
                      onClick={e => e.stopPropagation()}>
                      الشروط والأحكام
                    </Link>
                    {" "}و{" "}
                    <Link href="/legal-privacy" target="_blank"
                      className="font-bold underline underline-offset-2 hover:opacity-80 transition-opacity"
                      style={{ color: "#0F7BA0" }}
                      onClick={e => e.stopPropagation()}>
                      سياسة الخصوصية
                    </Link>
                  </span>
                </label>
              </div>

              {/* ── Error ── */}
              {error && (
                <div role="alert" className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm"
                  style={{ background: "#FEF2F2", borderColor: "#FECACA", color: "#DC2626" }}>
                  <span className="text-base leading-none">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              {/* ── Submit ── */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: loading ? "#94A3B8" : "linear-gradient(135deg, #0B1628, #0F7BA0)", boxShadow: "0 4px 14px rgba(15,123,160,0.3)" }}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />جارٍ إنشاء الحساب…</>
                ) : (
                  <><span>إنشاء الحساب</span><ArrowLeft className="w-4 h-4" /></>
                )}
              </button>
            </form>

            {/* Login link */}
            <p className="text-center text-[13px] text-muted-foreground pt-1">
              لديك حساب بالفعل؟{" "}
              <Link href="/login" className="font-bold transition-colors" style={{ color: "#0F7BA0" }}>
                تسجيل الدخول
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
