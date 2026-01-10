"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, PartyPopper, Grid3x3, List, Calendar, Maximize2 } from "lucide-react";
import { toast } from "sonner";

import { tasksApi, TaskFilters } from "@/lib/api/tasks";
import { categoriesApi } from "@/lib/api/categories";
import { Task, TaskStatus, TaskQuadrant } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskFormDialog } from "@/components/tasks/TaskFormDialog";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { TaskCardSkeleton } from "@/components/tasks/TaskCard";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { ListView } from "@/components/tasks/ListView";
import { TimelineView } from "@/components/tasks/TimelineView";
import { QuadrantMatrix } from "@/components/tasks/QuadrantMatrix";
import { cn } from "@/lib/utils/cn";

type ViewType = "kanban" | "list" | "timeline" | "matrix";

// Filter pill configuration
const statusFilters: { value: TaskStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "Active" },
  { value: "done", label: "Done" },
];

const quadrantFilters: { value: TaskQuadrant | "all"; label: string; color: string }[] = [
  { value: "all", label: "All Priority", color: "bg-gray-400" },
  { value: "DO_FIRST", label: "Do First", color: "bg-red-500" },
  { value: "SCHEDULE", label: "Schedule", color: "bg-blue-500" },
  { value: "DELEGATE", label: "Delegate", color: "bg-purple-500" },
  { value: "ELIMINATE", label: "Later", color: "bg-gray-400" },
];

