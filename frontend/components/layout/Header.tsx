"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Menu, Search, Plus, ArrowUp, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  onMenuClick?: () => void;
  onAddTask?: () => void;
  onAIParser?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function Header({ onMenuClick, onAddTask, onAIParser, searchQuery = "", onSearchChange }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onMenuClick}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 md:px-6 gap-4">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-9 w-9"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* ELEVATE Logo (mobile only) */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-600 text-white">
            <ArrowUp className="h-4 w-4" />
          </div>
          <span className="font-bold text-foreground">ELEVATE</span>
        </div>

        {/* Search Bar (center) - with keyboard hint */}
        <div className="hidden md:flex flex-1 max-w-md mx-auto">
          <div className="relative w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-9 pr-16 h-9 bg-muted/50 border-transparent focus:bg-background focus:border-input"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 group-focus-within:opacity-0 transition-opacity">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="ml-auto flex items-center gap-2">
          {/* AI Parser Button - Desktop */}
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex gap-1.5 h-9 px-3"
            onClick={onAIParser}
          >
            <Sparkles className="h-4 w-4" />
            <span>AI</span>
          </Button>

          {/* Add Task Button - Desktop */}
          <Button
            variant="default"
            size="sm"
            className="hidden md:flex gap-1.5 h-9 px-3"
            onClick={onAddTask}
          >
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </Button>

          {/* Mobile: Add Button */}
          <Button
            variant="default"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={onAddTask}
          >
            <Plus className="h-5 w-5" />
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
