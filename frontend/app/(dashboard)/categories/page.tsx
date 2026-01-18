"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesApi, CreateCategoryData, UpdateCategoryData } from "@/lib/api/categories";
import { Category } from "@/lib/types";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, FolderKanban, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent,  CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
//import { cn } from "@/lib/utils/cn";

// Emerald palette colors
const CATEGORY_COLORS = [
  { name: "Emerald", value: "#10B981" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Orange", value: "#F59E0B" },
  { name: "Red", value: "#EF4444" },
  { name: "Pink", value: "#EC4899" },
  { name: "Gray", value: "#64748B" },
];

const CATEGORY_ICONS = ["💼", "👤", "📚", "💪", "📌", "🎯", "🏠", "🚀", "💡", "🎨"];

// Loading skeleton
function CategoryCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted" />
            <div>
              <div className="h-5 w-24 bg-muted rounded mb-1" />
              <div className="h-3 w-16 bg-muted rounded" />
            </div>
          </div>
          <div className="flex gap-1">
            <div className="h-8 w-8 bg-muted rounded" />
            <div className="h-8 w-8 bg-muted rounded" />
            <div className="h-8 w-8 bg-muted rounded" />
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

export default function CategoriesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    color: CATEGORY_COLORS[0].value,
    icon: CATEGORY_ICONS[0],
  });

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.getAll,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateCategoryData) => categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created successfully");
      resetForm();
      setDialogOpen(false);
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      toast.error(axiosError.response?.data?.detail || "Failed to create category");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCategoryData }) =>
      categoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category updated successfully");
      resetForm();
      setDialogOpen(false);
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      toast.error(axiosError.response?.data?.detail || "Failed to update category");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Category deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingCategory(null);
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      toast.error(axiosError.response?.data?.detail || "Failed to delete category");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      color: CATEGORY_COLORS[0].value,
      icon: CATEGORY_ICONS[0],
    });
    setEditingCategory(null);
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        color: category.color || CATEGORY_COLORS[0].value,
        icon: category.icon || CATEGORY_ICONS[0],
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    if (categories.length >= 10 && !editingCategory) {
      toast.error("Maximum 10 categories allowed");
      return;
    }

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (category: Category) => {
    setDeletingCategory(category);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingCategory) {
      deleteMutation.mutate(deletingCategory.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 animate-fade-in-up">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-32 bg-muted rounded animate-pulse" />
            <div className="h-4 w-48 bg-muted rounded mt-2 animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CategoryCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 animate-fade-in-up bg-background min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-foreground tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground font-medium">
            Organize tasks ({categories.length}/10)
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          disabled={categories.length >= 10}
          size="sm"
          className="gap-1.5 bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
        {categories.map((category, idx) => {
          const categoryWithCounts = category as Category & { task_count?: number; completed_count?: number };
          const taskCount = categoryWithCounts.task_count || 0;
          const completedCount = categoryWithCounts.completed_count || 0;
          const progress = taskCount > 0 ? (completedCount / taskCount) * 100 : 0;

          return (
            <Card
              key={category.id}
              className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-fade-in border-border/50 bg-gradient-to-br from-secondary/20 to-secondary/10 cursor-pointer hover:border-primary/30"
              style={{ animationDelay: `${idx * 50}ms` }}
              onClick={() => router.push(`/tasks?category_id=${category.id}`)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div
                      className="h-14 w-14 rounded-xl flex items-center justify-center text-2xl shadow-md ring-2 ring-primary/10 flex-shrink-0"
                      style={{ backgroundColor: category.color || "#64748B" }}
                    >
                      {category.icon || "📁"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-bold text-foreground truncate">
                        {category.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground font-semibold">
                          {taskCount} task{taskCount !== 1 ? "s" : ""}
                        </span>
                        {taskCount > 0 && (
                          <>
                            <span className="text-border">•</span>
                            <span className="text-xs text-primary font-bold">
                              {completedCount} done
                            </span>
                          </>
                        )}
                      </div>
                      {/* Mini progress bar */}
                      {taskCount > 0 && (
                        <div className="mt-3 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(category)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(category)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}

        {/* Empty State */}
        {categories.length === 0 && (
          <Card className="col-span-full border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="mb-6 p-4 rounded-2xl bg-primary/10">
                <FolderKanban className="h-12 w-12 text-primary" />
              </div>
              <p className="text-xl font-bold text-foreground mb-2 text-center">No categories yet</p>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                Create categories to organize and track your tasks by project, area, or priority
              </p>
              <Button
                onClick={() => handleOpenDialog()}
                className="gap-2 bg-primary hover:bg-primary/90 text-white"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                Create Your First Category
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Create Category"}</DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update your category details"
                : "Add a new category to organize your tasks"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Work, Personal, Studies"
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {CATEGORY_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`h-10 w-10 rounded-lg transition-all ${
                      formData.color === color.value
                        ? "ring-2 ring-offset-2 ring-primary scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex gap-2 flex-wrap">
                {CATEGORY_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`h-10 w-10 rounded-lg border-2 text-xl transition-all hover:scale-105 ${
                      formData.icon === icon
                        ? "border-primary bg-primary/10 scale-110"
                        : "border-border"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingCategory ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingCategory?.name}? Tasks with this category
              will be set to No Category.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
