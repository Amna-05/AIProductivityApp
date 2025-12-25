// lib/api/tags.ts
import { apiClient } from "./client";
import { Tag } from "../types";

export interface CreateTagData {
  name: string;
  color?: string;
}

export interface UpdateTagData {
  name?: string;
  color?: string;
}

export const tagsApi = {
  getAll: async (): Promise<Tag[]> => {
    const response = await apiClient.get<Tag[]>("/tags");
    return response.data;
  },

  getById: async (id: number): Promise<Tag> => {
    const response = await apiClient.get<Tag>(`/tags/${id}`);
    return response.data;
  },

  create: async (data: CreateTagData): Promise<Tag> => {
    const response = await apiClient.post<Tag>("/tags", data);
    return response.data;
  },

  update: async (id: number, data: UpdateTagData): Promise<Tag> => {
    const response = await apiClient.patch<Tag>(`/tags/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/tags/${id}`);
  },
};
