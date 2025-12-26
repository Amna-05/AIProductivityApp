import { apiClient } from "./client";

export interface SystemStats {
  total_users: number;
  active_users: number;
  admin_users: number;
  total_tasks: number;
  completed_tasks: number;
}

export interface UserListItem {
  id: number;
  email: string;
  username: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  task_count: number;
  completed_task_count: number;
}

export const adminApi = {
  getStats: async (): Promise<SystemStats> => {
    const response = await apiClient.get<SystemStats>("/admin/stats");
    return response.data;
  },

  getUsers: async (): Promise<UserListItem[]> => {
    const response = await apiClient.get<UserListItem[]>("/admin/users");
    return response.data;
  },

  toggleAdmin: async (userId: number): Promise<{ message: string; user: UserListItem }> => {
    const response = await apiClient.patch<{ message: string; user: UserListItem }>(
      `/admin/users/${userId}/toggle-admin`
    );
    return response.data;
  },

  toggleActive: async (userId: number): Promise<{ message: string; user: UserListItem }> => {
    const response = await apiClient.patch<{ message: string; user: UserListItem }>(
      `/admin/users/${userId}/toggle-active`
    );
    return response.data;
  },
};
