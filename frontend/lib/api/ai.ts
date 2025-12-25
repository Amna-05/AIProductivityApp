// lib/api/ai.ts
import { apiClient } from "./client";

// AI Task Parser Types
export interface VoiceTaskInput {
  text: string;
}

export interface ParsedTaskResponse {
  title: string;
  description: string | null;
  due_date: string | null;
  is_urgent: boolean;
  is_important: boolean;
  suggested_category: string | null;
  suggested_tags: string[];
  confidence: number;
  original_input: string;
}

// Priority Suggestion Types
export interface SimilarTaskInfo {
  id: number;
  title: string;
  description: string | null;
  similarity: number;
  was_urgent: boolean;
  was_important: boolean;
  quadrant: string;
  completion_time_days: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface PrioritySuggestionResponse {
  task_id: number;
  suggested_urgent: boolean;
  suggested_important: boolean;
  suggested_quadrant: string;
  urgency_score: number;
  importance_score: number;
  confidence: number;
  reasoning: string;
  similar_tasks: SimilarTaskInfo[];
}

export const aiApi = {
  // Parse natural language to task
  parseTask: async (input: VoiceTaskInput): Promise<ParsedTaskResponse> => {
    const response = await apiClient.post<ParsedTaskResponse>(
      "/ai/tasks/parse",
      input
    );
    return response.data;
  },

  // Create task from voice/text in one step
  createFromVoice: async (input: VoiceTaskInput) => {
    const response = await apiClient.post("/ai/tasks/create-from-voice", input);
    return response.data;
  },

  // Get priority suggestion for a task
  getPrioritySuggestion: async (
    taskId: number
  ): Promise<PrioritySuggestionResponse> => {
    const response = await apiClient.get<PrioritySuggestionResponse>(
      `/ai/priority/suggest/${taskId}`
    );
    return response.data;
  },
};
