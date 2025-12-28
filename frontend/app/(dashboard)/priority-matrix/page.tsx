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

// Vibrant quadrant configuration - light theme only
const quadrantConfig: Record<TaskQuadrant, {
  title: string;
  description: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  dotColor: string;
  headerBg: string;
  countBg: string;
}> = {
  DO_FIRST: {
    title: "Do First",
    description: "Urgent & Important",
    bgColor: "bg-gradient-to-br from-red-50 to-rose-100/50",
    borderColor: "border-red-200",
    textColor: "text-red-700",
    dotColor: "bg-red-500",
    headerBg: "bg-red-100",
    countBg: "bg-red-500 text-white",
  },
  SCHEDULE: {
    title: "Schedule",
    description: "Important, not urgent",
    bgColor: "bg-gradient-to-br from-blue-50 to-blue-100/50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
    dotColor: "bg-blue-500",
    headerBg: "bg-blue-100",
    countBg: "bg-blue-500 text-white",
  },
  DELEGATE: {
    title: "Delegate",
    description: "Urgent, not important",
    bgColor: "bg-gradient-to-br from-purple-50 to-purple-100/50",
    borderColor: "border-purple-200",
    textColor: "text-purple-700",
    dotColor: "bg-purple-500",
    headerBg: "bg-purple-100",
    countBg: "bg-purple-500 text-white",
  },
  ELIMINATE: {
    title: "Later",
    description: "Neither urgent nor important",
    bgColor: "bg-gradient-to-br from-gray-50 to-gray-100/50",
    borderColor: "border-gray-200",
    textColor: "text-gray-600",
    dotColor: "bg-gray-400",
    headerBg: "bg-gray-100",
    countBg: "bg-gray-400 text-white",
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
    onError: (error: string | any) => {
      toast.error(error.response?.data?.detail || "Failed to update task");
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
    onError: (error: string | any) => {
      toast.error(error.response?.data?.detail || "Failed to move task");
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
          "border-2 max-h-[450px] flex flex-col animate-fade-in-up overflow-hidden",
          config.bgColor,
          config.borderColor
        )}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <CardHeader className={cn("p-4 pb-3 border-b", config.headerBg, config.borderColor)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={cn("w-3.5 h-3.5 rounded-full shadow-sm", config.dotColor)} />
              <CardTitle className={cn("text-lg font-bold", config.textColor)}>
                {config.title}
              </CardTitle>
            </div>
            <span className={cn("text-sm font-bold px-2.5 py-1 rounded-full shadow-sm", config.countBg)}>
              {tasks.length}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1.5 font-medium">{config.description}</p>
        </CardHeader>

        <CardContent className="p-3 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2">
              <TaskCardSkeleton variant="compact" />
              <TaskCardSkeleton variant="compact" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-sm text-gray-400 font-medium">No tasks here</p>
            </div>
          ) : (
            <div className="space-y-2">
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
                        variant="secondary"
                        className={cn(
                          "absolute top-2 right-2 h-7 px-2 opacity-0 group-hover:opacity-100",
                          "transition-opacity text-xs bg-white shadow-sm hover:bg-gray-50"
                        )}
                      >
                        <ArrowRight className="h-3 w-3 mr-1" />
                        Move
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white">
                      {otherQuadrants.map((targetQuadrant) => (
                        <DropdownMenuItem
                          key={targetQuadrant}
                          onClick={() => moveTaskMutation.mutate({ id: task.id, quadrant: targetQuadrant })}
                          className="gap-2 cursor-pointer"
                        >
                          <div className={cn("w-2.5 h-2.5 rounded-full", quadrantConfig[targetQuadrant].dotColor)} />
                          <span className="font-medium">{quadrantConfig[targetQuadrant].title}</span>
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
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Priority Matrix</h1>
          <p className="text-sm text-gray-500 font-medium mt-0.5">
            Organize by urgency and importance
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          size="sm"
          className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Error State */}
      {error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-12">
            <p className="text-center text-red-600 font-medium">
              Failed to load tasks. Please try again.
            </p>
          </CardContent>
        </Card>
      ) : (
        /* 2x2 Matrix Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
