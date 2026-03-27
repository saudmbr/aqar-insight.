import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { Building2, Eye, EyeOff, Loader2, LockKeyhole, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";

export default function Signup() {
  const { signup } = useAuth();
  const [, navigate] = useLocation();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = (): string | null => {
    if (!fullName.trim() || fullName.trim().length < 2)
      return "الاسم الكامل يجب أن يكون حرفين على الأقل";
    if (!username.trim() || username.trim().length < 3)
      return "اسم المستخدم يجب أن يكون 3 أحرف على الأقل";
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim()))
      return "اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام وشرطة سفلية فقط";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return "يرجى إدخال بريد إلكتروني صحيح";
    if (password.length < 8) return "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signup(fullName, username, email, password);
      navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "خطأ في إنشاء الحساب");
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
          <div className="mb-6 space-y-1">
            <h2 className="text-lg font-semibold text-foreground">إنشاء حساب جديد</h2>
            <p className="text-sm text-muted-foreground">أنشئ حسابك للاطلاع على تحليلات السوق</p>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" noValidate>
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
                الاسم الكامل
              </Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="محمد العمري"
                  className="pr-9 h-11 rounded-xl border-border/60 bg-background/50 text-right"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-foreground">
                اسم المستخدم
              </Label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium pointer-events-none select-none">@</span>
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="m_alomari"
                  className="pr-9 h-11 rounded-xl border-border/60 bg-background/50 text-right font-mono"
                  required
                  disabled={loading}
                  dir="ltr"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                أحرف إنجليزية وأرقام وشرطة سفلية فقط
              </p>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                البريد الإلكتروني
              </Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="pr-9 h-11 rounded-xl border-border/60 bg-background/50 text-right"
                  required
                  disabled={loading}
                  dir="ltr"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                كلمة المرور
              </Label>
              <div className="relative">
                <LockKeyhole className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
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
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">8 أحرف على الأقل</p>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive"
              >
                <span className="text-base leading-none">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading || !fullName || !username || !email || !password}
              className="w-full h-11 rounded-xl text-sm font-semibold shadow-md shadow-primary/20 transition-all mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  جارٍ إنشاء الحساب…
                </>
              ) : (
                "إنشاء الحساب"
              )}
            </Button>
          </form>

          {/* Login link */}
          <p className="mt-5 text-center text-sm text-muted-foreground">
            لديك حساب بالفعل؟{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
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
