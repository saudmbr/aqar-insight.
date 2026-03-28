import { useState, useEffect, type FormEvent } from "react";
import { useLocation } from "wouter";
import {
  User,
  Mail,
  Calendar,
  LogOut,
  Edit3,
  LockKeyhole,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";

interface ProfileData {
  fullName: string;
  username: string;
  email: string | null;
  role: string;
  createdAt: string | null;
}

function SuccessAlert({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/8 px-4 py-3 text-sm text-green-700 dark:text-green-400">
      <CheckCircle2 className="w-4 h-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
      <span className="text-base leading-none">⚠</span>
      <span>{message}</span>
    </div>
  );
}

export default function Account() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  // Password state
  const [pwOpen, setPwOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/profile", { credentials: "include" })
      .then((r) => r.json() as Promise<ProfileData>)
      .then((data) => {
        setProfile(data);
        setEditFullName(data.fullName);
        setEditUsername(data.username ?? "");
        setEditEmail(data.email ?? "");
      })
      .catch(() => {/* ignore */})
      .finally(() => setLoadingProfile(false));
  }, []);

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setEditError(null);
    setEditSuccess(null);
    setEditLoading(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: editFullName, username: editUsername, email: editEmail }),
      });
      const data = (await res.json()) as { message?: string; fullName?: string; username?: string };
      if (!res.ok) throw new Error(data.message ?? "حدث خطأ");
      setProfile((p) => p ? { ...p, fullName: data.fullName!, username: data.username! } : p);
      setEditSuccess("تم تحديث بياناتك بنجاح");
      setEditOpen(false);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setEditLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);
    if (newPw !== confirmPw) {
      setPwError("كلمة المرور الجديدة وتأكيدها غير متطابقتين");
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(data.message ?? "حدث خطأ");
      setPwSuccess("تم تغيير كلمة المرور بنجاح");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setPwOpen(false);
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isAdmin = user?.role === "admin";
  const createdDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 pb-10">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">حسابي</h1>
          <p className="text-muted-foreground mt-1">إدارة معلومات حسابك الشخصي</p>
        </div>

        {/* Profile Info Card */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">المعلومات الشخصية</CardTitle>
                <CardDescription>بياناتك المسجّلة في المنصة</CardDescription>
              </div>
              {!isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setEditOpen((o) => !o); setEditError(null); setEditSuccess(null); }}
                  className="gap-2 rounded-xl h-9"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {editOpen ? "إلغاء" : "تعديل"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            {loadingProfile ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="grid gap-4">
                  <InfoRow icon={<User className="w-4 h-4" />} label="الاسم الكامل" value={profile?.fullName ?? "—"} />
                  <InfoRow icon={<span className="text-sm font-bold">@</span>} label="اسم المستخدم" value={profile?.username ?? "—"} mono />
                  {profile?.email && (
                    <InfoRow icon={<Mail className="w-4 h-4" />} label="البريد الإلكتروني" value={profile.email} />
                  )}
                  {createdDate && (
                    <InfoRow icon={<Calendar className="w-4 h-4" />} label="تاريخ إنشاء الحساب" value={createdDate} />
                  )}
                  <InfoRow
                    icon={<Shield className="w-4 h-4" />}
                    label="نوع الحساب"
                    value={isAdmin ? "مدير النظام" : "مستخدم"}
                    badge
                    badgeAdmin={isAdmin}
                  />
                </div>

                {editSuccess && !editOpen && <SuccessAlert message={editSuccess} />}

                {/* Edit Form */}
                {editOpen && !isAdmin && (
                  <form onSubmit={(e) => void handleEditSubmit(e)} className="space-y-4 pt-4 border-t border-border/40">
                    <p className="text-sm font-medium text-foreground">تعديل البيانات</p>
                    <div className="space-y-2">
                      <Label htmlFor="ef-fullName">الاسم الكامل</Label>
                      <Input id="ef-fullName" value={editFullName} onChange={(e) => setEditFullName(e.target.value)} className="h-10 rounded-xl text-right" disabled={editLoading} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ef-username">اسم المستخدم</Label>
                      <Input id="ef-username" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="h-10 rounded-xl text-right font-mono" dir="ltr" disabled={editLoading} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ef-email">البريد الإلكتروني</Label>
                      <Input id="ef-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="h-10 rounded-xl text-right" dir="ltr" disabled={editLoading} />
                    </div>
                    {editError && <ErrorAlert message={editError} />}
                    <Button type="submit" disabled={editLoading} className="w-full h-10 rounded-xl">
                      {editLoading ? <><Loader2 className="w-4 h-4 animate-spin ml-2" />جارٍ الحفظ…</> : "حفظ التغييرات"}
                    </Button>
                  </form>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Change Password Card (for DB users only) */}
        {!isAdmin && (
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">كلمة المرور</CardTitle>
                  <CardDescription>غيّر كلمة المرور بشكل دوري لحماية حسابك</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setPwOpen((o) => !o); setPwError(null); setPwSuccess(null); }}
                  className="gap-2 rounded-xl h-9"
                >
                  <LockKeyhole className="w-3.5 h-3.5" />
                  {pwOpen ? "إلغاء" : "تغيير"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              {pwSuccess && !pwOpen && <SuccessAlert message={pwSuccess} />}
              {!pwOpen && !pwSuccess && (
                <p className="text-sm text-muted-foreground">••••••••••••</p>
              )}
              {pwOpen && (
                <form onSubmit={(e) => void handlePasswordSubmit(e)} className="space-y-4">
                  <PasswordField id="cur-pw" label="كلمة المرور الحالية" value={currentPw} onChange={setCurrentPw} show={showCurrentPw} onToggle={() => setShowCurrentPw((s) => !s)} autoComplete="current-password" disabled={pwLoading} />
                  <PasswordField id="new-pw" label="كلمة المرور الجديدة" value={newPw} onChange={setNewPw} show={showNewPw} onToggle={() => setShowNewPw((s) => !s)} autoComplete="new-password" hint="8 أحرف على الأقل" disabled={pwLoading} />
                  <PasswordField id="conf-pw" label="تأكيد كلمة المرور الجديدة" value={confirmPw} onChange={setConfirmPw} show={showNewPw} onToggle={() => setShowNewPw((s) => !s)} autoComplete="new-password" disabled={pwLoading} />
                  {pwError && <ErrorAlert message={pwError} />}
                  <Button type="submit" disabled={pwLoading || !currentPw || !newPw || !confirmPw} className="w-full h-10 rounded-xl">
                    {pwLoading ? <><Loader2 className="w-4 h-4 animate-spin ml-2" />جارٍ التغيير…</> : "تغيير كلمة المرور"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        )}

        {/* Logout */}
        <Card className="border-destructive/20 shadow-sm">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">تسجيل الخروج</p>
                <p className="text-xs text-muted-foreground mt-0.5">سيتم إنهاء جلستك الحالية</p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => void handleLogout()}
                className="gap-2 rounded-xl h-9"
              >
                <LogOut className="w-4 h-4" />
                تسجيل الخروج
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

function InfoRow({
  icon,
  label,
  value,
  mono = false,
  badge = false,
  badgeAdmin = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  badge?: boolean;
  badgeAdmin?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      {badge ? (
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            badgeAdmin
              ? "bg-primary/10 text-primary border border-primary/20"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {value}
        </span>
      ) : (
        <span className={`text-sm font-medium text-foreground ${mono ? "font-mono" : ""}`}>
          {value}
        </span>
      )}
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
  hint,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  autoComplete: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <LockKeyhole className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          id={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          className="pr-9 pl-10 h-10 rounded-xl text-right"
          disabled={disabled}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
