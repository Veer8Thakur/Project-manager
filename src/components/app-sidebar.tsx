import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, FolderKanban, CheckSquare, Users, LogOut, Shield } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "My Tasks", url: "/tasks", icon: CheckSquare },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[image:var(--gradient-primary)] text-primary-foreground">
            <CheckSquare className="h-4 w-4" />
          </div>
          {!collapsed && <span className="text-sm font-semibold tracking-tight">Teamflow</span>}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user?.role === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/team")}>
                    <Link to="/team">
                      <Users className="h-4 w-4" />
                      {!collapsed && <span>Team</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t">
        {user && !collapsed && (
          <div className="flex flex-col gap-2 p-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                {user.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{user.name}</p>
                <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {user.role === "admin" && <Shield className="h-3 w-3" />}
                  {user.role}
                </p>
              </div>
            </div>
            <Button
              variant="ghost" size="sm" className="justify-start"
              onClick={async () => { await logout(); navigate({ to: "/login", search: { redirect: "/dashboard" } }); }}
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </div>
        )}
        {user && collapsed && (
          <Button
            variant="ghost" size="icon" className="mx-auto my-2"
            onClick={async () => { await logout(); navigate({ to: "/login", search: { redirect: "/dashboard" } }); }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
