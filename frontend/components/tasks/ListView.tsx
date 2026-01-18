"use client";

import { Task, TaskStatus } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, Trash2, Edit2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/cn";

const statusConfig: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  todo: { label: "To Do", color: "text-muted-foreground", bg: "bg-muted-foreground/10" },
  in_progress: { label: "In Progress", color: "text-warning", bg: "bg-warning/10" },
  done: { label: "Done", color: "text-success", bg: "bg-success/10" },
};

const quadrantConfig: Record<string, string> = {
  DO_FIRST: "bg-destructive/10 border-l-4 border-destructive",
  SCHEDULE: "bg-primary/10 border-l-4 border-primary",
  DELEGATE: "bg-warning/10 border-l-4 border-warning",
  ELIMINATE: "bg-muted-foreground/10 border-l-4 border-muted-foreground",
};

interface ListViewProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onComplete: (id: number) => void;
  onClick: (task: Task) => void;
}

export function ListView({ tasks, onEdit, onDelete, onComplete, onClick }: ListViewProps) {
  const [sortBy, setSortBy] = useState<"created" | "due" | "priority">("created");
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());

  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortBy === "due") {
      const aDate = a.due_date ? new Date(a.due_date).getTime() : Infinity;
      const bDate = b.due_date ? new Date(b.due_date).getTime() : Infinity;
      return aDate - bDate;
    }
    if (sortBy === "priority") {
      const getScore = (t: Task) => {
        if (t.is_urgent && t.is_important) return 1;
        if (!t.is_urgent && t.is_important) return 2;
        if (t.is_urgent && !t.is_important) return 3;
        return 4;
      };
      return getScore(a) - getScore(b);
    }
    return 0; // created (default)
  });

  const toggleSelect = (taskId: number) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(tasks.map((t) => t.id)));
    }
  };

  const daysUntilDue = (task: Task) => {
    if (!task.due_date) return null;
    return Math.ceil(
      (new Date(task.due_date).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );
  };

  const quadrant = (task: Task) => {
    if (task.is_urgent && task.is_important) return "DO_FIRST";
    if (!task.is_urgent && task.is_important) return "SCHEDULE";
    if (task.is_urgent && !task.is_important) return "DELEGATE";
    return "ELIMINATE";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedTasks.size === tasks.length && tasks.length > 0}
              onCheckedChange={toggleSelectAll}
              className="ml-2"
            />
            {selectedTasks.size > 0 && (
              <span className="text-xs text-muted-foreground font-medium">
                {selectedTasks.size} selected
              </span>
            )}
          </div>
        </div>

        {/* Sort Dropdown */}
        <div className="flex gap-2">
          {(["created", "due", "priority"] as const).map((sort) => (
            <button
              key={sort}
              onClick={() => setSortBy(sort)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                sortBy === sort
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-white hover:bg-secondary/50"
              )}
            >
              {sort === "created" && "Recent"}
              {sort === "due" && "Due Date"}
              {sort === "priority" && "Priority"}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks Table */}
      <div className="space-y-2">
        {sortedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No tasks</p>
          </div>
        ) : (
          <motion.div
            className="space-y-2"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.05 },
              },
            }}
            initial="hidden"
            animate="show"
          >
            {sortedTasks.map((task) => {
              const days = daysUntilDue(task);
              const quad = quadrant(task);
              const isSelected = selectedTasks.has(task.id);

              return (
                <motion.div
                  key={task.id}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 },
                  }}
                  whileHover={{ y: -2 }}
                  onClick={() => onClick(task)}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-lg border transition-all cursor-pointer group",
                    "hover:shadow-md hover:border-primary/40",
                    isSelected ? "bg-primary/10 border-primary/40" : "bg-secondary border-border",
                    quadrantConfig[quad],
                    task.status === "done" && "opacity-60"
                  )}
                >
                  {/* Checkbox */}
                  <Checkbox
                    checked={isSelected || task.status === "done"}
                    onCheckedChange={() => {
                      if (task.status !== "done") {
                        if (isSelected) {
                          toggleSelect(task.id);
                        } else {
                          onComplete(task.id);
                        }
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="h-5 w-5"
                  />

                  {/* Title */}
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      "font-medium text-sm text-white truncate",
                      task.status === "done" && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {task.description}
                      </p>
                    )}
                  </div>

                  {/* Status Badge */}
                  <Badge variant="secondary" className={cn("text-xs", statusConfig[task.status].color)}>
                    {statusConfig[task.status].label}
                  </Badge>

                  {/* Category */}
                  {task.category && (
                    <Badge variant="outline" className="text-xs">
                      {task.category.name}
                    </Badge>
                  )}

                  {/* Tags */}
                  <div className="hidden lg:flex gap-1">
                    {task.tags?.slice(0, 2).map((tag) => (
                      <Badge key={tag.id} variant="secondary" className="text-xs">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>

                  {/* Due Date */}
                  {task.due_date && (
                    <div className="text-xs whitespace-nowrap">
                      {days === 0 && (
                        <span className="text-warning font-medium">Today</span>
                      )}
                      {days && days > 0 && days <= 7 && (
                        <span className="text-primary font-medium">{days}d left</span>
                      )}
                      {days && days < 0 && (
                        <span className="text-destructive font-medium">Overdue</span>
                      )}
                      {days && days > 7 && (
                        <span className="text-muted-foreground">
                          {new Date(task.due_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(task);
                      }}
                    >
                      <Edit2 className="h-4 w-4 text-primary" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(task.id);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
