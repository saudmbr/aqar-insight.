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
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
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
  { titleKey: "home", url: "/", icon: Home, exact: true },
  { titleKey: "properties", url: "/listings", icon: Building2 },
  { titleKey: "map", url: "/map", icon: Map },
  { titleKey: "marketers", url: "/marketers", icon: Star },
  { titleKey: "services", url: "/services", icon: Wrench },
  { titleKey: "requests", url: "/requests", icon: FileText },
];

const analyticsNavItems: NavItemDef[] = [
  { titleKey: "marketAnalysis", url: "/analytics", icon: BarChart3 },
  { titleKey: "districtComparison", url: "/districts", icon: Map },
  { titleKey: "futureProjects", url: "/future", icon: Sparkles },
];

const adminNavItems: NavItemDef[] = [
  { titleKey: "adminPanel", url: "/admin", icon: LayoutDashboard },
  { titleKey: "addRecord", url: "/admin/add", icon: PlusCircle },
  { titleKey: "users", url: "/admin/users", icon: Users },
];

function NavItem({ item, location }: { item: NavItemDef; location: string }) {
  const { t } = useLang();
  const isActive = item.exact ? location === item.url : location.startsWith(item.url);
  return (
    <SidebarMenuItem className="mb-1.5">
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className={cn(
          "h-11 rounded-xl transition-all duration-300",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
            : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white"
        )}
      >
        <Link href={item.url} className="flex items-center gap-3 px-4">
          <item.icon className={cn("w-4 h-4 transition-colors", isActive ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/75")} />
          <span className="text-sm">{t(item.titleKey)}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function NavGroup({ labelKey, items, location }: { labelKey: TranslationKey; items: NavItemDef[]; location: string }) {
  const { t } = useLang();
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sidebar-foreground/45 px-6 font-bold text-[11px] mb-1 tracking-normal">
        {t(labelKey)}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="px-4">
          {items.map(item => <NavItem key={item.titleKey} item={item} location={location} />)}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

const ROLE_LABEL_KEYS: Record<string, TranslationKey> = {
  admin: "platformManager",
  real_estate_marketer: "realEstateMarketer",
  service_provider: "serviceProvider",
  broker: "broker",
  developer: "developer",
  user: "member",
};

export function AppSidebar() {
  const [location] = useLocation();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { t } = useLang();

  const isMarketer = user?.role === "real_estate_marketer";

  return (
    <Sidebar side="right" variant="inset" className="border-l-0 bg-sidebar shadow-2xl">
      <SidebarHeader className="h-16 flex items-center justify-center px-6 border-b border-sidebar-border/50">
        <div className="flex items-center gap-4 w-full">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl leading-tight tracking-tight text-white">عقار إنسايت</span>
            <span className="text-xs text-sidebar-foreground/80 leading-tight mt-0.5">منصة ذكية للعقار</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-6 space-y-4">
        {/* Marketplace */}
        <NavGroup labelKey="marketplace" items={marketplaceNavItems} location={location} />

        {/* Analytics */}
        <NavGroup labelKey="analytics" items={analyticsNavItems} location={location} />

        {/* Authenticated User Nav */}
        {isAuthenticated && (
          <NavGroup labelKey="myAccount" items={[
            { titleKey: "myDashboard", url: "/dashboard", icon: LayoutDashboard },
            ...(isMarketer ? [{ titleKey: "marketerProfile" as TranslationKey, url: "/marketer/dashboard", icon: Star }] : []),
            { titleKey: "personalProfile", url: "/account", icon: UserCircle2 },
          ]} location={location} />
        )}

        {/* Marketer shortcut for non-marketers */}
        {isAuthenticated && !isMarketer && !isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/45 px-6 font-bold text-[11px] mb-1 tracking-normal">
              {t("joinMarketer")}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="px-4">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="h-11 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white">
                    <Link href="/marketer/dashboard" className="flex items-center gap-3 px-4">
                      <Star className="w-4 h-4 text-sidebar-foreground/75" />
                      <span className="text-sm">{t("createMarketerProfile")}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin Nav */}
        {isAdmin && (
          <NavGroup labelKey="administration" items={adminNavItems} location={location} />
        )}
      </SidebarContent>

      {isAuthenticated && user && (
        <SidebarFooter className="border-t border-sidebar-border/50 p-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-sidebar-border/30 mb-2">
            <UserCircle2 className="w-8 h-8 text-sidebar-foreground shrink-0" />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold text-white truncate">
                {user.fullName || user.username}
              </span>
              <span className="text-xs text-sidebar-foreground/75 mt-0.5">
                {t(ROLE_LABEL_KEYS[user.role ?? "user"] ?? "member")}
              </span>
            </div>
          </div>
          <button
            onClick={() => void logout()}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive transition-all duration-300 group"
          >
            <LogOut className="w-4 h-4 group-hover:text-destructive transition-colors" />
            <span>{t("logout")}</span>
          </button>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
