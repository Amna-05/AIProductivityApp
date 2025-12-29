"use client";

import { Task, TaskQuadrant } from "@/lib/types";
import { format, parseISO } from "date-fns";
import {
  Calendar,
  Folder,
  Tag,
  Pencil,
  Trash2,
  Clock,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils/cn";

const quadrantConfig: Record<TaskQuadrant, {
  label: string;
  bg: string;
  text: string;
  border: string;
  icon: string;
}> = {
  DO_FIRST: {
    label: "Do First",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    icon: "🔴"
  },
  SCHEDULE: {
    label: "Schedule",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: "🔵"
  },
  DELEGATE: {
    label: "Delegate",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    icon: "🟣"
  },
  ELIMINATE: {
    label: "Later",
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
    icon: "⚪"
  },
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  todo: {
    label: "To Do",
    color: "bg-gray-100 text-gray-700",
    icon: <Clock className="h-3 w-3" />
  },
  in_progress: {
    label: "In Progress",
    color: "bg-amber-100 text-amber-700",
    icon: <AlertCircle className="h-3 w-3" />
  },
  done: {
    label: "Done",
    color: "bg-emerald-100 text-emerald-700",
    icon: <CheckCircle2 className="h-3 w-3" />
  },
};

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
}

export function TaskDetailModal({
  task,
  open,
  onOpenChange,
  onEdit,
  onDelete
}: TaskDetailModalProps) {
  if (!task) return null;

  const quadrant = quadrantConfig[task.quadrant];
  const status = statusConfig[task.status];

  const handleEdit = () => {
    onOpenChange(false);
    onEdit(task);
  };

  const handleDelete = () => {
    onDelete(task.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden bg-white border border-gray-200 shadow-xl">
        {/* Header with quadrant color accent */}
        <div className={cn("px-6 pt-5 pb-4 border-b", quadrant.bg, quadrant.border)}>
          <DialogHeader className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <DialogTitle className="text-xl font-bold text-gray-900 leading-tight pr-2">
                {task.title}
              </DialogTitle>
              <Badge
                className={cn(
                  "shrink-0 font-semibold text-xs px-2.5 py-1",
                  quadrant.bg,
                  quadrant.text,
                  quadrant.border,
                  "border"
                )}
              >
                {quadrant.label}
              </Badge>
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-2">
              <Badge className={cn("font-medium text-xs gap-1", status.color)}>
                {status.icon}
                {status.label}
              </Badge>
              {task.is_overdue && (
                <Badge className="bg-red-100 text-red-700 font-medium text-xs">
                  Overdue
                </Badge>
              )}
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {/* Description */}
          {task.description && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Description
              </p>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          {/* Due Date */}
          {task.due_date && (
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Due Date</p>
                <p className="text-gray-700 font-medium">
                  {format(parseISO(task.due_date), "EEEE, MMMM d, yyyy")}
                </p>
                <p className="text-xs text-gray-500">
                  {format(parseISO(task.due_date), "h:mm a")}
                </p>
              </div>
            </div>
          )}

          {/* Category */}
          {task.category && (
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-50">
                <Folder className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Category</p>
                <p className="text-gray-700 font-medium flex items-center gap-1.5">
                  {task.category.icon && <span>{task.category.icon}</span>}
                  {task.category.name}
                </p>
              </div>
            </div>
          )}

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50">
                  <Tag className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-xs text-gray-400 font-medium">Tags</p>
              </div>
              <div className="flex flex-wrap gap-2 ml-10">
                {task.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="text-xs font-medium px-2.5 py-1"
                    style={{
                      borderColor: tag.color || "#E5E7EB",
                      backgroundColor: tag.color ? `${tag.color}15` : undefined,
                      color: tag.color || "#6B7280"
                    }}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Created {format(parseISO(task.created_at), "MMM d, yyyy")}</span>
              {task.completed_at && (
                <span className="text-emerald-600">
                  Completed {format(parseISO(task.completed_at), "MMM d, yyyy")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Task</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &apos;{task.title}&apos;? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={handleEdit}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Task
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
