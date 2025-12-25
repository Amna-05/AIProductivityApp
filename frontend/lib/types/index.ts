// ============================================================
// USER & AUTH TYPES (matching backend schemas exactly)
// ============================================================

export interface User {
  id: number;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: User;
}

// ============================================================
// TASK TYPES (matching backend exactly)
// ============================================================

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskQuadrant = "DO_FIRST" | "SCHEDULE" | "DELEGATE" | "ELIMINATE";

// Category as it appears in task response
export interface CategoryInTask {
  id: number;
  name: string;
  color: string | null;
  icon: string | null;
}

// Tag as it appears in task response
export interface TagInTask {
  id: number;
  name: string;
  color: string | null;
}

// Full task response from backend
export interface Task {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  is_urgent: boolean;
  is_important: boolean;
  status: TaskStatus;
  due_date: string | null;
  category_id: number | null;

  // Computed fields
  quadrant: TaskQuadrant;
  is_overdue: boolean;
  days_until_due: number | null;

  // Relationships
  category: CategoryInTask | null;
  tags: TagInTask[];

  // Timestamps
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Task create request (matches backend TaskCreate)
export interface CreateTaskData {
  title: string;                      // Required
  description?: string | null;
  is_urgent?: boolean;                // Default: false
  is_important?: boolean;             // Default: false
  status?: TaskStatus;                // Default: "todo"
  due_date?: string | null;           // ISO datetime
  category_id?: number | null;
  tag_ids?: number[];                 // Array of tag IDs
}

// Task update request (matches backend TaskUpdate)
export interface UpdateTaskData {
  title?: string;
  description?: string | null;
  is_urgent?: boolean;
  is_important?: boolean;
  status?: TaskStatus;
  due_date?: string | null;
  category_id?: number | null;
  tag_ids?: number[];
}

// Task list response
export interface TaskListResponse {
  total: number;
  tasks: Task[];
}

// ============================================================
// CATEGORY TYPES (matching backend exactly)
// ============================================================

export interface Category {
  id: number;
  user_id: number;
  name: string;
  color: string | null;
  icon: string | null;
  created_at: string;
}

export interface CreateCategoryData {
  name: string;                       // Required, 1-50 chars
  color?: string;                     // Optional, hex color
  icon?: string;                      // Optional, emoji or icon name
}

export interface UpdateCategoryData {
  name?: string;
  color?: string;
  icon?: string;
}

// ============================================================
// TAG TYPES (matching backend exactly)
// ============================================================

export interface Tag {
  id: number;
  user_id: number;
  name: string;
  color: string;                      // Has default: #3B82F6
  created_at: string;
}

export interface CreateTagData {
  name: string;                       // Required, 1-30 chars
  color?: string;                     // Optional, hex color
}

export interface UpdateTagData {
  name?: string;
  color?: string;
}

// AI types
export interface ParseTaskRequest {
  text: string;
}

export interface ParsedTask {
  title: string;
  description: string;
  is_urgent: boolean;
  is_important: boolean;
  due_date: string | null;
  confidence: number;
  reasoning: string;
}

export interface PrioritySuggestion {
  task_id: number;
  suggested_urgent: boolean;
  suggested_important: boolean;
  suggested_quadrant: TaskQuadrant;
  urgency_score: number;
  importance_score: number;
  confidence: number;
  reasoning: string;
  similar_tasks: SimilarTask[];
}

export interface SimilarTask {
  id: number;
  title: string;
  similarity: number;
  was_urgent: boolean;
  was_important: boolean;
  quadrant: TaskQuadrant;
  completion_time_days: number | null;
}

// Analytics types
export interface OverviewAnalytics {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
  completion_rate: number;
  overdue_tasks: number;
  tasks_due_today: number;
  tasks_due_this_week: number;
  average_completion_time_days: number;
  productivity_score: number;
}

export interface DailyTrend {
  date: string;
  completed: number;
  created: number;
}

export interface CompletionTrends {
  period: string;
  data: DailyTrend[];
  total_completed: number;
  total_created: number;
  completion_velocity: number;
  net_change: number;
}

export interface QuadrantStats {
  count: number;
  completed: number;
  completion_rate: number;
  average_completion_time_days: number | null;
}

export interface PriorityDistribution {
  by_quadrant: Record<TaskQuadrant, QuadrantStats>;
  urgent_tasks: number;
  important_tasks: number;
  total_tasks: number;
}

export interface CategoryStats {
  id: number;
  name: string;
  color: string | null;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  pending_tasks: number;
  completion_rate: number;
  average_completion_time_days: number | null;
  most_common_quadrant: TaskQuadrant | null;
}

export interface DashboardAnalytics {
  overview: OverviewAnalytics;
  recent_trends: CompletionTrends;
  priority_distribution: PriorityDistribution;
  top_categories: CategoryStats[];
  top_tags: any[];
}

// API Response types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

export interface ApiError {
  detail: string;
  error?: string;
  correlation_id?: string;
}
