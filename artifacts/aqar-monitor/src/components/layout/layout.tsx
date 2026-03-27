import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LogIn, LogOut, UserCircle2, UserPlus } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "./app-sidebar";
import { useAuth } from "@/contexts/auth-context";
import { Scale, Shield, BookOpen } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [, navigate] = useLocation();

  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary/20">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="h-20 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md z-10 border-b border-border shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors w-10 h-10 flex items-center justify-center rounded-xl bg-muted/50 hover:bg-muted" />
            </div>

            <div className="flex items-center gap-4">
              {!isLoading && (
                <>
                  {isAuthenticated && user ? (
                    <>
                      <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-xl bg-muted border border-border">
                        <UserCircle2 className="w-5 h-5 text-primary shrink-0" />
                        <span className="text-sm font-medium text-foreground max-w-[150px] truncate">
                          {user.fullName || user.username}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleLogout()}
                        className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors rounded-xl h-10 px-4"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline text-sm">تسجيل الخروج</span>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="gap-2 rounded-xl h-10 px-5 text-muted-foreground hover:text-foreground font-medium"
                      >
                        <Link href="/login">
                          <LogIn className="w-4 h-4" />
                          <span className="hidden sm:inline">تسجيل الدخول</span>
                        </Link>
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        className="gap-2 rounded-xl h-10 px-6 font-medium shadow-md shadow-primary/20 hover:brightness-110 transition-all"
                      >
                        <Link href="/signup">
                          <UserPlus className="w-4 h-4" />
                          <span>إنشاء حساب</span>
                        </Link>
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </header>
          <main className="flex-1 overflow-y-auto bg-background flex flex-col">
            <div className="flex-1 px-4 py-8 md:px-8 lg:px-12">
              <div className="max-w-7xl mx-auto w-full">
                {children}
              </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-border bg-muted/30 px-4 py-5 md:px-8 lg:px-12 mt-auto" dir="rtl">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground order-2 sm:order-1">
                  © 2025 منصة عقار إنسايت · جميع الحقوق محفوظة
                </p>
                <nav className="flex items-center gap-1 order-1 sm:order-2 flex-wrap justify-center">
                  <Link
                    href="/privacy"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
                  >
                    <Shield className="w-3 h-3" />
                    سياسة الخصوصية
                  </Link>
                  <span className="text-border">·</span>
                  <Link
                    href="/terms"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
                  >
                    <Scale className="w-3 h-3" />
                    الشروط والأحكام
                  </Link>
                  <span className="text-border">·</span>
                  <Link
                    href="/usage"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
                  >
                    <BookOpen className="w-3 h-3" />
                    سياسة الاستخدام
                  </Link>
                </nav>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}