"use client";

import * as React from "react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { Check, Clock, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Task, TaskQuadrant } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Quadrant styling - vibrant colors for light theme
const quadrantConfig: Record<TaskQuadrant, {
  color: string;
  bg: string;
  border: string;
  dot: string;
  label: string;
}> = {
  DO_FIRST: {
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-l-red-500",
    dot: "bg-red-500",
    label: "Do First"
  },
  SCHEDULE: {
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-l-blue-500",
    dot: "bg-blue-500",
    label: "Schedule"
  },
  DELEGATE: {
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-l-purple-500",
    dot: "bg-purple-500",
    label: "Delegate"
  },
  ELIMINATE: {
    color: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-l-gray-400",
    dot: "bg-gray-400",
    label: "Later"
  },
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
          "bg-white hover:bg-gray-50 border border-gray-200",
          "border-l-4",
          quadrant.border,
          "shadow-sm hover:shadow-md hover:-translate-y-0.5",
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
              ? "bg-emerald-500 border-emerald-500"
              : "border-gray-300 hover:border-emerald-500 group-hover:border-emerald-400"
          )}
        >
          {isCompleted && <Check className="w-3 h-3 text-white animate-checkmark" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-semibold truncate text-gray-900",
            isCompleted && "line-through text-gray-400"
          )}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {dueInfo.text && (
              <span className={cn(
                "text-xs",
                dueInfo.isOverdue ? "text-red-600 font-medium" : "text-gray-500"
              )}>
                {dueInfo.text}
              </span>
            )}
            {task.category && (
              <span className="text-xs text-gray-500">
                {task.category.icon && <span className="mr-0.5">{task.category.icon}</span>}
                {task.category.name}
              </span>
            )}
          </div>
        </div>

        {/* Hover actions */}
        <div className={cn(
          "flex items-center gap-1 opacity-0 group-hover:opacity-100",
          "transition-opacity duration-150"
        )}>
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Task</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{task.title}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(task.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Priority dot - only show when no hover actions */}
        <div className={cn(
          "w-2 h-2 rounded-full shrink-0 group-hover:hidden",
          quadrant.dot
        )} />
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
          "bg-white hover:bg-gray-50 border border-gray-200",
          "border-l-4",
          quadrant.border,
          "shadow-sm hover:shadow-md hover:-translate-y-0.5",
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
            "shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center",
            "transition-all duration-150",
            isCompleted
              ? "bg-emerald-500 border-emerald-500"
              : "border-gray-300 hover:border-emerald-500"
          )}
        >
          {isCompleted && <Check className="w-3 h-3 text-white animate-checkmark" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-semibold truncate text-gray-900",
            isCompleted && "line-through text-gray-400"
          )}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {dueInfo.text && (
              <span className={cn(
                "text-xs flex items-center gap-1",
                dueInfo.isOverdue ? "text-red-600 font-medium" : "text-gray-500"
              )}>
                <Clock className="w-3 h-3" />
                {dueInfo.text}
              </span>
            )}
            {task.category && (
              <span className="text-xs text-gray-500">
                {task.category.icon && <span className="mr-0.5">{task.category.icon}</span>}
                {task.category.name}
              </span>
            )}
          </div>
        </div>

        {/* Hover actions */}
        <div className={cn(
          "flex items-center gap-1 opacity-0 group-hover:opacity-100",
          "transition-opacity duration-150"
        )}>
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Task</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{task.title}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(task.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Quadrant badge - only show when no hover */}
        <Badge
          variant="outline"
          className={cn(
            "text-xs font-medium shrink-0 group-hover:hidden",
            quadrant.color,
            quadrant.bg,
            "border-0"
          )}
        >
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
        "bg-white hover:shadow-lg border border-gray-200",
        "border-l-4",
        quadrant.border,
        "shadow-sm hover:-translate-y-0.5",
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
          "shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
          "transition-all duration-150",
          isCompleted
            ? "bg-emerald-500 border-emerald-500"
            : "border-gray-300 hover:border-emerald-500"
        )}
      >
        {isCompleted && <Check className="w-3 h-3 text-white animate-checkmark" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            "text-sm font-semibold text-gray-900",
            isCompleted && "line-through text-gray-400"
          )}>
            {task.title}
          </p>

          {/* Priority indicator - hide on hover */}
          <div className={cn(
            "w-2.5 h-2.5 rounded-full shrink-0 mt-1 group-hover:hidden",
            quadrant.dot
          )} />
        </div>

        {/* Meta info row */}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {dueInfo.text && (
            <span className={cn(
              "text-xs flex items-center gap-1",
              dueInfo.isOverdue ? "text-red-600 font-medium" : "text-gray-500"
            )}>
              <Clock className="w-3 h-3" />
              {dueInfo.text}
            </span>
          )}

          {task.category && (
            <span className="text-xs text-gray-500">
              {task.category.icon && <span className="mr-0.5">{task.category.icon}</span>}
              {task.category.name}
            </span>
          )}

          {task.tags.length > 0 && (
            <div className="flex items-center gap-1">
              {task.tags.slice(0, 2).map(tag => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="text-xs px-1.5 py-0 font-medium"
                  style={{
                    borderColor: tag.color || "#E5E7EB",
                    backgroundColor: tag.color ? `${tag.color}15` : undefined,
                    color: tag.color || "#6B7280"
                  }}
                >
                  {tag.name}
                </Badge>
              ))}
              {task.tags.length > 2 && (
                <span className="text-xs text-gray-400">+{task.tags.length - 2}</span>
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
            className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}

        {onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Task</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{task.title}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(task.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
