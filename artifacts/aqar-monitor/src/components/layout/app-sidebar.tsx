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

const mainNavItems = [
  { title: "لوحة التحكم", url: "/", icon: Home },
  { title: "تحليل السوق", url: "/analytics", icon: BarChart3 },
  { title: "مقارنة الأحياء", url: "/districts", icon: Map },
  { title: "سجل البيانات", url: "/records", icon: Table },
  { title: "الوحدات المستقبلية", url: "/future", icon: Sparkles },
];

const adminNavItems = [
  { title: "لوحة الإدارة", url: "/admin", icon: LayoutDashboard },
  { title: "إضافة سجل", url: "/admin/add", icon: PlusCircle },
];

function NavGroup({
  label,
  items,
  location,
}: {
  label: string;
  items: typeof mainNavItems;
  location: string;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sidebar-foreground/50 px-6 font-medium text-xs mb-2">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="px-3">
          {items.map((item) => {
            const isActive =
              item.url === "/"
                ? location === "/"
                : location.startsWith(item.url);
            return (
              <SidebarMenuItem key={item.title} className="mb-1">
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className={cn(
                    "h-11 rounded-xl transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground font-medium shadow-md shadow-primary/10"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <Link
                    href={item.url}
                    className="flex items-center gap-3 px-3"
                  >
                    <item.icon
                      className={cn(
                        "w-5 h-5",
                        isActive
                          ? "text-primary-foreground"
                          : "text-sidebar-foreground/50"
                      )}
                    />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const [location] = useLocation();
  const { isAuthenticated, username, logout } = useAuth();

  return (
    <Sidebar side="right" variant="inset" className="border-l border-border bg-sidebar">
      <SidebarHeader className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Building2 className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-tight tracking-tight text-sidebar-foreground">
              عقار إنسايت
            </span>
            <span className="text-[10px] text-sidebar-foreground/60 leading-tight">
              منصة ذكية لتحليل سوق العقار
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-4">
        <NavGroup label="القائمة الرئيسية" items={mainNavItems} location={location} />

        <SidebarSeparator className="mx-4 my-2 bg-sidebar-border/50" />

        <NavGroup label="الإدارة" items={adminNavItems} location={location} />
      </SidebarContent>

      {isAuthenticated && (
        <SidebarFooter className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-sidebar-accent/40 mb-1">
            <UserCircle2 className="w-5 h-5 text-primary shrink-0" />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-sidebar-foreground truncate">
                {username ?? "المدير"}
              </span>
              <span className="text-[10px] text-sidebar-foreground/50">حساب المدير</span>
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
