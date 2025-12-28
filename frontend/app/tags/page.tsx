"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Edit, Trash2, Tag as TagIcon } from "lucide-react";
import { toast } from "sonner";

import { tagsApi } from "@/lib/api/tags";
import { Tag } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { TagFormDialog } from "@/components/tags/TagFormDialog";

export default function TagsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  // Fetch tags
  const { data: tags = [], isLoading, error } = useQuery({
    queryKey: ["tags"],
    queryFn: tagsApi.getAll,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: tagsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag deleted successfully");
    },
    onError: (error: string | any) => {
      toast.error(error.response?.data?.detail || "Failed to delete tag");
    },
  });

  const handleOpenDialog = (tag?: Tag) => {
    if (tag) {
      setEditingTag(tag);
    } else {
      setEditingTag(null);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTag(null);
  };

  const handleDelete = (id: number, name: string) => {
    if (
      confirm(
        `Are you sure you want to delete "${name}"? This will remove it from all associated tasks.`
      )
    ) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tags</h1>
          <p className="text-muted-foreground">
            Label and organize your tasks with custom tags
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          New Tag
        </Button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Failed to load tags. Please try again.
          </p>
        </div>
      ) : tags.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12">
          <p className="text-lg font-medium">No tags found</p>
          <p className="text-sm text-muted-foreground">
            Create your first tag to get started
          </p>
        </div>
      ) : (
        /* Tags List */
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            {tags.length} {tags.length === 1 ? "tag" : "tags"} total
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: tag.color }}
                    >
                      <TagIcon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{tag.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {tag.task_count} {tag.task_count === 1 ? "task" : "tasks"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => handleOpenDialog(tag)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(tag.id, tag.name)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <span
                    className="h-3 w-8 rounded"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="font-mono">{tag.color}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tag Form Dialog */}
      <TagFormDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        tag={editingTag}
      />
    </div>
  );
}
