import { useState, useEffect, useRef, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import {
  Eye, EyeOff, Loader2, LockKeyhole, Mail, User,
  Briefcase, Wrench, Search, ChevronDown, Phone,
  ShieldCheck, RefreshCw, CheckCircle2, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { LogoBrand } from "@/components/logo-brand";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const CATEGORIES = [
  "بناء وتشييد", "تشطيبات وديكور", "كهرباء ومياه", "تكييف وتبريد", "دهانات", "أرضيات",
  "مطابخ", "مصاعد", "نظافة ومكافحة حشرات", "تصميم داخلي", "تصميم معماري", "تقييم عقاري",
  "إدارة عقارات", "تصوير عقاري", "صيانة", "مقاولات", "مواد بناء",
];

type AccountType = "user" | "real_estate_marketer" | "service_provider";
type Step = "form" | "otp";

const ACCOUNT_TYPES = [
  { key: "user" as AccountType,                    label: "عميل باحث عن عقار",   sub: "أبحث عن شراء أو استئجار عقار",  icon: <Search    className="w-5 h-5" /> },
  { key: "real_estate_marketer" as AccountType,    label: "مسوّق عقاري",          sub: "أعمل في تسويق وبيع العقارات",   icon: <Briefcase className="w-5 h-5" /> },
  { key: "service_provider" as AccountType,        label: "مزوّد خدمة عقارية",    sub: "أقدم خدمات متعلقة بالعقار",     icon: <Wrench    className="w-5 h-5" /> },
];

const RESEND_COOLDOWN = 60;

export default function Signup() {
  const { signup } = useAuth();
  const [, navigate] = useLocation();

  const [step, setStep] = useState<Step>("form");

  const [fullName, setFullName]           = useState("");
  const [username, setUsername]           = useState("");
  const [email, setEmail]                 = useState("");
  const [password, setPassword]           = useState("");
  const [showPassword, setShowPassword]   = useState(false);
  const [accountType, setAccountType]     = useState<AccountType>("user");
  const [serviceCategory, setServiceCategory] = useState("");
  const [phone, setPhone]                 = useState("");

  const [otpCode, setOtpCode]             = useState("");
  const [otpInputs, setOtpInputs]         = useState(["", "", "", "", "", ""]);
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const [cooldown, setCooldown]           = useState(0);
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [error, setError]                 = useState<string | null>(null);
  const [success, setSuccess]             = useState<string | null>(null);
  const [loading, setLoading]             = useState(false);
  const [sendingOtp, setSendingOtp]       = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    const joined = otpInputs.join("");
    setOtpCode(joined);
  }, [otpInputs]);

  const validateForm = (): string | null => {
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
    if (!phone.trim())
      return "رقم الجوال مطلوب للتسجيل";
    const cleaned = phone.trim().replace(/[\s\-().]/g, "");
    const validPhone =
      /^05\d{8}$/.test(cleaned) ||
      /^\+9665\d{8}$/.test(cleaned) ||
      /^9665\d{8}$/.test(cleaned) ||
      /^005\d{8}$/.test(cleaned);
    if (!validPhone)
      return "يرجى إدخال رقم جوال سعودي صحيح (مثال: 0501234567)";
    return null;
  };

  const handleSendOtp = async () => {
    const err = validateForm();
    if (err) { setError(err); return; }
    setError(null);
    setSendingOtp(true);
    try {
      const res = await fetch(`${BASE}/api/auth/otp/send`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json() as { success?: boolean; message?: string; phone?: string };
      if (!res.ok) {
        setError(data.message ?? "حدث خطأ أثناء إرسال الرمز");
        return;
      }
      setNormalizedPhone(data.phone ?? phone.trim());
      setOtpInputs(["", "", "", "", "", ""]);
      setStep("otp");
      setCooldown(RESEND_COOLDOWN);
      setSuccess("تم إرسال رمز التحقق إلى رقم الجوال");
      setTimeout(() => setSuccess(null), 4000);
      setTimeout(() => otpRefs[0].current?.focus(), 100);
    } catch {
      setError("حدث خطأ في الاتصال، يرجى المحاولة مجدداً");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setError(null);
    setSendingOtp(true);
    try {
      const res = await fetch(`${BASE}/api/auth/otp/send`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json() as { success?: boolean; message?: string };
      if (!res.ok) { setError(data.message ?? "خطأ في إرسال الرمز"); return; }
      setOtpInputs(["", "", "", "", "", ""]);
      setCooldown(RESEND_COOLDOWN);
      setSuccess("تم إعادة إرسال رمز التحقق");
      setTimeout(() => setSuccess(null), 4000);
      setTimeout(() => otpRefs[0].current?.focus(), 100);
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleOtpInput = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otpInputs];
    next[idx] = digit;
    setOtpInputs(next);
    if (digit && idx < 5) {
      otpRefs[idx + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpInputs[idx] && idx > 0) {
      otpRefs[idx - 1].current?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...otpInputs];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] ?? "";
    }
    setOtpInputs(next);
    const lastFilled = Math.min(pasted.length - 1, 5);
    otpRefs[lastFilled].current?.focus();
  };

  const handleVerifyAndSignup = async (e: FormEvent) => {
    e.preventDefault();
    const code = otpInputs.join("");
    if (code.length < 6) {
      setError("يرجى إدخال رمز التحقق المكوّن من 6 أرقام");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const verifyRes = await fetch(`${BASE}/api/auth/otp/verify`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), code }),
      });
      const verifyData = await verifyRes.json() as {
        success?: boolean;
        message?: string;
        expired?: boolean;
        tooManyAttempts?: boolean;
      };

      if (!verifyRes.ok) {
        setError(verifyData.message ?? "رمز التحقق غير صحيح");
        if (verifyData.expired || verifyData.tooManyAttempts) {
          setOtpInputs(["", "", "", "", "", ""]);
        }
        return;
      }

      const signupRes = await fetch(`${BASE}/api/auth/signup`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName, username, email, password,
          userType: accountType,
          serviceCategory: accountType === "service_provider" ? serviceCategory : undefined,
          phone: phone.trim(),
        }),
      });
      const signupData = await signupRes.json() as {
        success?: boolean;
        message?: string;
        userId?: number;
        username?: string;
        fullName?: string;
        role?: string;
      };

      if (!signupRes.ok) {
        setError(signupData.message ?? "خطأ في إنشاء الحساب");
        if (signupData.message?.includes("جوال") || (signupData as { requiresOtpVerification?: boolean }).requiresOtpVerification) {
          setStep("form");
        }
        return;
      }

      if (signupData.role === "real_estate_marketer") {
        navigate("/marketer/dashboard");
      } else if (signupData.role === "service_provider") {
        navigate("/services/dashboard");
      } else {
        navigate("/");
      }
    } catch {
      setError("حدث خطأ في الاتصال، يرجى المحاولة مجدداً");
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
          "radial-gradient(ellipse at 30% 20%, hsl(191 80% 28% / 0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, hsl(218 55% 10% / 0.05) 0%, transparent 60%), var(--background)",
      }}
    >
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center">
          <LogoBrand variant="hero" linkTo="/" />
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-lg shadow-black/5">

          {/* ─── Step Indicator ─────────────────────────────────── */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
              step === "form"
                ? "bg-primary text-primary-foreground"
                : "bg-green-100 text-green-700"
            }`}>
              {step === "otp"
                ? <CheckCircle2 className="w-3.5 h-3.5" />
                : <span className="w-4 h-4 rounded-full bg-white/30 text-[10px] flex items-center justify-center font-bold">١</span>
              }
              بيانات الحساب
            </div>
            <div className="flex-1 h-px bg-border/60" />
            <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
              step === "otp"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}>
              <span className="w-4 h-4 rounded-full bg-white/30 text-[10px] flex items-center justify-center font-bold">٢</span>
              التحقق بالجوال
            </div>
          </div>

          {/* ─── STEP 1: Registration Form ──────────────────────── */}
          {step === "form" && (
            <div className="space-y-4">
              <div className="mb-1 space-y-1">
                <h2 className="text-lg font-semibold text-foreground">إنشاء حساب جديد</h2>
                <p className="text-sm text-muted-foreground">أنشئ حسابك للاستفادة من جميع الخدمات</p>
              </div>

              {/* Account type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">نوع الحساب</Label>
                <div className="grid grid-cols-1 gap-2">
                  {ACCOUNT_TYPES.map(type => (
                    <button
                      key={type.key}
                      type="button"
                      onClick={() => { setAccountType(type.key); if (type.key !== "service_provider") setServiceCategory(""); }}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-right transition-all ${
                        accountType === type.key
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border/60 hover:border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        accountType === type.key ? "bg-primary/10" : "bg-muted"
                      }`}>
                        {type.icon}
                      </div>
                      <div className="text-right flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${accountType === type.key ? "text-primary" : "text-foreground"}`}>
                          {type.label}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{type.sub}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                        accountType === type.key ? "border-primary bg-primary" : "border-border"
                      }`}>
                        {accountType === type.key && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Service category */}
              {accountType === "service_provider" && (
                <div className="space-y-2">
                  <Label htmlFor="serviceCategory" className="text-sm font-medium text-foreground">
                    تصنيف الخدمة <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Wrench className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <select
                      id="serviceCategory"
                      value={serviceCategory}
                      onChange={e => setServiceCategory(e.target.value)}
                      className="w-full h-11 rounded-xl border border-input bg-background pr-9 pl-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                    >
                      <option value="">اختر تصنيف خدمتك</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-foreground">الاسم الكامل</Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input id="fullName" type="text" autoComplete="name" value={fullName}
                    onChange={e => setFullName(e.target.value)} placeholder="محمد العمري"
                    className="pr-9 h-11 rounded-xl border-border/60 bg-background/50 text-right" required />
                </div>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-foreground">اسم المستخدم</Label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium pointer-events-none select-none">@</span>
                  <Input id="username" type="text" autoComplete="username" value={username}
                    onChange={e => setUsername(e.target.value)} placeholder="m_alomari"
                    className="pr-9 h-11 rounded-xl border-border/60 bg-background/50 text-right font-mono" dir="ltr" required />
                </div>
                <p className="text-xs text-muted-foreground">أحرف إنجليزية وأرقام وشرطة سفلية فقط</p>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input id="email" type="email" autoComplete="email" value={email}
                    onChange={e => setEmail(e.target.value)} placeholder="example@email.com"
                    className="pr-9 h-11 rounded-xl border-border/60 bg-background/50" dir="ltr" required />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">كلمة المرور</Label>
                <div className="relative">
                  <LockKeyhole className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input id="password" type={showPassword ? "text" : "password"}
                    autoComplete="new-password" value={password}
                    onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                    className="pr-9 pl-10 h-11 rounded-xl border-border/60 bg-background/50" required />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">8 أحرف على الأقل</p>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                  رقم الجوال <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input id="phone" type="tel" autoComplete="tel" value={phone}
                    onChange={e => setPhone(e.target.value)} placeholder="0501234567"
                    className="pr-9 h-11 rounded-xl border-border/60 bg-background/50 font-mono" dir="ltr" required />
                </div>
                <p className="text-xs text-muted-foreground">سيتم إرسال رمز تحقق لتأكيد رقم جوالك</p>
              </div>

              {error && (
                <div role="alert" className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                  <span className="text-base leading-none">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="button"
                onClick={() => void handleSendOtp()}
                disabled={sendingOtp || !fullName || !username || !email || !password || !phone}
                className="w-full h-11 rounded-xl text-sm font-semibold shadow-md shadow-primary/20 transition-all mt-2"
              >
                {sendingOtp ? (
                  <><Loader2 className="w-4 h-4 animate-spin ml-2" />جارٍ إرسال رمز التحقق…</>
                ) : (
                  <><Phone className="w-4 h-4 ml-2" />إرسال رمز التحقق</>
                )}
              </Button>
            </div>
          )}

          {/* ─── STEP 2: OTP Verification ────────────────────────── */}
          {step === "otp" && (
            <form onSubmit={e => void handleVerifyAndSignup(e)} className="space-y-6" noValidate>
              <div className="text-center space-y-2">
                <div
                  className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{
                    background: "linear-gradient(135deg,#0F7BA0,#0a5a78)",
                    boxShadow: "0 8px 24px rgba(15,123,160,0.35)",
                  }}
                >
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">أدخل رمز التحقق</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  تم إرسال رمز مكوّن من 6 أرقام إلى
                  <br />
                  <span className="font-mono font-semibold text-foreground" dir="ltr">{normalizedPhone}</span>
                </p>
              </div>

              {success && (
                <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {/* OTP Boxes */}
              <div className="flex justify-center gap-3" dir="ltr">
                {otpInputs.map((val, idx) => (
                  <input
                    key={idx}
                    ref={otpRefs[idx]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    onChange={e => handleOtpInput(idx, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                    onPaste={idx === 0 ? handleOtpPaste : undefined}
                    className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-background transition-all outline-none focus:ring-2 focus:ring-primary/30 ${
                      val
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border/60 text-foreground"
                    }`}
                    style={{ fontFeatureSettings: "'tnum'" }}
                  />
                ))}
              </div>

              <p className="text-center text-xs text-muted-foreground">
                الرمز صالح لمدة 10 دقائق
              </p>

              {error && (
                <div role="alert" className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                  <span className="text-base leading-none">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || otpCode.length < 6}
                className="w-full h-11 rounded-xl text-sm font-semibold shadow-md shadow-primary/20 transition-all"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin ml-2" />جارٍ إنشاء الحساب…</>
                ) : (
                  <><ShieldCheck className="w-4 h-4 ml-2" />تحقق وأنشئ الحساب</>
                )}
              </Button>

              {/* Resend + Back */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setStep("form"); setError(null); setOtpInputs(["", "", "", "", "", ""]); }}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  تعديل البيانات
                </button>

                <button
                  type="button"
                  onClick={() => void handleResendOtp()}
                  disabled={cooldown > 0 || sendingOtp}
                  className="flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-primary hover:text-primary/80"
                >
                  {sendingOtp ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  {cooldown > 0 ? `إعادة الإرسال (${cooldown}ث)` : "إعادة إرسال الرمز"}
                </button>
              </div>
            </form>
          )}

          <p className="mt-5 text-center text-sm text-muted-foreground">
            لديك حساب بالفعل؟{" "}
            <Link href="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
              تسجيل الدخول
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground/80">
          © {new Date().getFullYear()} عقار إنسايت — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
