import { 
  BarChart3, 
  Building2, 
  Home, 
  Map, 
  PlusCircle, 
  Sparkles, 
  Table 
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "لوحة التحكم", url: "/", icon: Home },
  { title: "تحليل السوق", url: "/analytics", icon: BarChart3 },
  { title: "مقارنة الأحياء", url: "/districts", icon: Map },
  { title: "سجل البيانات", url: "/records", icon: Table },
  { title: "إضافة سجل", url: "/admin/add", icon: PlusCircle },
  { title: "الوحدات المستقبلية", url: "/future", icon: Sparkles },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar side="right" variant="inset" className="border-l border-border bg-sidebar">
      <SidebarHeader className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Building2 className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-tight tracking-tight text-sidebar-foreground">عقار إنسايت</span>
            <span className="text-[10px] text-sidebar-foreground/60 leading-tight">منصة ذكية لتحليل سوق العقار</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 px-6 font-medium text-xs mb-2">
            القائمة الرئيسية
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-3">
              {navItems.map((item) => {
                const isActive = location === item.url;
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
                      <Link href={item.url} className="flex items-center gap-3 px-3">
                        <item.icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-sidebar-foreground/50")} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
