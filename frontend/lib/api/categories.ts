// lib/api/categories.ts
import { apiClient } from "./client";
import { Category } from "../types";

export interface CreateCategoryData {
  name: string;
  color?: string | null;
  icon?: string | null;
}

export interface UpdateCategoryData {
  name?: string;
  color?: string | null;
  icon?: string | null;
}

export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>("/categories");
    return response.data;
  },

  getById: async (id: number): Promise<Category> => {
    const response = await apiClient.get<Category>(`/categories/${id}`);
    return response.data;
  },

  create: async (data: CreateCategoryData): Promise<Category> => {
    const response = await apiClient.post<Category>("/categories", data);
    return response.data;
  },

  update: async (id: number, data: UpdateCategoryData): Promise<Category> => {
    const response = await apiClient.patch<Category>(`/categories/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },
};
