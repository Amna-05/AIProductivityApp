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
        "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold",
        "transition-all duration-100 active:scale-[0.97] active:opacity-80",
        isActive
          ? "bg-emerald-50 text-emerald-700 border-l-[3px] border-emerald-500 -ml-px"
          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-emerald-600" : "text-gray-500")} />
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
    <div className="flex h-full w-56 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-14 items-center px-4 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-150">
            <ArrowUp className="h-4 w-4" />
          </div>
          <span className="text-lg font-black text-emerald-600 tracking-tight">
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
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
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
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
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
      <div className="border-t border-gray-100">
        {/* Admin Panel */}
        {isAdmin && (
          <div className="px-3 py-2">
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold",
                "transition-all duration-100 active:scale-[0.97] active:opacity-80",
                pathname === "/admin"
                  ? "bg-emerald-50 text-emerald-700 border-l-[3px] border-emerald-500 -ml-px"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Shield className={cn("h-4 w-4 shrink-0", pathname === "/admin" ? "text-emerald-600" : "text-gray-500")} />
              <span>Admin</span>
            </Link>
          </div>
        )}

        {/* Settings */}
        <div className="px-3 py-2">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold",
              "transition-all duration-100 active:scale-[0.97] active:opacity-80",
              pathname === "/settings"
                ? "bg-emerald-50 text-emerald-700 border-l-[3px] border-emerald-500 -ml-px"
                : "text-gray-700 hover:bg-gray-100"
            )}
          >
            <Settings className={cn("h-4 w-4 shrink-0", pathname === "/settings" ? "text-emerald-600" : "text-gray-500")} />
            <span>Settings</span>
          </Link>
        </div>

        <Separator className="bg-gray-100" />

        {/* Profile Section - Compact */}
        <div className="p-3">
          <div className={cn("relative rounded-lg transition-all", profileOpen && "bg-gray-50")}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-full flex items-center gap-2.5 px-2 py-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              {/* Avatar */}
              <div className="relative">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-semibold text-xs shadow-sm ring-2 ring-white">
                  {getUserInitials()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white" />
              </div>

              {/* User Info */}
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.username || "User"}
                </p>
              </div>

              {/* Chevron */}
              <ChevronDown className={cn(
                "h-4 w-4 text-gray-400 transition-transform duration-150",
                profileOpen && "rotate-180"
              )} />
            </button>

            {/* Dropdown Menu */}
            {profileOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden animate-scale-in">
                <div className="p-3 bg-gray-50 border-b border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Account</p>
                  <p className="text-sm font-medium text-gray-900 mt-1 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
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
