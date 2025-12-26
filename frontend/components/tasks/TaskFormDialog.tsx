"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarIcon, Loader2 } from "lucide-react";

import { tasksApi } from "@/lib/api/tasks";
import { categoriesApi } from "@/lib/api/categories";
import { tagsApi } from "@/lib/api/tags";
import { Task, TaskStatus } from "@/lib/types";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

// Form validation schema
const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional().nullable(),
  is_urgent: z.boolean().default(false),
  is_important: z.boolean().default(false),
  status: z.enum(["todo", "in_progress", "done"]).default("todo"),
  due_date: z.string().optional().nullable(),
  category_id: z.number().optional().nullable(),
  tag_ids: z.array(z.number()).optional().default([]),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
}

export function TaskFormDialog({ open, onOpenChange, task }: TaskFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!task;

  // Fetch categories and tags
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.getAll,
  });

  const { data: tags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: tagsApi.getAll,
  });

  // Initialize form
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      is_urgent: false,
      is_important: false,
      status: "todo",
      due_date: "",
      category_id: null,
      tag_ids: [],
    },
  });

  // Reset form when task changes or dialog opens
  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description || "",
        is_urgent: task.is_urgent,
        is_important: task.is_important,
        status: task.status,
        due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : "",
        category_id: task.category_id,
        tag_ids: task.tags.map((tag) => tag.id),
      });
    } else {
      form.reset({
        title: "",
        description: "",
        is_urgent: false,
        is_important: false,
        status: "todo",
        due_date: "",
        category_id: null,
        tag_ids: [],
      });
    }
  }, [task, form, open]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task created successfully");
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to create task");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: TaskFormValues }) =>
      tasksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task updated successfully");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to update task");
    },
  });

  const onSubmit = (data: TaskFormValues) => {
    // Convert due_date string to ISO datetime or null
    const formattedData = {
      ...data,
      due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
      category_id: data.category_id || null,
    };

    if (isEditing) {
      updateMutation.mutate({ id: task.id, data: formattedData });
    } else {
      createMutation.mutate(formattedData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Calculate current quadrant for display
  const currentQuadrant = form.watch("is_urgent") && form.watch("is_important")
    ? "DO FIRST (Urgent & Important)"
    : !form.watch("is_urgent") && form.watch("is_important")
    ? "SCHEDULE (Not Urgent & Important)"
    : form.watch("is_urgent") && !form.watch("is_important")
    ? "DELEGATE (Urgent & Not Important)"
    : "ELIMINATE (Not Urgent & Not Important)";

  const quadrantColor = form.watch("is_urgent") && form.watch("is_important")
    ? "text-destructive"
    : !form.watch("is_urgent") && form.watch("is_important")
    ? "text-warning"
    : form.watch("is_urgent") && !form.watch("is_important")
    ? "text-info"
    : "text-muted-foreground";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold text-foreground">{isEditing ? "Edit Task" : "Create New Task"}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditing
              ? "Update the task details below."
              : "Fill in the details to create a new task."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Section 1: Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-foreground">Basic Information</h3>

              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter task title" {...field} className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter task description (optional)"
                        className="min-h-[100px]"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section 2: Scheduling */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-foreground">Scheduling</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Due Date */}
                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Due Date</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          value={field.value || ""}
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Status */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Section 3: Priority (Eisenhower Matrix) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-foreground">Priority (Eisenhower Matrix)</h3>
                <span className={`text-xs font-semibold ${quadrantColor}`}>
                  {currentQuadrant}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Is Urgent */}
                <FormField
                  control={form.control}
                  name="is_urgent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border-2 p-4 shadow-sm hover:border-primary/50 transition-colors">
                      <div className="space-y-0.5">
                        <FormLabel className="font-semibold">Urgent</FormLabel>
                        <FormDescription className="text-xs">
                          Requires immediate attention
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Is Important */}
                <FormField
                  control={form.control}
                  name="is_important"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border-2 p-4 shadow-sm hover:border-primary/50 transition-colors">
                      <div className="space-y-0.5">
                        <FormLabel className="font-semibold">Important</FormLabel>
                        <FormDescription className="text-xs">
                          Contributes to long-term goals
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Section 4: Organization */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-foreground">Organization</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category */}
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Category</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value === "none" ? null : parseInt(value))
                        }
                        value={field.value?.toString() || "none"}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No Category</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              <div className="flex items-center gap-2">
                                {category.color && (
                                  <span
                                    className="h-3 w-3 rounded-full"
                                    style={{ backgroundColor: category.color }}
                                  />
                                )}
                                {category.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tags - Placeholder */}
                <FormItem>
                  <FormLabel className="font-semibold">Tags</FormLabel>
                  <div className="h-11 flex items-center px-3 rounded-md border bg-muted/30 text-sm text-muted-foreground">
                    {tags.length > 0
                      ? `${tags.length} tags available (coming soon)`
                      : "No tags created yet"}
                  </div>
                </FormItem>
              </div>
            </div>

            {/* Footer */}
            <DialogFooter className="pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="h-11 text-foreground font-medium"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="h-11 font-medium">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Update Task" : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
