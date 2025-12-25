// lib/api/analytics.ts
import { apiClient } from "./client";

export interface DailyTrend {
  date: string;
  completed: number;
  created: number;
}

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

export interface CompletionTrendsAnalytics {
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

export interface PriorityDistributionAnalytics {
  by_quadrant: Record<string, QuadrantStats>;
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
  most_common_quadrant: string | null;
}

export interface CategoryPerformanceAnalytics {
  categories: CategoryStats[];
  total_categories: number;
  most_productive_category: string | null;
  least_productive_category: string | null;
}

export interface TagStats {
  id: number;
  name: string;
  color: string | null;
  usage_count: number;
  completed_count: number;
  completion_rate: number;
  average_completion_time_days: number | null;
}

export interface TagAnalytics {
  tags: TagStats[];
  total_tags: number;
  most_used_tags: string[];
  tags_with_highest_completion: string[];
}

export interface DashboardAnalytics {
  overview: OverviewAnalytics;
  recent_trends: CompletionTrendsAnalytics;
  priority_distribution: PriorityDistributionAnalytics;
  top_categories: CategoryStats[];
  top_tags: TagStats[];
}

export const analyticsApi = {
  getOverview: async (): Promise<OverviewAnalytics> => {
    const response = await apiClient.get<OverviewAnalytics>("/analytics/overview");
    return response.data;
  },

  getTrends: async (period: string = "month", days: number = 30): Promise<CompletionTrendsAnalytics> => {
    const response = await apiClient.get<CompletionTrendsAnalytics>("/analytics/trends", {
      params: { period, days },
    });
    return response.data;
  },

  getPriorityDistribution: async (): Promise<PriorityDistributionAnalytics> => {
    const response = await apiClient.get<PriorityDistributionAnalytics>("/analytics/priority-distribution");
    return response.data;
  },

  getCategoryPerformance: async (): Promise<CategoryPerformanceAnalytics> => {
    const response = await apiClient.get<CategoryPerformanceAnalytics>("/analytics/categories");
    return response.data;
  },

  getTagAnalytics: async (): Promise<TagAnalytics> => {
    const response = await apiClient.get<TagAnalytics>("/analytics/tags");
    return response.data;
  },

  getDashboard: async (): Promise<DashboardAnalytics> => {
    const response = await apiClient.get<DashboardAnalytics>("/analytics/dashboard");
    return response.data;
  },
};
