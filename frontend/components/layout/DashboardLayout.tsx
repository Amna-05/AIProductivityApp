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
import { Loader2, Sparkles, ArrowUp, Rocket, Mic, Zap, ChevronRight, Star } from "lucide-react";
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
        } catch (error: string | any) {
          console.error("Auth check failed:", error);
          const status = error?.response?.status;

          // Only redirect on true 401 auth error
          if (status === 401) {
            router.push("/login");
          }
          // For server/network errors - just stop loading, user can refresh page
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

      {/* Floating AI Button with Pulse Effect */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Pulse ring for attention */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 animate-ping opacity-30" />
        <Button
          variant="default"
          size="icon"
          className={cn(
            "relative h-14 w-14 rounded-full shadow-xl",
            "bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700",
            "transition-all duration-200 hover:scale-110 hover:shadow-2xl hover:shadow-violet-500/40",
            "animate-fade-in"
          )}
          onClick={() => setAiDialogOpen(true)}
        >
          <Sparkles className="h-6 w-6 text-white" />
          <span className="sr-only">AI Task Parser</span>
        </Button>
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 opacity-0 hover:opacity-100 pointer-events-none transition-opacity">
          <div className="bg-gray-900 text-white text-xs font-medium px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
            AI Voice Parser
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      </div>

      {/* Welcome Modal for New Users */}
      {showWelcome && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-lg w-full animate-scale-in bg-white shadow-2xl border-0 overflow-hidden">
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTItNCAwLTQgMi0yIDQtMiA0IDIgMiA0IDIgNC0yIDQtMiAwLTQgMC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
              <div className="relative">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur mx-auto mb-4">
                  <ArrowUp className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Welcome to ELEVATE!
                </h2>
                <p className="text-white/80 text-sm">
                  Your AI-powered productivity workspace
                </p>
              </div>
            </div>

            <CardContent className="p-6">
              {/* Pro Feature Highlight */}
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-4 mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    <Star className="h-3 w-3" />
                    PRO FEATURE
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-violet-600" />
                  AI Task Parser with Voice
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Just speak or type naturally! Say things like:
                </p>
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm bg-white rounded-lg px-3 py-2 border border-violet-100">
                    <Mic className="h-4 w-4 text-violet-500" />
                    <span className="text-gray-700">&apos;Meeting with team tomorrow at 3pm&apos;</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm bg-white rounded-lg px-3 py-2 border border-violet-100">
                    <Mic className="h-4 w-4 text-violet-500" />
                    <span className="text-gray-700">&apos;Urgent: Submit report by Friday&apos;</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  AI extracts title, date, priority & category automatically!
                </p>
              </div>

              {/* Quick Features */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="text-center p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <Zap className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
                  <p className="text-xs font-medium text-gray-700">Smart Priority</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <Rocket className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                  <p className="text-xs font-medium text-gray-700">Analytics</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <Star className="h-6 w-6 text-amber-600 mx-auto mb-1" />
                  <p className="text-xs font-medium text-gray-700">Streaks</p>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <Button
                  className="w-full h-12 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 font-semibold text-base gap-2 shadow-lg shadow-violet-500/30"
                  onClick={() => {
                    localStorage.setItem("elevate_welcomed", "true");
                    setShowWelcome(false);
                    setAiDialogOpen(true);
                  }}
                >
                  <Mic className="h-5 w-5" />
                  Try AI Voice Parser
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-10 font-medium"
                  onClick={() => {
                    localStorage.setItem("elevate_welcomed", "true");
                    setShowWelcome(false);
                  }}
                >
                  Skip for now
                </Button>
              </div>
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
