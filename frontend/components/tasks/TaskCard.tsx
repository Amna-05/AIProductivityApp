"use client";

import * as React from "react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { Check, Clock, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Task, TaskQuadrant } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

// Quadrant styling
const quadrantConfig: Record<TaskQuadrant, { color: string; bg: string; label: string }> = {
  DO_FIRST: { color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30", label: "Do First" },
  SCHEDULE: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30", label: "Schedule" },
  DELEGATE: { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30", label: "Delegate" },
  ELIMINATE: { color: "text-gray-500 dark:text-gray-400", bg: "bg-gray-50 dark:bg-gray-800/30", label: "Eliminate" },
};

// Format due date relative to now
function formatDueDate(dueDate: string | null): { text: string; isOverdue: boolean; isUrgent: boolean } {
  if (!dueDate) return { text: "", isOverdue: false, isUrgent: false };

  const date = new Date(dueDate);
  const now = new Date();

  if (isPast(date) && !isToday(date)) {
    return { text: `Overdue`, isOverdue: true, isUrgent: true };
  }

  if (isToday(date)) {
    return { text: `Today at ${format(date, "h:mm a")}`, isOverdue: false, isUrgent: true };
  }

  if (isTomorrow(date)) {
    return { text: `Tomorrow at ${format(date, "h:mm a")}`, isOverdue: false, isUrgent: false };
  }

  // Within next 7 days
  const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil <= 7) {
    return { text: format(date, "EEEE 'at' h:mm a"), isOverdue: false, isUrgent: false };
  }

  return { text: format(date, "MMM d 'at' h:mm a"), isOverdue: false, isUrgent: false };
}

export type TaskCardVariant = "minimal" | "compact" | "detailed";

interface TaskCardProps {
  task: Task;
  variant?: TaskCardVariant;
  onComplete?: (taskId: number) => void;
  onClick?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: number) => void;
  className?: string;
  animationDelay?: number;
}

