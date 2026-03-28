import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { Building2, Eye, EyeOff, Loader2, LockKeyhole, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";

export default function Login() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      className="min-h-screen bg-background flex items-center justify-center p-4"
      style={{
        background:
          "radial-gradient(ellipse at 70% 20%, hsl(191 80% 28% / 0.08) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, hsl(218 55% 10% / 0.05) 0%, transparent 60%), var(--background)",
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
            <h2 className="text-lg font-semibold text-foreground">تسجيل الدخول</h2>
            <p className="text-sm text-muted-foreground">أدخل بياناتك للوصول إلى حسابك</p>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5" noValidate>
            {/* Identifier */}
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-sm font-medium text-foreground">
                اسم المستخدم أو البريد الإلكتروني
              </Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin أو example@email.com"
                  className="pr-9 h-11 rounded-xl border-border/60 bg-background/50 text-right"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  كلمة المرور
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  نسيت كلمة المرور؟
                </Link>
              </div>
              <div className="relative">
                <LockKeyhole className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
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
              disabled={loading || !identifier || !password}
              className="w-full h-11 rounded-xl text-sm font-semibold shadow-md shadow-primary/20 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  جارٍ التحقق…
                </>
              ) : (
                "تسجيل الدخول"
              )}
            </Button>
          </form>

          {/* Signup link */}
          <p className="mt-5 text-center text-sm text-muted-foreground">
            ليس لديك حساب؟{" "}
            <Link
              href="/signup"
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              إنشاء حساب جديد
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
