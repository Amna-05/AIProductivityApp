"use client";

import { Task } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Trash2, Edit2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/cn";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const quadrantColors: Record<string, string> = {
  DO_FIRST: "border-l-4 border-destructive",
  SCHEDULE: "border-l-4 border-primary",
  DELEGATE: "border-l-4 border-warning",
  ELIMINATE: "border-l-4 border-muted-foreground",
};

const quadrantBgColors: Record<string, string> = {
  DO_FIRST: "bg-destructive/10",
  SCHEDULE: "bg-primary/10",
  DELEGATE: "bg-warning/10",
  ELIMINATE: "bg-muted-foreground/10",
};

interface KanbanCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onComplete: (id: number) => void;
  onClick: (task: Task) => void;
}

export function KanbanCard({
  task,
  onEdit,
  onDelete,
  onComplete,
  onClick,
}: KanbanCardProps) {
  const [showActions, setShowActions] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const quadrant = task.is_urgent && task.is_important ? "DO_FIRST" :
                   !task.is_urgent && task.is_important ? "SCHEDULE" :
                   task.is_urgent && !task.is_important ? "DELEGATE" :
                   "ELIMINATE";

  const daysUntilDue = task.due_date
    ? Math.ceil(
        (new Date(task.due_date).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const isDueToday = daysUntilDue === 0;
  const isDueOverdue = daysUntilDue && daysUntilDue < 0;
  const isDueSoon = daysUntilDue && daysUntilDue > 0 && daysUntilDue <= 7;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      whileHover={{ y: -2 }}
      className={cn(
        "group bg-gradient-to-br from-card to-card/80 rounded-lg p-3 space-y-2 cursor-move transition-all",
        "hover:shadow-lg hover:border-primary/40 border border-border",
        quadrantColors[quadrant],
        quadrantBgColors[quadrant],
        task.status === "done" && "opacity-60"
      )}
    >
      {/* Header: Checkbox + Title */}
      <div className="flex items-start gap-2">
        <Checkbox
          checked={task.status === "done"}
          onCheckedChange={() => onComplete(task.id)}
          className="mt-0.5"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex-1 min-w-0" onClick={() => onClick(task)}>
          <p
            className={cn(
              "text-sm font-medium text-foreground truncate",
              task.status === "done" && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </p>
        </div>

        {/* Quick Actions */}
        {showActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex gap-1"
          >
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-primary/20"
              onClick={(e) => {
                e.stopPropagation();
                onClick(task);
              }}
            >
              <Eye className="h-3.5 w-3.5 text-primary" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-primary/20"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task);
                  }}
                >
                  <Edit2 className="h-3.5 w-3.5 mr-2" />
                  Edit
                </DropdownMenuItem>
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
          </motion.div>
        )}
      </div>

      {/* Tags & Category */}
      {(task.category || task.tags?.length) && (
        <div className="flex flex-wrap gap-1">
          {task.category && (
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              {task.category.name}
            </Badge>
          )}
          {task.tags?.slice(0, 2).map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="text-xs px-2 py-0.5"
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Due Date */}
      {task.due_date && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          {isDueOverdue && (
            <span className="text-destructive font-medium">Overdue</span>
          )}
          {isDueToday && (
            <span className="text-warning font-medium">Due Today</span>
          )}
          {isDueSoon && !isDueToday && (
            <span className="text-primary font-medium">
              {daysUntilDue} day{daysUntilDue !== 1 ? "s" : ""} left
            </span>
          )}
          {!isDueToday && !isDueOverdue && !isDueSoon && (
            <span>
              {new Date(task.due_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
