import { apiClient } from "./client";
import {
  Task,
  CreateTaskData,
  UpdateTaskData,
  TaskListResponse,
  TaskStatus,
  TaskQuadrant,
} from "../types";

// ============================================================
// TASK FILTER INTERFACE (matching backend query params exactly)
// ============================================================

export interface TaskFilters {
  // Basic filters
  status?: TaskStatus;
  category_id?: number;

  // Priority matrix
  is_urgent?: boolean;
  is_important?: boolean;
  quadrant?: TaskQuadrant;

  // Multiple filters
  category_ids?: string;    // "1,2,3"
  tag_ids?: string;          // "1,2,3"

  // Date filters
  due_before?: string;       // ISO datetime
  due_after?: string;
  created_after?: string;
  overdue_only?: boolean;
  no_due_date?: boolean;

  // Completion
  completed?: boolean;
  completed_after?: string;

  // Search
  search?: string;

  // Sorting
  sort_by?: "created_at" | "updated_at" | "due_date" | "title" | "priority";
  sort_order?: "asc" | "desc";

  // Pagination
  skip?: number;
  limit?: number;
}

// ============================================================
// TASKS API
// ============================================================

export const tasksApi = {
  /**
   * GET /tasks - List tasks with advanced filtering
   * @returns TaskListResponse with total count and tasks array
   */
  getAll: async (filters?: TaskFilters): Promise<TaskListResponse> => {
    const response = await apiClient.get<TaskListResponse>("/tasks", {
      params: filters,
    });
    return response.data;
  },

  /**
   * GET /tasks/{id} - Get single task by ID
   */
  getById: async (id: number): Promise<Task> => {
    const response = await apiClient.get<Task>(`/tasks/${id}`);
    return response.data;
  },

  /**
   * POST /tasks - Create new task
   */
  create: async (data: CreateTaskData): Promise<Task> => {
    const response = await apiClient.post<Task>("/tasks", data);
    return response.data;
  },

  /**
   * PATCH /tasks/{id} - Update task
   */
  update: async (id: number, data: UpdateTaskData): Promise<Task> => {
    const response = await apiClient.patch<Task>(`/tasks/${id}`, data);
    return response.data;
  },

  /**
   * DELETE /tasks/{id} - Delete task
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },

  // ============================================================
  // CONVENIENCE METHODS (using filters)
  // ============================================================

  /**
   * Get tasks by status
   */
  getByStatus: async (status: TaskStatus): Promise<TaskListResponse> => {
    return tasksApi.getAll({ status });
  },

  /**
   * Get tasks by quadrant
   */
  getByQuadrant: async (quadrant: TaskQuadrant): Promise<TaskListResponse> => {
    return tasksApi.getAll({ quadrant });
  },

  /**
   * Get overdue tasks only
   */
  getOverdue: async (): Promise<TaskListResponse> => {
    return tasksApi.getAll({ overdue_only: true });
  },

  /**
   * Search tasks
   */
  search: async (query: string): Promise<TaskListResponse> => {
    return tasksApi.getAll({ search: query });
  },
};
