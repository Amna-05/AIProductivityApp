"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { authApi } from "@/lib/api/auth";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Create context for dialog handlers
interface DialogContextType {
  openTaskDialog: () => void;
  openAIDialog: () => void;
}

const DialogContext = createContext<DialogContextType | null>(null);

export const useDialogs = () => {
  const context = useContext(DialogContext);
  if (!context) {
    return { openTaskDialog: () => {}, openAIDialog: () => {} };
  }
  return context;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { user, setUser, setLoading, isLoading } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [taskDialogTrigger, setTaskDialogTrigger] = useState(0);
  const [aiDialogTrigger, setAIDialogTrigger] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      // Since we use HttpOnly cookies, we can't check localStorage
      // Instead, try to fetch the user directly - if it fails, we're not authenticated
      if (!user) {
        try {
          setLoading(true);
          const userData = await authApi.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error("Auth check failed:", error);
          // Only redirect to login if we get 401 (unauthorized)
          // This prevents redirect loop
          if ((error as any)?.response?.status === 401) {
            router.push("/login");
          }
        } finally {
          setLoading(false);
        }
      }
    };

    checkAuth();
  }, [user, router, setUser, setLoading]);

  const dialogHandlers = {
    openTaskDialog: () => setTaskDialogTrigger((prev) => prev + 1),
    openAIDialog: () => setAIDialogTrigger((prev) => prev + 1),
  };

  // Show loading state
  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading ELEVATE...</p>
        </div>
      </div>
    );
  }

  return (
    <DialogContext.Provider value={dialogHandlers}>
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block">
          <Sidebar />
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div
              className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            onAddTask={() => setTaskDialogTrigger((prev) => prev + 1)}
            onAIParser={() => setAIDialogTrigger((prev) => prev + 1)}
          />
          <main className="flex-1 overflow-y-auto bg-background">
            {children}
          </main>
        </div>
      </div>
    </DialogContext.Provider>
  );
}
