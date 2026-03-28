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
            <header className="h-16 flex items-center gap-3 px-5 bg-white/90 backdrop-blur-md z-10 border-b border-border shadow-sm shrink-0">
              {/* Sidebar toggle */}
              <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors w-10 h-10 flex items-center justify-center rounded-xl bg-muted/50 hover:bg-muted shrink-0" />

              {/* Logo — always shown in header as brand anchor */}
              <LogoBrand variant="header" linkTo="/" />

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
                    <LogoBrand variant="footer" linkTo="/" />
                    <p className="text-xs text-muted-foreground">
                      © {new Date().getFullYear()} عقار إنسايت · جميع الحقوق محفوظة
                    </p>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <a
                        href="https://twitter.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Twitter / X"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 hover:-translate-y-0.5"
                      >
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden>
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </a>
                      <a
                        href="https://instagram.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Instagram"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-pink-500 hover:bg-pink-500/8 transition-all duration-200 hover:-translate-y-0.5"
                      >
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden>
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                      </a>
                      <a
                        href="https://snapchat.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Snapchat"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-yellow-400 hover:bg-yellow-400/10 transition-all duration-200 hover:-translate-y-0.5"
                      >
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden>
                          <path d="M12.166.8C9.924.8 7.25 1.8 5.79 4.566c-.724 1.363-.582 3.695-.52 4.72a1.16 1.16 0 0 1-.44.038c-.42-.048-.855-.215-1.29-.497a.5.5 0 0 0-.284-.09.86.86 0 0 0-.517.194.706.706 0 0 0-.29.57c0 .486.427.84 1.278 1.053l.196.044c.368.073.614.22.714.427.088.183.056.407-.094.648-.424.685-1.11 1.145-1.94 1.296-.398.072-.8.094-1.22.065a.52.52 0 0 0-.062-.004c-.383 0-.63.217-.676.595-.03.24.013.44.128.59.277.365.947.593 2.044.697.082.01.155.053.21.117a2.42 2.42 0 0 1 .4.763c.048.153.118.248.218.3a.77.77 0 0 0 .356.08c.217 0 .47-.05.742-.103.439-.086.984-.192 1.668-.192.367 0 .748.035 1.13.108.76.14 1.313.612 1.94 1.146.737.633 1.574 1.35 2.965 1.35 1.39 0 2.228-.717 2.965-1.35.627-.534 1.18-1.006 1.94-1.146.382-.073.763-.108 1.13-.108.684 0 1.229.106 1.668.192.272.053.525.103.742.103a.77.77 0 0 0 .356-.08c.1-.052.17-.147.218-.3a2.42 2.42 0 0 1 .4-.763.336.336 0 0 1 .21-.117c1.097-.104 1.767-.332 2.044-.697.115-.15.158-.35.128-.59-.046-.378-.293-.595-.676-.595a.52.52 0 0 0-.062.004c-.42.03-.822.007-1.22-.065-.83-.151-1.516-.611-1.94-1.296-.15-.241-.182-.465-.094-.648.1-.207.346-.354.714-.427l.196-.044c.851-.213 1.278-.567 1.278-1.053a.706.706 0 0 0-.29-.57.86.86 0 0 0-.517-.194.5.5 0 0 0-.284.09c-.435.282-.87.449-1.29.497a1.16 1.16 0 0 1-.44-.038c.062-1.025.204-3.357-.52-4.72C17.082 1.8 14.408.8 12.166.8z" />
                        </svg>
                      </a>
                    </div>
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
