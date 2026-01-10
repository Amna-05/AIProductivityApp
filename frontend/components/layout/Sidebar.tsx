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
  FolderKanban,
  LogOut,
  ArrowUp,
  Shield,
  ChevronDown,
  Settings,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/lib/store/authStore";
import { authApi } from "@/lib/api/auth";
import { toast } from "sonner";

// Navigation with visual hierarchy
const mainNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    emphasis: "primary" as const,
  },
  {
    title: "All Tasks",
    href: "/tasks",
    icon: ListTodo,
    emphasis: "primary" as const,
  },
];

const viewNavItems = [
  {
    title: "Priority Matrix",
    href: "/priority-matrix",
    icon: Grid2x2,
    emphasis: "secondary" as const,
  },
  {
    title: "Categories",
    href: "/categories",
    icon: FolderKanban,
    emphasis: "secondary" as const,
  },
];

const insightNavItems = [
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    emphasis: "secondary" as const,
  },
];

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  emphasis: "primary" | "secondary";
};

interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
}

function NavLink({ item, isActive }: NavLinkProps) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold",
        "transition-all duration-200 active:scale-[0.97]",
        "group relative overflow-hidden border-l-4",
        isActive
          ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/20 border-l-primary"
          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground border-l-transparent hover:border-l-primary/40"
      )}
    >
      <div className={cn(
        "p-1.5 rounded-lg transition-colors",
        isActive
          ? "bg-white/20"
          : "bg-secondary group-hover:bg-primary/10"
      )}>
        <Icon className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          isActive ? "text-white" : "text-muted-foreground group-hover:text-primary"
        )} />
      </div>
      <span className="relative z-10">{item.title}</span>
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0" />
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, logout } = useAuthStore();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      logout();
      toast.success("Logged out");
      router.push("/login");
    } catch {
      toast.error("Failed to logout");
    }
  };

  // Get user initials
  const getUserInitials = () => {
    if (!user?.username) return "U";
    const names = user.username.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex h-full w-56 flex-col border-r border-border bg-gradient-to-b from-background to-secondary/20">
      {/* Logo */}
      <div className="flex h-16 items-center px-4 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/20 group-hover:shadow-xl group-hover:shadow-primary/30 group-hover:scale-105 transition-all duration-200">
            <ArrowUp className="h-5 w-5" />
          </div>
          <span className="text-xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-tight">
            ELEVATE
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto space-y-6">
        {/* Main Section */}
        <div className="space-y-1.5">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={pathname === item.href}
            />
          ))}
        </div>

        {/* Views Section */}
        <div className="space-y-1.5">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Views
          </p>
          {viewNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={pathname === item.href}
            />
          ))}
        </div>

        {/* Insights Section */}
        <div className="space-y-1.5">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Insights
          </p>
          {insightNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={pathname === item.href}
            />
          ))}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-border bg-secondary/30">
        {/* Admin Panel */}
        {isAdmin && (
          <div className="px-3 pt-3">
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold border-l-4",
                "transition-all duration-200 active:scale-[0.97] group",
                pathname === "/admin"
                  ? "bg-info/20 text-info border-l-info shadow-md shadow-info/20"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-info border-l-transparent hover:border-l-info/40"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg transition-colors",
                pathname === "/admin" ? "bg-info/20" : "bg-secondary group-hover:bg-info/10"
              )}>
                <Shield className={cn(
                  "h-4 w-4 shrink-0",
                  pathname === "/admin" ? "text-info" : "text-muted-foreground group-hover:text-info"
                )} />
              </div>
              <span>Admin Panel</span>
            </Link>
          </div>
        )}

        {/* Settings */}
        <div className="px-3 py-2">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold border-l-4",
              "transition-all duration-200 active:scale-[0.97] group",
              pathname === "/settings"
                ? "bg-primary/20 text-primary border-l-primary shadow-md shadow-primary/20"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-primary border-l-transparent hover:border-l-primary/40"
            )}
          >
            <div className={cn(
              "p-1.5 rounded-lg transition-colors",
              pathname === "/settings" ? "bg-primary/20" : "bg-secondary group-hover:bg-primary/10"
            )}>
              <Settings className={cn(
                "h-4 w-4 shrink-0",
                pathname === "/settings" ? "text-primary" : "text-muted-foreground group-hover:text-primary"
              )} />
            </div>
            <span>Settings</span>
          </Link>
        </div>

        <Separator className="bg-border mx-3" />

        {/* Profile Section - Compact */}
        <div className="p-3">
          <div className={cn("relative rounded-lg transition-all", profileOpen && "bg-secondary/50")}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-full flex items-center gap-3 px-2 py-2.5 hover:bg-secondary/50 rounded-lg transition-all duration-200"
            >
              {/* Avatar */}
              <div className="relative">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/20 ring-2 ring-card">
                  {getUserInitials()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-card shadow-sm" />
              </div>

              {/* User Info */}
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-bold text-foreground truncate">
                  {user?.username || "User"}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">Online</p>
              </div>

              {/* Chevron */}
              <ChevronDown className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                profileOpen && "rotate-180 text-primary"
              )} />
            </button>

            {/* Dropdown Menu */}
            {profileOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-lg shadow-xl overflow-hidden animate-scale-in">
                <div className="p-3 bg-secondary border-b border-border">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Account</p>
                  <p className="text-sm font-semibold text-foreground mt-1 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <div className="p-1.5 rounded-lg bg-destructive/10">
                    <LogOut className="h-4 w-4" />
                  </div>
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
