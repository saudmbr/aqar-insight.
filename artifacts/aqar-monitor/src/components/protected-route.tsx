import { type ComponentType } from "react";
import { Link, Redirect } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { Loader2, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/layout";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

function UnauthorizedPage() {
  return (
    <Layout>
      <div dir="rtl" className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-6">
        <div className="w-20 h-20 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
          <ShieldX className="w-10 h-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">غير مصرح لك</h1>
          <p className="text-muted-foreground max-w-sm">
            ليس لديك صلاحية الوصول إلى هذه الصفحة. هذه المنطقة مخصصة للمدير فقط.
          </p>
        </div>
        <Button asChild className="rounded-xl gap-2">
          <Link href="/">العودة للرئيسية</Link>
        </Button>
      </div>
    </Layout>
  );
}

export function AdminRoute({ component: Component }: { component: ComponentType }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Redirect to="/login" />;
  if (!isAdmin) return <UnauthorizedPage />;

  return <Component />;
}

export function UserRoute({ component: Component }: { component: ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Redirect to="/login" />;

  return <Component />;
}
