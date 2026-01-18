"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, ArrowRight, PartyPopper } from "lucide-react";
import { toast } from "sonner";

import { tasksApi } from "@/lib/api/tasks";
import { Task, TaskQuadrant } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskFormDialog } from "@/components/tasks/TaskFormDialog";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { TaskCard, TaskCardSkeleton } from "@/components/tasks/TaskCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/cn";

// Dark theme quadrant configuration
const quadrantConfig: Record<TaskQuadrant, {
  title: string;
  description: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  dotColor: string;
  headerBg: string;
  countBg: string;
  accentColor: string;
}> = {
  DO_FIRST: {
    title: "Do First",
    description: "Urgent & Important",
    bgColor: "bg-card border-destructive/20",
    borderColor: "border-destructive/30",
    textColor: "text-destructive",
    dotColor: "bg-destructive",
    headerBg: "bg-destructive/10 border-destructive/20",
    countBg: "bg-destructive/20 text-destructive",
    accentColor: "bg-destructive/5",
  },
  SCHEDULE: {
    title: "Schedule",
    description: "Important, not urgent",
    bgColor: "bg-card border-primary/20",
    borderColor: "border-primary/30",
    textColor: "text-primary",
    dotColor: "bg-primary",
    headerBg: "bg-primary/10 border-primary/20",
    countBg: "bg-primary/20 text-primary",
    accentColor: "bg-primary/5",
  },
  DELEGATE: {
    title: "Delegate",
    description: "Urgent, not important",
    bgColor: "bg-card border-warning/20",
    borderColor: "border-warning/30",
    textColor: "text-warning",
    dotColor: "bg-warning",
    headerBg: "bg-warning/10 border-warning/20",
    countBg: "bg-warning/20 text-warning",
    accentColor: "bg-warning/5",
  },
  ELIMINATE: {
    title: "Later",
    description: "Neither urgent nor important",
    bgColor: "bg-card border-muted/20",
    borderColor: "border-muted/30",
    textColor: "text-muted-foreground",
    dotColor: "bg-muted-foreground",
    headerBg: "bg-muted/10 border-muted/20",
    countBg: "bg-muted/20 text-muted-foreground",
    accentColor: "bg-muted/5",
  },
};