export function TaskCard({
  task,
  variant = "compact",
  onComplete,
  onClick,
  onEdit,
  onDelete,
  className,
  animationDelay = 0,
}: TaskCardProps) {
  const [isCompleting, setIsCompleting] = React.useState(false);
  const isCompleted = task.status === "done";
  const quadrant = quadrantConfig[task.quadrant];
  const dueInfo = formatDueDate(task.due_date);

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onComplete || isCompleting) return;

    setIsCompleting(true);
    // Add completion animation delay
    await new Promise(resolve => setTimeout(resolve, 200));
    onComplete(task.id);
  };

  const handleClick = () => {
    if (onClick && !isCompleting) {
      onClick(task);
    }
  };

  // Minimal variant - Dashboard focus section
  if (variant === "minimal") {
    return (
      <div
        onClick={handleClick}
        style={{ animationDelay: `${animationDelay}ms` }}
        className={cn(
          "group flex items-center gap-3 p-3 rounded-lg cursor-pointer",
          "bg-card hover:bg-accent/50 border border-transparent hover:border-border",
          "transition-all duration-150 ease-out animate-fade-in",
          isCompleted && "opacity-50",
          isCompleting && "scale-95 opacity-60",
          className
        )}
      >
        {/* Checkbox */}
        <button
          onClick={handleComplete}
          className={cn(
            "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center",
            "transition-all duration-150",
            isCompleted
              ? "bg-primary border-primary"
              : "border-muted-foreground/40 hover:border-primary group-hover:border-primary/60"
          )}
        >
          {isCompleted && <Check className="w-3 h-3 text-primary-foreground animate-checkmark" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-medium truncate text-foreground",
            isCompleted && "line-through text-muted-foreground"
          )}>
            {task.title}
          </p>
          {dueInfo.text && (
            <p className={cn(
              "text-xs mt-0.5",
              dueInfo.isOverdue ? "text-destructive font-medium" : "text-muted-foreground"
            )}>
              {dueInfo.text}
            </p>
          )}
        </div>

        {/* Priority dot */}
        <div className={cn("w-2 h-2 rounded-full flex-shrink-0", quadrant.bg, quadrant.color.replace("text-", "bg-"))} />
      </div>
    );
  }

  // Compact variant - Priority Matrix
  if (variant === "compact") {
    return (
      <div
        onClick={handleClick}
        style={{ animationDelay: `${animationDelay}ms` }}
        className={cn(
          "group flex items-center gap-3 p-3 rounded-lg cursor-pointer",
          "bg-card hover:bg-accent/30 border",
          "transition-all duration-150 ease-out animate-fade-in",
          isCompleted && "opacity-50",
          isCompleting && "scale-95 opacity-60",
          className
        )}
      >
        {/* Checkbox */}
        <button
          onClick={handleComplete}
          className={cn(
            "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center",
            "transition-all duration-150",
            isCompleted
              ? "bg-primary border-primary"
              : "border-muted-foreground/40 hover:border-primary"
          )}
        >
          {isCompleted && <Check className="w-3 h-3 text-primary-foreground animate-checkmark" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-medium truncate text-foreground",
            isCompleted && "line-through text-muted-foreground"
          )}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {dueInfo.text && (
              <span className={cn(
                "text-xs flex items-center gap-1",
                dueInfo.isOverdue ? "text-destructive" : "text-muted-foreground"
              )}>
                <Clock className="w-3 h-3" />
                {dueInfo.text}
              </span>
            )}
          </div>
        </div>

        {/* Quadrant badge */}
        <Badge variant="outline" className={cn("text-xs", quadrant.color, quadrant.bg, "border-0")}>
          {quadrant.label}
        </Badge>
      </div>
    );
  }

  // Detailed variant - All Tasks page
  return (
    <div
      onClick={handleClick}
      style={{ animationDelay: `${animationDelay}ms` }}
      className={cn(
        "group flex items-start gap-4 p-4 rounded-xl cursor-pointer",
        "bg-card hover:shadow-md border",
        "transition-all duration-150 ease-out animate-fade-in",
        isCompleted && "opacity-60",
        isCompleting && "scale-[0.98] opacity-60",
        className
      )}
    >
      {/* Checkbox */}
      <button
        onClick={handleComplete}
        className={cn(
          "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
          "transition-all duration-150",
          isCompleted
            ? "bg-primary border-primary"
            : "border-muted-foreground/40 hover:border-primary"
        )}
      >
        {isCompleted && <Check className="w-3 h-3 text-primary-foreground animate-checkmark" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            "text-sm font-medium text-foreground",
            isCompleted && "line-through text-muted-foreground"
          )}>
            {task.title}
          </p>

          {/* Priority indicator */}
          <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1",
            task.quadrant === "DO_FIRST" && "bg-red-500",
            task.quadrant === "SCHEDULE" && "bg-amber-500",
            task.quadrant === "DELEGATE" && "bg-blue-500",
            task.quadrant === "ELIMINATE" && "bg-gray-400"
          )} />
        </div>

        {/* Meta info row */}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {dueInfo.text && (
            <span className={cn(
              "text-xs flex items-center gap-1",
              dueInfo.isOverdue ? "text-destructive font-medium" : "text-muted-foreground"
            )}>
              <Clock className="w-3 h-3" />
              {dueInfo.text}
            </span>
          )}

          {task.category && (
            <span className="text-xs text-muted-foreground">
              {task.category.icon} {task.category.name}
            </span>
          )}

          {task.tags.length > 0 && (
            <div className="flex items-center gap-1">
              {task.tags.slice(0, 2).map(tag => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="text-xs px-1.5 py-0"
                  style={{ borderColor: tag.color || undefined }}
                >
                  {tag.name}
                </Badge>
              ))}
              {task.tags.length > 2 && (
                <span className="text-xs text-muted-foreground">+{task.tags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions - visible on hover */}
      <div className={cn(
        "flex items-center gap-1 opacity-0 group-hover:opacity-100",
        "transition-opacity duration-150"
      )}>
        {onEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}

        {onDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

// Loading skeleton for TaskCard
export function TaskCardSkeleton({ variant = "compact" }: { variant?: TaskCardVariant }) {
  return (
    <div className={cn(
      "animate-pulse rounded-lg border bg-card p-4",
      variant === "minimal" && "p-3",
      variant === "detailed" && "p-4"
    )}>
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
        <div className="w-2 h-2 rounded-full bg-muted" />
      </div>
    </div>
  );
}
