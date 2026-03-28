import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { LogIn, LogOut, UserCircle2, UserPlus, Search } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "./app-sidebar";
import { TopBar } from "./top-bar";
import { useAuth } from "@/contexts/auth-context";
import { useLang } from "@/contexts/language-context";
import { Scale, Shield, BookOpen } from "lucide-react";
import { LogoBrand } from "@/components/logo-brand";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const { t, lang } = useLang();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const isAr = lang === "ar";

  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/listings?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/listings");
    }
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary/20 flex-col">
        {/* Top utility bar */}
        <TopBar />

        <div className="flex flex-1 min-h-0 w-full">
          <AppSidebar />
          <div className="flex flex-col flex-1 min-w-0">
            {/* Main header */}
            <header className="h-16 flex items-center gap-4 px-5 bg-white/90 backdrop-blur-md z-10 border-b border-border shadow-sm shrink-0">
              {/* Sidebar toggle */}
              <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors w-10 h-10 flex items-center justify-center rounded-xl bg-muted/50 hover:bg-muted shrink-0" />

              {/* Search bar — takes all available space */}
              <form
                onSubmit={handleSearch}
                className="flex-1 flex items-center gap-2 max-w-xl"
                dir="rtl"
              >
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={isAr ? "ابحث عن عقار، حي، مدينة..." : "Search property, district, city..."}
                    className="w-full h-10 pr-9 pl-3 text-sm bg-muted/60 border border-border rounded-xl outline-none focus:border-primary focus:bg-white transition-all placeholder:text-muted-foreground/60"
                  />
                </div>
                <button
                  type="submit"
                  className="h-10 px-4 rounded-xl text-sm font-semibold text-white shrink-0 transition-all hover:brightness-110"
                  style={{ background: "var(--primary)" }}
                >
                  {isAr ? "بحث" : "Search"}
                </button>
              </form>

              {/* Auth actions */}
              <div className="flex items-center gap-3 shrink-0 mr-auto" dir="rtl">
                {!isLoading && (
                  <>
                    {isAuthenticated && user ? (
                      <>
                        <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-xl bg-muted border border-border">
                          <UserCircle2 className="w-5 h-5 text-primary shrink-0" />
                          <span className="text-sm font-medium text-foreground max-w-[130px] truncate">
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
                          <span className="hidden sm:inline text-sm">{t("logout")}</span>
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
                            <span className="hidden sm:inline">{t("login")}</span>
                          </Link>
                        </Button>
                        <Button
                          asChild
                          size="sm"
                          className="gap-2 rounded-xl h-10 px-6 font-medium shadow-md shadow-primary/20 hover:brightness-110 transition-all"
                        >
                          <Link href="/signup">
                            <UserPlus className="w-4 h-4" />
                            <span>{t("createAccount")}</span>
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
              <footer className="border-t border-border bg-muted/30 px-4 py-6 md:px-8 lg:px-12 mt-auto" dir="rtl">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="order-2 sm:order-1 flex flex-col items-center sm:items-start gap-1.5">
                    <LogoBrand variant="full" linkTo="/" light={false} />
                    <p className="text-xs text-muted-foreground">
                      © {new Date().getFullYear()} عقار إنسايت · جميع الحقوق محفوظة
                    </p>
                  </div>
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
      </div>
    </SidebarProvider>
  );
}
