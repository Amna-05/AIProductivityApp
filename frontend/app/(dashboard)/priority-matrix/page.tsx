"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, ArrowRight, PartyPopper } from "lucide-react";
import { toast } from "sonner";

import { tasksApi } from "@/lib/api/tasks";
import { Task, TaskQuadrant, TaskStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskFormDialog } from "@/components/tasks/TaskFormDialog";
import { TaskCard, TaskCardSkeleton } from "@/components/tasks/TaskCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/cn";

// Quadrant configuration with vibrant colors and better contrast
const quadrantConfig: Record<TaskQuadrant, {
  title: string;
  description: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  dotColor: string;
  headerBg: string;
}> = {
  DO_FIRST: {
    title: "Do First",
    description: "Urgent & Important",
    bgColor: "bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/10",
    borderColor: "border-red-300 dark:border-red-800/60",
    textColor: "text-red-700 dark:text-red-300",
    dotColor: "bg-red-500",
    headerBg: "bg-red-100/80 dark:bg-red-900/30",
  },
  SCHEDULE: {
    title: "Schedule",
    description: "Important, not urgent",
    bgColor: "bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/10",
    borderColor: "border-emerald-300 dark:border-emerald-800/60",
    textColor: "text-emerald-700 dark:text-emerald-300",
    dotColor: "bg-emerald-500",
    headerBg: "bg-emerald-100/80 dark:bg-emerald-900/30",
  },
  DELEGATE: {
    title: "Delegate",
    description: "Urgent, not important",
    bgColor: "bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/10",
    borderColor: "border-blue-300 dark:border-blue-800/60",
    textColor: "text-blue-700 dark:text-blue-300",
    dotColor: "bg-blue-500",
    headerBg: "bg-blue-100/80 dark:bg-blue-900/30",
  },
  ELIMINATE: {
    title: "Later",
    description: "Neither urgent nor important",
    bgColor: "bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/30 dark:to-slate-800/10",
    borderColor: "border-slate-300 dark:border-slate-700/60",
    textColor: "text-slate-600 dark:text-slate-300",
    dotColor: "bg-slate-400",
    headerBg: "bg-slate-100/80 dark:bg-slate-800/30",
  },
};

export default function PriorityMatrixPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Fetch all non-completed tasks (exclude done tasks)
  const { data, isLoading, error } = useQuery({
    queryKey: ["tasks", "priority-matrix"],
    queryFn: async () => {
      const result = await tasksApi.getAll({ completed: false, limit: 100 });
      // Extra filter to ensure no done tasks appear
      return {
        ...result,
        tasks: result.tasks.filter(task => task.status !== "done"),
      };
    },
  });

  // Complete task mutation
  const completeMutation = useMutation({
    mutationFn: (taskId: number) => tasksApi.update(taskId, { status: "done" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Task completed!", {
        icon: <PartyPopper className="h-4 w-4" />,
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to update task");
    },
  });

  // Move task to different quadrant
  const moveTaskMutation = useMutation({
    mutationFn: ({ id, quadrant }: { id: number; quadrant: TaskQuadrant }) => {
      const config = quadrantConfig[quadrant];
      const isUrgent = quadrant === "DO_FIRST" || quadrant === "DELEGATE";
      const isImportant = quadrant === "DO_FIRST" || quadrant === "SCHEDULE";
      return tasksApi.update(id, { is_urgent: isUrgent, is_important: isImportant });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task moved!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to move task");
    },
  });

  const handleOpenDialog = (task?: Task) => {
    setEditingTask(task || null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTask(null);
  };

  // Group tasks by quadrant
  const tasksByQuadrant = data?.tasks.reduce(
    (acc, task) => {
      if (!acc[task.quadrant]) {
        acc[task.quadrant] = [];
      }
      acc[task.quadrant].push(task);
      return acc;
    },
    {} as Record<TaskQuadrant, Task[]>
  ) || {};

  const renderQuadrant = (quadrant: TaskQuadrant, index: number) => {
    const config = quadrantConfig[quadrant];
    const tasks = tasksByQuadrant[quadrant] || [];
    const otherQuadrants = (Object.keys(quadrantConfig) as TaskQuadrant[]).filter(q => q !== quadrant);

    return (
      <Card
        className={cn(
          "border max-h-[420px] flex flex-col animate-fade-in-up",
          config.bgColor,
          config.borderColor
        )}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <CardHeader className={cn("p-4 pb-3 rounded-t-lg", config.headerBg)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={cn("w-3.5 h-3.5 rounded-full shadow-sm", config.dotColor)} />
              <CardTitle className={cn("text-base font-bold", config.textColor)}>
                {config.title}
              </CardTitle>
            </div>
            <span className={cn("text-sm font-bold px-2.5 py-1 rounded-full", config.textColor, "bg-white/60 dark:bg-black/30")}>
              {tasks.length}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 font-medium">{config.description}</p>
        </CardHeader>

        <CardContent className="p-3 pt-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2">
              <TaskCardSkeleton variant="compact" />
              <TaskCardSkeleton variant="compact" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex items-center justify-center h-20">
              <p className="text-sm text-muted-foreground text-center">
                No tasks here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task, idx) => (
                <div key={task.id} className="group relative">
                  <TaskCard
                    task={task}
                    variant="compact"
                    onComplete={(id) => completeMutation.mutate(id)}
                    onClick={() => handleOpenDialog(task)}
                    animationDelay={idx * 30}
                  />
                  {/* Move to dropdown - appears on hover */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="secondary"
                        className={cn(
                          "absolute top-2 right-2 h-7 px-2 opacity-0 group-hover:opacity-100",
                          "transition-opacity text-xs"
                        )}
                      >
                        <ArrowRight className="h-3 w-3 mr-1" />
                        Move
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {otherQuadrants.map((targetQuadrant) => (
                        <DropdownMenuItem
                          key={targetQuadrant}
                          onClick={() => moveTaskMutation.mutate({ id: task.id, quadrant: targetQuadrant })}
                          className="gap-2"
                        >
                          <div className={cn("w-2 h-2 rounded-full", quadrantConfig[targetQuadrant].dotColor)} />
                          {quadrantConfig[targetQuadrant].title}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Priority Matrix</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organize by urgency and importance
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Matrix Labels */}
      <div className="hidden md:grid grid-cols-[auto,1fr,1fr] gap-4 text-center">
        <div /> {/* Empty corner */}
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Important</p>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Not Important</p>
      </div>

      {/* Error State */}
      {error ? (
        <Card className="border-destructive">
          <CardContent className="py-12">
            <p className="text-center text-destructive">
              Failed to load tasks. Please try again.
            </p>
          </CardContent>
        </Card>
      ) : (
        /* 2x2 Matrix Grid */
        <div className="grid md:grid-cols-[auto,1fr,1fr] gap-4">
          {/* Row labels */}
          <div className="hidden md:flex flex-col justify-around py-8">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide -rotate-90 origin-center whitespace-nowrap">
              Urgent
            </p>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide -rotate-90 origin-center whitespace-nowrap">
              Not Urgent
            </p>
          </div>

          {/* Quadrant Grid */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderQuadrant("DO_FIRST", 0)}
            {renderQuadrant("DELEGATE", 1)}
            {renderQuadrant("SCHEDULE", 2)}
            {renderQuadrant("ELIMINATE", 3)}
          </div>
        </div>
      )}

      {/* Task Form Dialog */}
      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        task={editingTask}
      />
    </div>
  );
}
