import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LogIn, LogOut, UserCircle2, UserPlus } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "./app-sidebar";
import { useAuth } from "@/contexts/auth-context";

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
          <header className="h-16 flex items-center justify-between px-6 border-b border-border/50 bg-card/50 backdrop-blur-sm z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
            </div>

            <div className="flex items-center gap-2">
              {!isLoading && (
                <>
                  {isAuthenticated && user ? (
                    <>
                      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/8 border border-primary/15">
                        <UserCircle2 className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm font-medium text-foreground max-w-[120px] truncate">
                          {user.fullName || user.username}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleLogout()}
                        className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors rounded-lg h-9"
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
                        className="gap-2 rounded-lg h-9 text-muted-foreground hover:text-foreground"
                      >
                        <Link href="/login">
                          <LogIn className="w-4 h-4" />
                          <span className="hidden sm:inline text-sm">تسجيل الدخول</span>
                        </Link>
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        className="gap-2 rounded-lg h-9 shadow-sm shadow-primary/15"
                      >
                        <Link href="/signup">
                          <UserPlus className="w-4 h-4" />
                          <span className="text-sm">إنشاء حساب</span>
                        </Link>
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
