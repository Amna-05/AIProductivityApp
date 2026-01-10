"use client";

import { Menu, Search, Plus, ArrowUp, Sparkles } from "lucide-react";
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
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm supports-[backdrop-filter]:bg-card/60">
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
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-white">
            <ArrowUp className="h-4 w-4" />
          </div>
          <span className="font-bold text-foreground">ELEVATE</span>
        </div>

        {/* Search Bar (center) - with keyboard hint */}
        <div className="hidden md:flex flex-1 max-w-md mx-auto">
          <div className="relative w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              type="text"
              placeholder="Search tasks... ⌘K"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-9 pr-4 h-9 bg-secondary border-border hover:border-primary/40 focus-visible:border-primary"
            />
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
            title="Parse task with AI"
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
            title="New task (⌘N)"
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
            title="New task"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