export default function PriorityMatrixPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<Task | null>(null);

  // Fetch all non-completed tasks
  const { data, isLoading, error } = useQuery({
    queryKey: ["tasks", "priority-matrix"],
    queryFn: async () => {
      const result = await tasksApi.getAll({ completed: false, limit: 100 });
      return {
        ...result,
        tasks: result.tasks.filter(task => task.status !== "done"),
      };
    },
    staleTime: 60 * 1000, // Cache for 1 minute
    gcTime: 5 * 60 * 1000, // Keep in memory for 5 minutes
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
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      toast.error(axiosError.response?.data?.detail || "Failed to update task");
    },
  });

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: (taskId: number) => tasksApi.delete(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Task deleted");
    },
  });

  // Move task to different quadrant
  const moveTaskMutation = useMutation({
    mutationFn: ({ id, quadrant }: { id: number; quadrant: TaskQuadrant }) => {
      const isUrgent = quadrant === "DO_FIRST" || quadrant === "DELEGATE";
      const isImportant = quadrant === "DO_FIRST" || quadrant === "SCHEDULE";
      return tasksApi.update(id, { is_urgent: isUrgent, is_important: isImportant });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task moved!");
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      toast.error(axiosError.response?.data?.detail || "Failed to move task");
    },
  });

  // Click card -> open detail modal
  const handleTaskClick = (task: Task) => {
    setDetailTask(task);
    setDetailModalOpen(true);
  };

  // Edit from detail modal
  const handleEditFromDetail = (task: Task) => {
    setDetailModalOpen(false);
    setEditingTask(task);
    setDialogOpen(true);
  };

  // Direct edit
  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleDelete = (taskId: number) => {
    deleteMutation.mutate(taskId);
  };

  const handleOpenDialog = (task?: Task) => {
    setEditingTask(task || null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTask(null);
  };

  // Group tasks by quadrant
  const tasksByQuadrant: Record<TaskQuadrant, Task[]> = data?.tasks.reduce(
    (acc, task) => {
      if (!acc[task.quadrant]) {
        acc[task.quadrant] = [];
      }
      acc[task.quadrant].push(task);
      return acc;
    },
    { DO_FIRST: [], SCHEDULE: [], DELEGATE: [], ELIMINATE: [] } as Record<TaskQuadrant, Task[]>
  ) || { DO_FIRST: [], SCHEDULE: [], DELEGATE: [], ELIMINATE: [] };

  const renderQuadrant = (quadrant: TaskQuadrant, index: number) => {
    const config = quadrantConfig[quadrant];
    const tasks = tasksByQuadrant[quadrant] || [];
    const otherQuadrants = (Object.keys(quadrantConfig) as TaskQuadrant[]).filter(q => q !== quadrant);

    return (
      <Card
        className={cn(
          "border flex flex-col overflow-hidden animate-fade-in-up",
          "bg-gradient-to-br from-card to-card/80",
          "hover:shadow-xl hover:border-primary/40 transition-all duration-300",
          config.bgColor,
          config.borderColor,
          "min-h-[400px]"
        )}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <CardHeader className={cn("p-5 pb-4 border-b", config.headerBg)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className={cn("w-4 h-4 rounded-full shadow-lg flex-shrink-0", config.dotColor)} />
              <CardTitle className={cn("text-xl font-black tracking-tight", config.textColor)}>
                {config.title}
              </CardTitle>
            </div>
            <span className={cn("text-sm font-bold px-3 py-1.5 rounded-full shadow-md flex-shrink-0", config.countBg)}>
              {tasks.length}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2.5 font-semibold uppercase tracking-wide">{config.description}</p>
        </CardHeader>

        <CardContent className="p-4 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3">
              <TaskCardSkeleton variant="compact" />
              <TaskCardSkeleton variant="compact" />
            </div>
          ) : tasks.length === 0 ? (
            <div className={cn("flex flex-col items-center justify-center h-full py-12 border-2 border-dashed rounded-lg", config.accentColor)}>
              <p className={cn("text-base font-semibold", config.textColor)}>No tasks here</p>
              <p className="text-xs text-muted-foreground mt-1">Create or move tasks to this quadrant</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task, idx) => (
                <div key={task.id} className="group relative">
                  <TaskCard
                    task={task}
                    variant="compact"
                    onComplete={(id) => completeMutation.mutate(id)}
                    onClick={handleTaskClick}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    animationDelay={idx * 30}
                  />
                  {/* Move to dropdown - appears on hover */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className={cn(
                          "absolute top-2 right-2 h-7 px-2 opacity-0 group-hover:opacity-100",
                          "transition-opacity text-xs shadow-sm",
                          config.textColor
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
                          className="gap-2 cursor-pointer"
                        >
                          <div className={cn("w-2 h-2 rounded-full", quadrantConfig[targetQuadrant].dotColor)} />
                          <span className="font-medium text-sm">{quadrantConfig[targetQuadrant].title}</span>
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
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 min-h-full bg-background">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-foreground tracking-tighter">Priority Matrix</h1>
          <p className="text-base text-muted-foreground font-medium">
            Organize and prioritize tasks by urgency and importance
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          size="sm"
          className="gap-1.5 bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Error State */}
      {error ? (
        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent className="py-12">
            <p className="text-center text-destructive font-medium">
              Failed to load tasks. Please try again.
            </p>
          </CardContent>
        </Card>
      ) : (
        /* 2x2 Matrix Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-6">
          {renderQuadrant("DO_FIRST", 0)}
          {renderQuadrant("DELEGATE", 1)}
          {renderQuadrant("SCHEDULE", 2)}
          {renderQuadrant("ELIMINATE", 3)}
        </div>
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={detailTask}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onEdit={handleEditFromDetail}
        onDelete={handleDelete}
      />

      {/* Task Form Dialog */}
      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        task={editingTask}
      />
    </div>
  );
}