export default function TasksPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  // Filter state
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [quadrantFilter, setQuadrantFilter] = useState<TaskQuadrant | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewType, setViewType] = useState<ViewType>("kanban");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<Task | null>(null);

  // Apply category filter from URL params
  useEffect(() => {
    const categoryId = searchParams.get("category_id");
    if (categoryId) {
      setCategoryFilter(parseInt(categoryId, 10));
    }
  }, [searchParams]);

  // Build filters object
  const filters: TaskFilters = useMemo(() => ({
    status: statusFilter === "all" ? undefined : statusFilter,
    quadrant: quadrantFilter === "all" ? undefined : quadrantFilter,
    category_id: categoryFilter || undefined,
    search: searchQuery || undefined,
    sort_by: "created_at",
    sort_order: "desc",
    limit: 50,
  }), [statusFilter, quadrantFilter, categoryFilter, searchQuery]);

  // Fetch tasks
  const { data, isLoading, error } = useQuery({
    queryKey: ["tasks", filters],
    queryFn: () => tasksApi.getAll(filters),
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.getAll,
  });

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: tasksApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Task deleted");
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      toast.error(axiosError.response?.data?.detail || "Failed to delete task");
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
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      toast.error(axiosError.response?.data?.detail || "Failed to update task");
    },
  });

  // Update task status mutation (for Kanban drag-drop)
  const statusChangeMutation = useMutation({
    mutationFn: (params: { taskId: number; status: TaskStatus }) =>
      tasksApi.update(params.taskId, { status: params.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      toast.error(axiosError.response?.data?.detail || "Failed to update task");
    },
  });

  // Update task quadrant mutation (for Matrix drag-drop)
  const quadrantChangeMutation = useMutation({
    mutationFn: (params: { taskId: number; quadrant: TaskQuadrant }) => {
      const isUrgent = params.quadrant === "DO_FIRST" || params.quadrant === "DELEGATE";
      const isImportant = params.quadrant === "DO_FIRST" || params.quadrant === "SCHEDULE";
      return tasksApi.update(params.taskId, {
        is_urgent: isUrgent,
        is_important: isImportant,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      toast.error(axiosError.response?.data?.detail || "Failed to update task");
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

  const handleStatusChange = (taskId: number, newStatus: TaskStatus) => {
    statusChangeMutation.mutate({ taskId, status: newStatus });
  };

  const handleQuadrantChange = (taskId: number, newQuadrant: TaskQuadrant) => {
    quadrantChangeMutation.mutate({ taskId, quadrant: newQuadrant });
  };

  // Active filters for chips display
  const activeFilters = useMemo(() => {
    const filters: { key: string; label: string; onRemove: () => void }[] = [];

    if (statusFilter !== "all") {
      const status = statusFilters.find((s) => s.value === statusFilter);
      if (status) {
        filters.push({
          key: "status",
          label: status.label,
          onRemove: () => setStatusFilter("all"),
        });
      }
    }

    if (quadrantFilter !== "all") {
      const quadrant = quadrantFilters.find((q) => q.value === quadrantFilter);
      if (quadrant) {
        filters.push({
          key: "quadrant",
          label: quadrant.label,
          onRemove: () => setQuadrantFilter("all"),
        });
      }
    }

    if (categoryFilter) {
      const category = categories.find((c) => c.id === categoryFilter);
      if (category) {
        filters.push({
          key: "category",
          label: category.name,
          onRemove: () => setCategoryFilter(null),
        });
      }
    }

    return filters;
  }, [statusFilter, quadrantFilter, categoryFilter, categories]);

  const clearAllFilters = () => {
    setStatusFilter("all");
    setQuadrantFilter("all");
    setCategoryFilter(null);
    setSearchQuery("");
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            {data?.total || 0} total • {data?.tasks.length || 0} shown
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          size="sm"
          className="gap-1.5 bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-primary/30 transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* View Switcher */}
      <div className="flex gap-2 bg-secondary/50 rounded-lg p-1 w-fit border border-border">
        {[
          { view: "kanban", icon: Grid3x3, label: "Kanban" },
          { view: "list", icon: List, label: "List" },
          { view: "timeline", icon: Calendar, label: "Timeline" },
          { view: "matrix", icon: Maximize2, label: "Matrix" },
        ].map(({ view, icon: Icon, label }) => (
          <Button
            key={view}
            variant={viewType === view ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewType(view as ViewType)}
            className={cn(
              "gap-1.5 text-xs font-medium",
              viewType === view
                ? "bg-gradient-to-r from-primary to-accent text-white shadow-md"
                : "text-muted-foreground hover:text-white hover:bg-secondary/50"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </Button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-11"
        />
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {/* Status Pills */}
        <div className="flex gap-1 p-1 bg-secondary/50 backdrop-blur-sm rounded-lg border border-border">
          {statusFilters.map((status) => (
            <button
              key={status.value}
              onClick={() => setStatusFilter(status.value)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150",
                statusFilter === status.value
                  ? "bg-gradient-to-r from-primary to-accent text-white shadow-sm"
                  : "text-muted-foreground hover:text-white hover:bg-secondary"
              )}
            >
              {status.label}
            </button>
          ))}
        </div>

        {/* Quadrant Pills */}
        <div className="flex gap-1 p-1 bg-secondary/50 backdrop-blur-sm rounded-lg border border-border">
          {quadrantFilters.map((quadrant) => (
            <button
              key={quadrant.value}
              onClick={() => setQuadrantFilter(quadrant.value)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150 flex items-center gap-1.5",
                quadrantFilter === quadrant.value
                  ? "bg-gradient-to-r from-primary to-accent text-white shadow-sm"
                  : "text-muted-foreground hover:text-white hover:bg-secondary"
              )}
            >
              {quadrant.value !== "all" && (
                <div className={cn("w-2 h-2 rounded-full", quadrant.color)} />
              )}
              {quadrant.label}
            </button>
          ))}
        </div>

        {/* Category Pills */}
        {categories.length > 0 && (
          <div className="flex gap-1 p-1 bg-secondary/50 backdrop-blur-sm rounded-lg border border-border overflow-x-auto">
            <button
              onClick={() => setCategoryFilter(null)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150 whitespace-nowrap",
                categoryFilter === null
                  ? "bg-gradient-to-r from-primary to-accent text-white shadow-sm"
                  : "text-muted-foreground hover:text-white hover:bg-secondary"
              )}
            >
              All
            </button>
            {categories.slice(0, 5).map((category) => (
              <button
                key={category.id}
                onClick={() => setCategoryFilter(category.id)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap",
                  categoryFilter === category.id
                    ? "bg-gradient-to-r from-primary to-accent text-white shadow-sm"
                    : "text-muted-foreground hover:text-white hover:bg-secondary"
                )}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: category.color || "#64748B" }}
                />
                {category.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Active Filter Chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Filters:</span>
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              onClick={filter.onRemove}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
            >
              {filter.label}
              <X className="h-3 w-3" />
            </button>
          ))}
          <button
            onClick={clearAllFilters}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Tasks Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <TaskCardSkeleton key={i} variant="detailed" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive bg-destructive/10 p-6 text-center">
          <p className="text-sm text-destructive">
            Failed to load tasks. Please try again.
          </p>
        </div>
      ) : data?.tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-16">
          <p className="text-lg font-medium">No tasks found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {activeFilters.length > 0
              ? "Try adjusting your filters"
              : "Create your first task to get started"}
          </p>
          {activeFilters.length > 0 && (
            <Button variant="outline" size="sm" className="mt-4" onClick={clearAllFilters}>
              Clear filters
            </Button>
          )}
        </div>
      ) : viewType === "kanban" ? (
        <KanbanBoard
          tasks={data?.tasks || []}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onComplete={(id) => completeMutation.mutate(id)}
          onClick={handleTaskClick}
          onTaskStatusChange={handleStatusChange}
        />
      ) : viewType === "list" ? (
        <ListView
          tasks={data?.tasks || []}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onComplete={(id) => completeMutation.mutate(id)}
          onClick={handleTaskClick}
        />
      ) : viewType === "timeline" ? (
        <TimelineView
          tasks={data?.tasks || []}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onComplete={(id) => completeMutation.mutate(id)}
          onClick={handleTaskClick}
        />
      ) : (
        <QuadrantMatrix
          tasks={data?.tasks || []}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onComplete={(id) => completeMutation.mutate(id)}
          onClick={handleTaskClick}
          onTaskQuadrantChange={handleQuadrantChange}
        />
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
