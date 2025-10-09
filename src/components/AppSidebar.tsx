import { useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  Users,
  MapPin,
  Shield,
  BarChart3,
  FileText,
  Settings,
  Zap,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  roles: Array<"Backoffice" | "StationOperator">;
}

const navigationItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: ["Backoffice", "StationOperator"],
  },
  {
    title: "Bookings",
    url: "/bookings",
    icon: Calendar,
    roles: ["Backoffice", "StationOperator"],
  },
  {
    title: "EV Owners",
    url: "/owners",
    icon: Users,
    roles: ["Backoffice", "StationOperator"],
  },
  {
    title: "Stations & Schedules",
    url: "/stations",
    icon: MapPin,
    roles: ["Backoffice", "StationOperator"],
  },
  {
    title: "Web Users & Roles",
    url: "/users",
    icon: Shield,
    roles: ["Backoffice"],
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
    roles: ["Backoffice"],
  },
  {
    title: "Audit Log",
    url: "/audit",
    icon: FileText,
    roles: ["Backoffice"],
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    roles: ["Backoffice"],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { user } = useAuth();
  const location = useLocation();
  const [isGroupExpanded, setIsGroupExpanded] = useState(true);

  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;
  const isCollapsed = state === "collapsed";

  // Filter items based on user role
  const visibleItems = navigationItems.filter(
    (item) => user?.role && item.roles.includes(user.role)
  );

  // Class name logic for active and inactive nav items
  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "bg-accent text-accent-foreground font-medium"
      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

  return (
    <Sidebar className={isCollapsed ? "w-64" : "w-64"} collapsible="icon">
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <Zap className="w-5 h-5 text-accent-foreground" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-sm font-semibold text-sidebar-foreground">
                EV System
              </h1>
              <p className="text-xs text-sidebar-foreground/60">v1.0.0</p>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <SidebarTrigger className="text-sidebar-foreground hover:text-sidebar-accent-foreground" />
        )}
      </div>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <div className="flex items-center gap-2 px-3 py-2">
            <SidebarGroupLabel className="text-sidebar-foreground/60 text-xs font-medium uppercase tracking-wide">
              Navigation
            </SidebarGroupLabel>
            {!isCollapsed && (
              <button
                onClick={() => setIsGroupExpanded(!isGroupExpanded)}
                className="ml-auto text-sidebar-foreground/60 hover:text-sidebar-foreground"
              >
                {isGroupExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {(isCollapsed || isGroupExpanded) && (
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={getNavClassName({
                          isActive: isActive(item.url),
                        })}
                      >
                        <item.icon className="w-5 h-5" />
                        {!isCollapsed && (
                          <span className="text-sm">{item.title}</span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>

        {!isCollapsed && user && (
          <div className="mt-auto p-3 border-t border-sidebar-border">
            <div className="text-xs text-sidebar-foreground/60 mb-1">
              Logged in as
            </div>
            <div className="text-sm text-sidebar-foreground font-medium">
              {user.fullName}
            </div>
            <div className="text-xs text-sidebar-foreground/60">
              {user.role}
            </div>
            {user.role === "StationOperator" && user.assignedStationId && (
              <div className="text-xs text-sidebar-foreground/60 mt-1">
                Station: {user.assignedStationId}
              </div>
            )}
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
