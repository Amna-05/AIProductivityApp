"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard,
  ListTodo,
  Grid2x2,
  BarChart3,
  TrendingUp,
  Sparkles,
  Settings,
  LogOut,
  ArrowUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/lib/store/authStore";
import { authApi } from "@/lib/api/auth";
import { toast } from "sonner";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "All Tasks",
    href: "/tasks",
    icon: ListTodo,
  },
  {
    title: "Priority Matrix",
    href: "/priority-matrix",
    icon: Grid2x2,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Productivity Insights",
    href: "/productivity-insights",
    icon: TrendingUp,
  },
  {
    title: "AI Parser",
    href: "/ai",
    icon: Sparkles,
  },
];

export function Sidebar() {
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await authApi.logout();
      logout();
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r bg-card shadow-sm transition-all duration-200 ease-in-out",
        isHovered ? "w-60" : "w-16"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo/Brand - ELEVATE */}
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
            <ArrowUp className="h-6 w-6" />
          </div>
          <div
            className={cn(
              "overflow-hidden transition-all duration-200",
              isHovered ? "w-auto opacity-100" : "w-0 opacity-0"
            )}
          >
            <span className="text-lg font-bold text-foreground whitespace-nowrap">ELEVATE</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 relative group",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground hover:shadow-sm",
                  !isHovered && "justify-center"
                )}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-foreground rounded-r-full" />
                )}

                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    isActive && "drop-shadow-sm"
                  )}
                />

                <span
                  className={cn(
                    "overflow-hidden transition-all duration-200 whitespace-nowrap",
                    isHovered ? "w-auto opacity-100" : "w-0 opacity-0"
                  )}
                >
                  {item.title}
                </span>

                {/* Tooltip for collapsed state */}
                {!isHovered && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-foreground text-background text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                    {item.title}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* Settings & Logout */}
      <div className="p-2 space-y-1 border-t">
        {/* User Profile (only shows when expanded) */}
        {user && isHovered && (
          <div className="mb-2 rounded-lg border bg-card p-3 shadow-sm mx-1">
            <p className="text-sm font-semibold text-foreground truncate">{user.username}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        )}

        {/* User Avatar (collapsed state) */}
        {user && !isHovered && (
          <div className="flex items-center justify-center mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">
                {user.username?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
          </div>
        )}

        <Link href="/settings">
          <div
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-200 relative group",
              !isHovered && "justify-center"
            )}
          >
            <Settings className="h-5 w-5 shrink-0" />
            <span
              className={cn(
                "overflow-hidden transition-all duration-200 whitespace-nowrap",
                isHovered ? "w-auto opacity-100" : "w-0 opacity-0"
              )}
            >
              Settings
            </span>

            {/* Tooltip */}
            {!isHovered && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-foreground text-background text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                Settings
              </div>
            )}
          </div>
        </Link>

        <Button
          variant="ghost"
          className={cn(
            "w-full gap-3 text-muted-foreground hover:text-foreground hover:bg-accent relative group",
            isHovered ? "justify-start" : "justify-center px-3"
          )}
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span
            className={cn(
              "overflow-hidden transition-all duration-200 whitespace-nowrap",
              isHovered ? "w-auto opacity-100" : "w-0 opacity-0"
            )}
          >
            Logout
          </span>

          {/* Tooltip */}
          {!isHovered && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-foreground text-background text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
              Logout
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}
