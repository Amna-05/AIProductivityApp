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
  const isPrimary = item.emphasis === "primary";

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
        "hover:translate-x-0.5",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : isPrimary
            ? "text-foreground hover:bg-accent hover:text-accent-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", !isActive && !isPrimary && "opacity-70")} />
      <span>{item.title}</span>
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
    } catch (error) {
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
    <div className="flex h-full w-52 flex-col border-r bg-card/50">
      {/* Logo */}
      <div className="flex h-14 items-center px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-600 text-white shadow-sm group-hover:shadow-md transition-all duration-150">
            <ArrowUp className="h-4 w-4" />
          </div>
          <span className="text-base font-bold bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
            ELEVATE
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-6">
        {/* Main Section */}
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={pathname === item.href}
            />
          ))}
        </div>

        {/* Views Section */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
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
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
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
      <div className="border-t">
        {/* Admin Panel */}
        {isAdmin && (
          <div className="px-3 py-2">
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                pathname === "/admin"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Shield className="h-4 w-4 shrink-0" />
              <span>Admin</span>
            </Link>
          </div>
        )}

        {/* Settings */}
        <div className="px-3 py-2">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
              pathname === "/settings"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span>Settings</span>
          </Link>
        </div>

        <Separator />

        {/* Profile Section - Compact */}
        <div className="p-3">
          <div className={cn("relative rounded-lg transition-all", profileOpen && "bg-accent")}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-full flex items-center gap-2.5 px-2 py-2 hover:bg-accent rounded-lg transition-colors"
            >
              {/* Avatar - smaller */}
              <div className="relative">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-white font-semibold text-[10px] shadow-sm">
                  {getUserInitials()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-success border-2 border-card" />
              </div>

              {/* User Info - condensed */}
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.username || "User"}
                </p>
              </div>

              {/* Chevron */}
              <ChevronDown className={cn(
                "h-3.5 w-3.5 text-muted-foreground transition-transform duration-150",
                profileOpen && "rotate-180"
              )} />
            </button>

            {/* Dropdown Menu */}
            {profileOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-card border rounded-lg shadow-lg overflow-hidden animate-scale-in">
                <div className="p-3 bg-muted/30 border-b">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Account</p>
                  <p className="text-sm font-medium text-foreground mt-1 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
