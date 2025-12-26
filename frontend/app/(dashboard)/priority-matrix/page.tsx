"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Edit, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { tasksApi } from "@/lib/api/tasks";
import { Task, TaskQuadrant, TaskStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskFormDialog } from "@/components/tasks/TaskFormDialog";
import { cn } from "@/lib/utils/cn";

export default function PriorityMatrixPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Fetch all tasks
  const { data, isLoading, error } = useQuery({
    queryKey: ["tasks", { limit: 100 }],
    queryFn: () => tasksApi.getAll({ limit: 100 }),
  });

  // Update task status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) =>
      tasksApi.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task status updated");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to update task");
    },
  });

  const handleOpenDialog = (task?: Task) => {
    if (task) {
      setEditingTask(task);
    } else {
      setEditingTask(null);
    }
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

  const getQuadrantInfo = (quadrant: TaskQuadrant) => {
    switch (quadrant) {
      case "DO_FIRST":
        return {
          title: "Do First",
          description: "Urgent & Important",
          bgColor: "bg-background",
          borderColor: "border-destructive",
          textColor: "text-destructive",
        };
      case "SCHEDULE":
        return {
          title: "Schedule",
          description: "Not Urgent & Important",
          bgColor: "bg-background",
          borderColor: "border-warning",
          textColor: "text-warning",
        };
      case "DELEGATE":
        return {
          title: "Delegate",
          description: "Urgent & Not Important",
          bgColor: "bg-background",
          borderColor: "border-info",
          textColor: "text-info",
        };
      case "ELIMINATE":
        return {
          title: "Eliminate",
          description: "Not Urgent & Not Important",
          bgColor: "bg-background",
          borderColor: "border-border",
          textColor: "text-muted-foreground",
        };
    }
  };

  const renderQuadrant = (quadrant: TaskQuadrant) => {
    const info = getQuadrantInfo(quadrant);
    const tasks = tasksByQuadrant[quadrant] || [];

    return (
      <Card
        className={cn(
          "border-2 max-h-[400px] flex flex-col",
          info.bgColor,
          info.borderColor
        )}
      >
        <CardHeader className="p-6 pb-4">
          <div className="flex items-start justify-between mb-1">
            <CardTitle className={cn("text-lg font-semibold", info.textColor)}>
              {info.title}
            </CardTitle>
            <span className="text-sm font-medium text-muted-foreground">
              {tasks.length}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{info.description}</p>
        </CardHeader>

        <CardContent className="p-4 pt-0 flex-1 overflow-y-auto">
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center h-24">
              <p className="text-sm text-muted-foreground text-center">
                No tasks in this quadrant
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-lg border bg-background p-3 shadow-sm transition-all hover:shadow-md hover:border-primary/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-1 mb-1">
                        {task.title}
                      </h4>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {/* Status */}
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full font-medium",
                            task.status === "done"
                              ? "bg-success/10 text-success"
                              : task.status === "in_progress"
                              ? "bg-info/10 text-info"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {task.status === "in_progress"
                            ? "In Progress"
                            : task.status === "done"
                            ? "Done"
                            : "To Do"}
                        </span>

                        {/* Category */}
                        {task.category && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{
                                backgroundColor: task.category.color || "#3B82F6",
                              }}
                            />
                            {task.category.name}
                          </span>
                        )}

                        {/* Due Date */}
                        {task.due_date && (
                          <span
                            className={cn(
                              "text-muted-foreground",
                              task.is_overdue && "text-destructive font-medium"
                            )}
                          >
                            {task.is_overdue && "⚠️ "}
                            {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleOpenDialog(task)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      {task.status !== "done" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: task.id,
                              status: "done",
                            })
                          }
                        >
                          <CheckCircle2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="px-6 py-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Priority Matrix</h1>
          <p className="text-muted-foreground mt-1">
            Eisenhower Matrix - Organize tasks by urgency and importance
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card className="border-destructive">
          <CardContent className="py-12">
            <p className="text-center text-destructive">
              Failed to load tasks. Please try again.
            </p>
          </CardContent>
        </Card>
      ) : (
        /* 2x2 Matrix Grid - Proportionate Sizing */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto">
          {/* Top Left: DO_FIRST (Urgent + Important) */}
          {renderQuadrant("DO_FIRST")}

          {/* Top Right: SCHEDULE (Not Urgent + Important) */}
          {renderQuadrant("SCHEDULE")}

          {/* Bottom Left: DELEGATE (Urgent + Not Important) */}
          {renderQuadrant("DELEGATE")}

          {/* Bottom Right: ELIMINATE (Not Urgent + Not Important) */}
          {renderQuadrant("ELIMINATE")}
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
