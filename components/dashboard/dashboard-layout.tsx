"use client";

import React from "react"

import { useState } from "react";
import { useAuth, type UserRole } from "@/contexts/auth-context";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  LayoutDashboard,
  Search,
  Shield,
  Upload,
  FileText,
  Users,
  User,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Mail,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "viewer", "wl_viewer"],
  },
  {
    title: "Email Search",
    href: "/dashboard/search",
    icon: Search,
    roles: ["admin", "viewer", "wl_viewer"],
  },
  {
    title: "Whitelist",
    href: "/dashboard/whitelist",
    icon: Shield,
    roles: ["admin", "wl_viewer"],
  },
  {
    title: "Bulk Operations",
    href: "/dashboard/bulk",
    icon: Upload,
    roles: ["admin", "wl_viewer"],
  },
  {
    title: "Audit Logs",
    href: "/dashboard/audit",
    icon: FileText,
    roles: ["admin", "wl_viewer"],
  },
  {
    title: "User Admin",
    href: "/dashboard/admin",
    icon: Users,
    roles: ["admin"],
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: User,
    roles: ["admin", "viewer", "wl_viewer"],
  },
];

function getRoleLabel(role: UserRole): string {
  switch (role) {
    case "admin":
      return "Administrator";
    case "viewer":
      return "Viewer";
    case "wl_viewer":
      return "WL+Viewer";
    default:
      return "Unknown";
  }
}

function getRoleBadgeColor(role: UserRole): string {
  switch (role) {
    case "admin":
      return "bg-destructive/20 text-destructive";
    case "wl_viewer":
      return "bg-warning/20 text-warning-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, hasPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const filteredNavItems = navItems.filter((item) =>
    hasPermission(item.roles)
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
       <aside
        className={cn(
          "flex flex-col border-r border-border bg-sidebar transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Mail className="h-4 w-4 text-primary-foreground" />
          </div>
          {!sidebarCollapsed && (
            <span className="font-semibold text-sidebar-foreground">
              Email Flow Analyzer
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Button
                key={item.href}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3",
                  sidebarCollapsed && "justify-center px-2",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
                onClick={() => router.push(item.href)}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && <span>{item.title}</span>}
              </Button>
            );
          })}
        </nav>

        {/* Collapse Button */}
        <div className="border-t border-sidebar-border p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                sidebarCollapsed && "rotate-180"
              )}
            />
          </Button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border bg-sidebar transition-transform lg:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Mail className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sidebar-foreground">
              Email Flow Analyzer
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="space-y-1 p-2">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Button
                key={item.href}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
                onClick={() => {
                  router.push(item.href);
                  setMobileMenuOpen(false);
                }}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-card-foreground">
              {filteredNavItems.find((item) => item.href === pathname)?.title ||
                "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-2"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profilePicture || "/placeholder.svg"} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden flex-col items-start md:flex">
                    <span className="text-sm font-medium">{user?.username}</span>
                    <span
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded",
                        getRoleBadgeColor(user?.role || "viewer")
                      )}
                    >
                      {getRoleLabel(user?.role || "viewer")}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-background p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
