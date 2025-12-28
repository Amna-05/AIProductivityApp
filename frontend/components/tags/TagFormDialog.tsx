"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { tagsApi } from "@/lib/api/tags";
import { Tag } from "@/lib/types";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Form validation schema
const tagFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(30, "Name must be less than 30 characters"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format (use #RRGGBB)").default("#3B82F6"),
});

type TagFormValues = z.infer<typeof tagFormSchema>;

interface TagFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag?: Tag | null;
}

const defaultColors = [
  "#EF4444", // Red
  "#F59E0B", // Orange
  "#EAB308", // Yellow
  "#22C55E", // Green
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#6B7280", // Gray
  "#14B8A6", // Teal
  "#F97316", // Orange
];

export function TagFormDialog({ open, onOpenChange, tag }: TagFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!tag;

  // Initialize form
  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      name: "",
      color: "#3B82F6",
    },
  });

  // Reset form when tag changes or dialog opens
  useEffect(() => {
    if (tag) {
      form.reset({
        name: tag.name,
        color: tag.color,
      });
    } else {
      form.reset({
        name: "",
        color: "#3B82F6",
      });
    }
  }, [tag, form, open]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: tagsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag created successfully");
      onOpenChange(false);
      form.reset();
    },
    onError: (error: string | any) => {
      toast.error(error.response?.data?.detail || "Failed to create tag");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: TagFormValues }) =>
      tagsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag updated successfully");
      onOpenChange(false);
    },
    onError: (error: string | any) => {
      toast.error(error.response?.data?.detail || "Failed to update tag");
    },
  });

  const onSubmit = (data: TagFormValues) => {
    if (isEditing) {
      updateMutation.mutate({ id: tag.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Tag" : "Create New Tag"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the tag details below."
              : "Fill in the details to create a new tag."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter tag name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color *</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Input
                          type="color"
                          className="h-10 w-20 cursor-pointer"
                          {...field}
                        />
                        <Input placeholder="#3B82F6" {...field} />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {defaultColors.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className="h-8 w-8 rounded-md border-2 border-gray-300 transition-all hover:scale-110"
                            style={{ backgroundColor: color }}
                            onClick={() => field.onChange(color)}
                          />
                        ))}
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs">
                    Choose a color to identify this tag
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Footer */}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Update Tag" : "Create Tag"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
