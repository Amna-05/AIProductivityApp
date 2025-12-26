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
          color: "bg-red-50 dark:bg-red-950/20",
          borderColor: "border-red-200 dark:border-red-900",
          textColor: "text-red-900 dark:text-red-100",
          badgeColor: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
        };
      case "SCHEDULE":
        return {
          title: "Schedule",
          description: "Not Urgent & Important",
          color: "bg-yellow-50 dark:bg-yellow-950/20",
          borderColor: "border-yellow-200 dark:border-yellow-900",
          textColor: "text-yellow-900 dark:text-yellow-100",
          badgeColor: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
        };
      case "DELEGATE":
        return {
          title: "Delegate",
          description: "Urgent & Not Important",
          color: "bg-orange-50 dark:bg-orange-950/20",
          borderColor: "border-orange-200 dark:border-orange-900",
          textColor: "text-orange-900 dark:text-orange-100",
          badgeColor: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
        };
      case "ELIMINATE":
        return {
          title: "Eliminate",
          description: "Not Urgent & Not Important",
          color: "bg-gray-50 dark:bg-gray-950/20",
          borderColor: "border-gray-200 dark:border-gray-900",
          textColor: "text-gray-900 dark:text-gray-100",
          badgeColor: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
        };
    }
  };

  const renderQuadrant = (quadrant: TaskQuadrant) => {
    const info = getQuadrantInfo(quadrant);
    const tasks = tasksByQuadrant[quadrant] || [];

    return (
      <Card className={`${info.color} ${info.borderColor} border-2`}>
        <CardHeader className="pb-3">
          <CardTitle className={`text-lg ${info.textColor}`}>
            {info.title}
          </CardTitle>
          <p className="text-xs text-muted-foreground">{info.description}</p>
          <div className="text-sm font-medium">
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {tasks.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">
              No tasks in this quadrant
            </p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="rounded-lg border bg-background p-3 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">
                        {task.title}
                      </h4>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          task.status === "done"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                            : task.status === "in_progress"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                        }`}
                      >
                        {task.status === "in_progress"
                          ? "In Progress"
                          : task.status === "done"
                          ? "Done"
                          : "To Do"}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {task.category && (
                        <span className="flex items-center gap-1">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{
                              backgroundColor: task.category.color || "#3B82F6",
                            }}
                          />
                          {task.category.name}
                        </span>
                      )}
                      {task.due_date && (
                        <span className={task.is_overdue ? "text-red-600 font-medium" : ""}>
                          {task.is_overdue && "⚠️ "}
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => handleOpenDialog(task)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    {task.status !== "done" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
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
            ))
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Priority Matrix</h1>
          <p className="text-muted-foreground">
            Eisenhower Matrix - Organize tasks by urgency and importance
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Matrix Info */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-medium text-red-700 dark:text-red-400 mb-1">Do First</div>
            <p className="text-xs text-muted-foreground">
              Critical tasks that need immediate attention
            </p>
          </div>
          <div>
            <div className="font-medium text-yellow-700 dark:text-yellow-400 mb-1">Schedule</div>
            <p className="text-xs text-muted-foreground">
              Important but can be planned for later
            </p>
          </div>
          <div>
            <div className="font-medium text-orange-700 dark:text-orange-400 mb-1">Delegate</div>
            <p className="text-xs text-muted-foreground">
              Urgent but could be handled by others
            </p>
          </div>
          <div>
            <div className="font-medium text-gray-700 dark:text-gray-400 mb-1">Eliminate</div>
            <p className="text-xs text-muted-foreground">
              Low priority, consider removing
            </p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Failed to load tasks. Please try again.
          </p>
        </div>
      ) : (
        /* 2x2 Matrix Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
