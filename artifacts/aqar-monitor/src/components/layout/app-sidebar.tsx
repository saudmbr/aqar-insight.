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

const marketplaceNavItems = [
  { title: "العقارات", url: "/listings", icon: Building2 },
  { title: "المسوّقون", url: "/marketers", icon: Star },
  { title: "سوق الخدمات", url: "/services", icon: Wrench },
  { title: "الطلبات", url: "/requests", icon: FileText },
];

const analyticsNavItems = [
  { title: "الرئيسية", url: "/", icon: Home, exact: true },
  { title: "تحليل السوق", url: "/analytics", icon: BarChart3 },
  { title: "مقارنة الأحياء", url: "/districts", icon: Map },
  { title: "المشاريع المستقبلية", url: "/future", icon: Sparkles },
];

const adminNavItems = [
  { title: "لوحة الإدارة", url: "/admin", icon: LayoutDashboard },
  { title: "إضافة سجل", url: "/admin/add", icon: PlusCircle },
  { title: "المستخدمون", url: "/admin/users", icon: Users },
];

type NavItemDef = { title: string; url: string; icon: React.ComponentType<{ className?: string }>; exact?: boolean };

function NavItem({ item, location }: { item: NavItemDef; location: string }) {
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
          <span className="text-sm">{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function NavGroup({ label, items, location }: { label: string; items: NavItemDef[]; location: string }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sidebar-foreground/45 px-6 font-bold text-[11px] mb-1 tracking-normal">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="px-4">
          {items.map(item => <NavItem key={item.title} item={item} location={location} />)}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

const ROLE_LABELS: Record<string, string> = {
  admin: "مدير النظام",
  real_estate_marketer: "مسوّق عقاري",
  service_provider: "مزوّد خدمة",
  broker: "وسيط عقاري",
  developer: "مطوّر عقاري",
  user: "عضو موثق",
};

export function AppSidebar() {
  const [location] = useLocation();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();

  const isMarketer = user?.role === "real_estate_marketer";

  return (
    <Sidebar side="right" variant="inset" className="border-l-0 bg-sidebar shadow-2xl">
      <SidebarHeader className="h-20 flex items-center justify-center px-6 border-b border-sidebar-border/50">
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
        <NavGroup label="السوق العقاري" items={marketplaceNavItems} location={location} />

        {/* Analytics */}
        <NavGroup label="التحليلات والمؤشرات" items={analyticsNavItems} location={location} />

        {/* Authenticated User Nav */}
        {isAuthenticated && (
          <NavGroup label="حسابي" items={[
            { title: "لوحتي", url: "/dashboard", icon: LayoutDashboard },
            ...(isMarketer ? [{ title: "ملف المسوّق", url: "/marketer/dashboard", icon: Star }] : []),
            { title: "الملف الشخصي", url: "/account", icon: UserCircle2 },
          ]} location={location} />
        )}

        {/* Marketer shortcut for non-marketers */}
        {isAuthenticated && !isMarketer && !isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/45 px-6 font-bold text-[11px] mb-1 tracking-normal">
              انضم كمسوّق
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="px-4">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="h-11 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white">
                    <Link href="/marketer/dashboard" className="flex items-center gap-3 px-4">
                      <Star className="w-4 h-4 text-sidebar-foreground/75" />
                      <span className="text-sm">أنشئ ملف مسوّق</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin Nav */}
        {isAdmin && (
          <NavGroup label="الإدارة" items={adminNavItems} location={location} />
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
                {ROLE_LABELS[user.role ?? "user"] ?? "عضو"}
              </span>
            </div>
          </div>
          <button
            onClick={() => void logout()}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive transition-all duration-300 group"
          >
            <LogOut className="w-4 h-4 group-hover:text-destructive transition-colors" />
            <span>تسجيل الخروج</span>
          </button>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
