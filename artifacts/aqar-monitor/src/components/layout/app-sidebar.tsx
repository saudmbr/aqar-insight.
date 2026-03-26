import {
  BarChart3,
  Building2,
  Home,
  LogOut,
  Map,
  PlusCircle,
  Sparkles,
  Table,
  LayoutDashboard,
  UserCircle2,
  Wrench,
  FileText,
  Users,
  ShoppingBag,
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
  { title: "سوق الخدمات", url: "/services", icon: Wrench },
  { title: "الطلبات", url: "/requests", icon: FileText },
];

const analyticsNavItems = [
  { title: "لوحة التحكم", url: "/", icon: Home, exact: true },
  { title: "تحليل السوق", url: "/analytics", icon: BarChart3 },
  { title: "مقارنة الأحياء", url: "/districts", icon: Map },
  { title: "سجل البيانات", url: "/records", icon: Table },
  { title: "الوحدات المستقبلية", url: "/future", icon: Sparkles },
];

const adminNavItems = [
  { title: "لوحة الإدارة", url: "/admin", icon: LayoutDashboard },
  { title: "إضافة سجل", url: "/admin/add", icon: PlusCircle },
  { title: "المستخدمون", url: "/admin/users", icon: Users },
];

function NavItem({ item, location }: { item: { title: string; url: string; icon: React.ComponentType<{ className?: string }>; exact?: boolean }; location: string }) {
  const isActive = item.exact ? location === item.url : location.startsWith(item.url);
  return (
    <SidebarMenuItem className="mb-1">
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className={cn(
          "h-10 rounded-xl transition-all duration-200",
          isActive
            ? "bg-primary text-primary-foreground font-medium shadow-md shadow-primary/10"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        )}
      >
        <Link href={item.url} className="flex items-center gap-3 px-3">
          <item.icon className={cn("w-4 h-4", isActive ? "text-primary-foreground" : "text-sidebar-foreground/50")} />
          <span className="text-sm">{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function NavGroup({ label, items, location }: { label: string; items: Parameters<typeof NavItem>[0]["item"][]; location: string }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sidebar-foreground/40 px-6 font-medium text-[11px] uppercase tracking-wider mb-1">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="px-3">
          {items.map(item => <NavItem key={item.title} item={item} location={location} />)}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const [location] = useLocation();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();

  const isDashboardActive = location === "/dashboard";
  const isAccountActive = location === "/account";

  return (
    <Sidebar side="right" variant="inset" className="border-l border-border bg-sidebar">
      <SidebarHeader className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Building2 className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-tight tracking-tight text-sidebar-foreground">عقار إنسايت</span>
            <span className="text-[10px] text-sidebar-foreground/60 leading-tight">منصة ذكية للعقار</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-4 space-y-1">
        {/* Marketplace */}
        <NavGroup label="السوق" items={marketplaceNavItems} location={location} />

        <SidebarSeparator className="mx-4 bg-sidebar-border/50" />

        {/* Analytics */}
        <NavGroup label="التحليلات" items={analyticsNavItems} location={location} />

        {/* Authenticated User Nav */}
        {isAuthenticated && (
          <>
            <SidebarSeparator className="mx-4 bg-sidebar-border/50" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-sidebar-foreground/40 px-6 font-medium text-[11px] uppercase tracking-wider mb-1">
                حسابي
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="px-3">
                  <NavItem item={{ title: "لوحتي", url: "/dashboard", icon: LayoutDashboard }} location={location} />
                  <NavItem item={{ title: "حسابي", url: "/account", icon: UserCircle2 }} location={location} />
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {/* Admin Nav */}
        {isAdmin && (
          <>
            <SidebarSeparator className="mx-4 bg-sidebar-border/50" />
            <NavGroup label="الإدارة" items={adminNavItems} location={location} />
          </>
        )}
      </SidebarContent>

      {isAuthenticated && user && (
        <SidebarFooter className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-sidebar-accent/40 mb-1">
            <UserCircle2 className="w-5 h-5 text-primary shrink-0" />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-sidebar-foreground truncate">
                {user.fullName || user.username}
              </span>
              <span className="text-[10px] text-sidebar-foreground/50">
                {user.role === "admin" ? "مدير" : user.role === "property_owner" ? "مالك عقار" :
                  user.role === "broker" ? "وسيط" : user.role === "service_provider" ? "مزوّد خدمة" : "مستخدم"}
              </span>
            </div>
          </div>
          <button
            onClick={() => void logout()}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 group"
          >
            <LogOut className="w-4 h-4 group-hover:text-destructive transition-colors" />
            <span>تسجيل الخروج</span>
          </button>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
