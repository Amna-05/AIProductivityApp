"use client";

import { useEffect, useState, createContext, useContext, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { authApi } from "@/lib/api/auth";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { TaskFormDialog } from "@/components/tasks/TaskFormDialog";
import { AITaskParserDialog } from "@/components/ai/AITaskParserDialog";
import { cn } from "@/lib/utils/cn";
import { Loader2, Sparkles, ArrowUp, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const SearchContext = createContext<SearchContextType>({
  searchQuery: "",
  setSearchQuery: () => {},
});

export const useSearch = () => useContext(SearchContext);

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { user, setUser, setLoading, isLoading } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);

  // Check if user is new (first visit)
  useEffect(() => {
    if (user && typeof window !== "undefined") {
      const welcomed = localStorage.getItem("elevate_welcomed");
      if (!welcomed) {
        setShowWelcome(true);
      }
    }
  }, [user]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Cmd/Ctrl + N: New task
    if ((e.metaKey || e.ctrlKey) && e.key === "n") {
      e.preventDefault();
      setTaskDialogOpen(true);
    }
    // Cmd/Ctrl + Shift + A: AI Parser
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "a") {
      e.preventDefault();
      setAiDialogOpen(true);
    }
    // Cmd/Ctrl + K: Focus search (if implemented in header)
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      // Focus search input - could emit event or use ref
      const searchInput = document.querySelector('input[placeholder="Search tasks..."]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        try {
          setLoading(true);
          const userData = await authApi.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error("Auth check failed:", error);
          if ((error as any)?.response?.status === 401) {
            router.push("/login");
          }
        } finally {
          setLoading(false);
        }
      }
    };

    checkAuth();
  }, []);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading ELEVATE...</p>
        </div>
      </div>
    );
  }

  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery }}>
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
                "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-out",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            onAddTask={() => setTaskDialogOpen(true)}
            onAIParser={() => setAiDialogOpen(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
          <main className="flex-1 overflow-y-auto bg-background">
            {children}
          </main>
        </div>
      </div>

      {/* Floating AI Button */}
      <Button
        variant="default"
        size="icon"
        className={cn(
          "fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg z-50",
          "bg-gradient-to-br from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90",
          "transition-all duration-200 hover:scale-105 hover:shadow-xl",
          "animate-fade-in"
        )}
        onClick={() => setAiDialogOpen(true)}
      >
        <Sparkles className="h-5 w-5 text-white" />
        <span className="sr-only">AI Task Parser</span>
      </Button>

      {/* Welcome Modal for New Users */}
      {showWelcome && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-md w-full animate-scale-in bg-white shadow-2xl border-0">
            <CardContent className="p-8 text-center">
              {/* Logo */}
              <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-100 mx-auto mb-6">
                <ArrowUp className="h-10 w-10 text-emerald-600" />
              </div>

              {/* Welcome Text */}
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to ELEVATE! 👋
              </h2>
              <p className="text-gray-600 mb-6">
                Ready to boost your productivity? Let's get started with your first task!
              </p>

              {/* Features Preview */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 rounded-lg bg-emerald-50 text-left">
                  <Sparkles className="h-5 w-5 text-emerald-600 mb-1" />
                  <p className="text-xs font-medium text-gray-700">AI Task Parsing</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 text-left">
                  <Rocket className="h-5 w-5 text-blue-600 mb-1" />
                  <p className="text-xs font-medium text-gray-700">Priority Matrix</p>
                </div>
              </div>

              {/* CTA Button */}
              <Button
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 font-semibold text-base"
                onClick={() => {
                  localStorage.setItem("elevate_welcomed", "true");
                  setShowWelcome(false);
                }}
              >
                Let's Go! 🚀
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dialogs */}
      <TaskFormDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        task={null}
      />
      <AITaskParserDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
      />
    </SearchContext.Provider>
  );
}
