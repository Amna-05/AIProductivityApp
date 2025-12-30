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
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold",
        "transition-all duration-200 active:scale-[0.97]",
        "group relative overflow-hidden",
        isActive
          ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-200"
          : "text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900"
      )}
    >
      <div className={cn(
        "p-1.5 rounded-lg transition-colors",
        isActive
          ? "bg-white/20"
          : "bg-gray-100 group-hover:bg-emerald-100"
      )}>
        <Icon className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          isActive ? "text-white" : "text-gray-500 group-hover:text-emerald-600"
        )} />
      </div>
      <span className="relative z-10">{item.title}</span>
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-shimmer" />
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
    <div className="flex h-full w-56 flex-col border-r border-gray-100 bg-gradient-to-b from-white via-gray-50/50 to-emerald-50/30">
      {/* Logo */}
      <div className="flex h-16 items-center px-4 border-b border-gray-100/80">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200 group-hover:shadow-xl group-hover:shadow-emerald-300 group-hover:scale-105 transition-all duration-200">
            <ArrowUp className="h-5 w-5" />
          </div>
          <span className="text-xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent tracking-tight">
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
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
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
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
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
      <div className="border-t border-gray-100/80 bg-white/50">
        {/* Admin Panel */}
        {isAdmin && (
          <div className="px-3 pt-3">
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold",
                "transition-all duration-200 active:scale-[0.97] group",
                pathname === "/admin"
                  ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md shadow-violet-200"
                  : "text-gray-600 hover:bg-violet-50 hover:text-violet-700"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg transition-colors",
                pathname === "/admin" ? "bg-white/20" : "bg-violet-100"
              )}>
                <Shield className={cn(
                  "h-4 w-4 shrink-0",
                  pathname === "/admin" ? "text-white" : "text-violet-600"
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
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold",
              "transition-all duration-200 active:scale-[0.97] group",
              pathname === "/settings"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-200"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <div className={cn(
              "p-1.5 rounded-lg transition-colors",
              pathname === "/settings" ? "bg-white/20" : "bg-gray-100 group-hover:bg-emerald-100"
            )}>
              <Settings className={cn(
                "h-4 w-4 shrink-0",
                pathname === "/settings" ? "text-white" : "text-gray-500 group-hover:text-emerald-600"
              )} />
            </div>
            <span>Settings</span>
          </Link>
        </div>

        <Separator className="bg-gray-100/80 mx-3" />

        {/* Profile Section - Compact */}
        <div className="p-3">
          <div className={cn("relative rounded-xl transition-all", profileOpen && "bg-emerald-50/50")}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-full flex items-center gap-3 px-2 py-2.5 hover:bg-emerald-50/50 rounded-xl transition-all duration-200"
            >
              {/* Avatar */}
              <div className="relative">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-200 ring-2 ring-white">
                  {getUserInitials()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
              </div>

              {/* User Info */}
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {user?.username || "User"}
                </p>
                <p className="text-[10px] text-gray-500 truncate">Online</p>
              </div>

              {/* Chevron */}
              <ChevronDown className={cn(
                "h-4 w-4 text-gray-400 transition-transform duration-200",
                profileOpen && "rotate-180 text-emerald-600"
              )} />
            </button>

            {/* Dropdown Menu */}
            {profileOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-scale-in">
                <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-100">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Account</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <div className="p-1.5 rounded-lg bg-red-100">
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
