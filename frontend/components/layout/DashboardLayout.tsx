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
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

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
