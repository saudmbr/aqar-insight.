import {
  BarChart3,
  Building2,
  Home,
  LogOut,
  Map,
  PlusCircle,
  Sparkles,
  LayoutDashboard,
  UserCircle2,
  Wrench,
  FileText,
  Users,
  Star,
  Info,
  ChevronLeft,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { LogoBrand } from "@/components/logo-brand";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useLang, type TranslationKey } from "@/contexts/language-context";

type NavItemDef = {
  titleKey: TranslationKey;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

const marketplaceNavItems: NavItemDef[] = [
  { titleKey: "home",             url: "/",          icon: Home,            exact: true },
  { titleKey: "properties",       url: "/listings",  icon: Building2 },
  { titleKey: "map",              url: "/map",        icon: Map },
  { titleKey: "marketers",        url: "/marketers", icon: Star },
  { titleKey: "services",         url: "/services",  icon: Wrench },
  { titleKey: "requests",         url: "/requests",  icon: FileText },
  { titleKey: "futureProjects",   url: "/future",    icon: Sparkles },
  { titleKey: "about",            url: "/about",     icon: Info },
];

const analyticsNavItems: NavItemDef[] = [
  { titleKey: "marketAnalysis",     url: "/analytics", icon: BarChart3 },
  { titleKey: "districtComparison", url: "/districts", icon: Map },
];

const adminNavItems: NavItemDef[] = [
  { titleKey: "adminPanel",   url: "/admin",         icon: LayoutDashboard },
  { titleKey: "addRecord",    url: "/admin/add",     icon: PlusCircle },
  { titleKey: "users",        url: "/admin/users",   icon: Users },
  { titleKey: "adminReports", url: "/admin/reports", icon: BarChart3 },
];

function NavItem({ item, location }: { item: NavItemDef; location: string }) {
  const { t } = useLang();
  const isActive = item.exact ? location === item.url : location.startsWith(item.url);

  return (
    <li className="relative">
      {isActive && (
        <span
          className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
          style={{ background: "linear-gradient(180deg,#38bdf8,#0F7BA0)" }}
        />
      )}
      <Link
        href={item.url}
        className={cn(
          "group flex items-center gap-3 px-4 py-2.5 rounded-xl mx-3 transition-all duration-200 text-sm select-none",
          isActive
            ? "font-semibold text-white"
            : "text-white/55 hover:text-white/90 hover:bg-white/5"
        )}
        style={isActive ? {
          background: "linear-gradient(135deg,rgba(15,123,160,0.35) 0%,rgba(15,123,160,0.08) 100%)",
          boxShadow: "inset 0 0 0 1px rgba(56,189,248,0.18), 0 2px 12px rgba(15,123,160,0.18)",
        } : undefined}
      >
        <span
          className={cn(
            "flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 shrink-0",
            isActive
              ? "bg-[#0F7BA0]/40 text-[#38bdf8]"
              : "bg-white/5 text-white/45 group-hover:bg-white/10 group-hover:text-white/70"
          )}
        >
          <item.icon className="w-3.5 h-3.5" />
        </span>
        <span className="flex-1 leading-none">{t(item.titleKey)}</span>
        {isActive && (
          <ChevronLeft className="w-3.5 h-3.5 text-[#38bdf8]/60 shrink-0" />
        )}
      </Link>
    </li>
  );
}

function NavGroup({
  labelKey,
  items,
  location,
}: {
  labelKey: TranslationKey;
  items: NavItemDef[];
  location: string;
}) {
  const { t } = useLang();
  return (
    <div className="mb-1">
      <div className="flex items-center gap-2 px-7 mb-2 mt-1">
        <span className="text-[10px] font-bold tracking-widest uppercase text-white/25 whitespace-nowrap">
          {t(labelKey)}
        </span>
        <span className="flex-1 h-px bg-white/8" />
      </div>
      <ul className="space-y-0.5">
        {items.map(item => (
          <NavItem key={item.titleKey} item={item} location={location} />
        ))}
      </ul>
    </div>
  );
}

const ROLE_LABEL_KEYS: Record<string, TranslationKey> = {
  admin:                 "platformManager",
  real_estate_marketer:  "realEstateMarketer",
  service_provider:      "serviceProvider",
  broker:                "broker",
  developer:             "developer",
  user:                  "member",
};

const ROLE_COLORS: Record<string, string> = {
  admin:                "#f59e0b",
  real_estate_marketer:  "#38bdf8",
  service_provider:      "#34d399",
  user:                  "#94a3b8",
};

export function AppSidebar() {
  const [location] = useLocation();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { t } = useLang();

  const isMarketer = user?.role === "real_estate_marketer";
  const isServiceProvider = user?.role === "service_provider";
  const roleColor = ROLE_COLORS[user?.role ?? "user"] ?? "#94a3b8";

  return (
    <Sidebar
      side="right"
      variant="inset"
      className="border-l-0 shadow-2xl"
      style={{ background: "#0B1628" }}
    >
      {/* Header */}
      <SidebarHeader
        className="px-5 py-5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <LogoBrand variant="sidebar" linkTo="/" />
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent className="pt-4 pb-2 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">

        <NavGroup labelKey="marketplace"  items={marketplaceNavItems}  location={location} />
        <NavGroup labelKey="analytics"    items={analyticsNavItems}    location={location} />

        {isAuthenticated && (
          <NavGroup
            labelKey="myAccount"
            items={[
              { titleKey: "myDashboard",    url: "/dashboard",          icon: LayoutDashboard },
              { titleKey: "myListings" as TranslationKey, url: "/my/listings", icon: Building2 },
              ...(isMarketer        ? [{ titleKey: "marketerProfile" as TranslationKey, url: "/marketer/dashboard", icon: Star   }] : []),
              ...(isServiceProvider ? [{ titleKey: "services"         as TranslationKey, url: "/services/dashboard", icon: Wrench }] : []),
              { titleKey: "personalProfile", url: "/account",          icon: UserCircle2 },
            ]}
            location={location}
          />
        )}

        {isAuthenticated && !isMarketer && !isServiceProvider && !isAdmin && (
          <div className="mx-3 mt-3 mb-1">
            <Link
              href="/marketer/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/50 hover:text-white transition-all duration-200 group"
              style={{
                background: "linear-gradient(135deg,rgba(245,158,11,0.07),rgba(245,158,11,0.03))",
                border: "1px solid rgba(245,158,11,0.15)",
              }}
            >
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 group-hover:bg-amber-500/25 transition-all">
                <Star className="w-3.5 h-3.5" />
              </span>
              <span className="flex-1">{t("createMarketerProfile")}</span>
              <ChevronLeft className="w-3.5 h-3.5 text-amber-400/40" />
            </Link>
          </div>
        )}

        {isAdmin && (
          <NavGroup labelKey="administration" items={adminNavItems} location={location} />
        )}
      </SidebarContent>

      {/* Footer — user card */}
      {isAuthenticated && user && (
        <SidebarFooter
          className="p-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          {/* User card */}
          <div
            className="flex items-center gap-3 px-3 py-3 rounded-xl mb-2"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {/* Avatar circle */}
            <div
              className="relative flex items-center justify-center w-9 h-9 rounded-xl shrink-0 font-bold text-sm text-white"
              style={{
                background: `linear-gradient(135deg,${roleColor}33,${roleColor}18)`,
                border: `1px solid ${roleColor}40`,
              }}
            >
              {(user.fullName || user.username)?.[0]?.toUpperCase() ?? "؟"}
              {/* Online dot */}
              <span
                className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 rounded-full border-2"
                style={{
                  background: "#22c55e",
                  borderColor: "#0B1628",
                }}
              />
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold text-white truncate leading-tight">
                {user.fullName || user.username}
              </span>
              <span
                className="text-[11px] font-medium mt-0.5 truncate"
                style={{ color: roleColor + "cc" }}
              >
                {t(ROLE_LABEL_KEYS[user.role ?? "user"] ?? "member")}
              </span>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={() => void logout()}
            className="group flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            style={{
              color: "rgba(255,255,255,0.38)",
              background: "transparent",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.12)";
              (e.currentTarget as HTMLButtonElement).style.color = "#f87171";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.38)";
            }}
          >
            <LogOut className="w-4 h-4" />
            <span>{t("logout")}</span>
          </button>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
