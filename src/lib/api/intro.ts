import { api } from '../api';

export interface IntroQuestion {
  id: number;
  kind: 'logic' | 'psychology';
  text: string;
  text_ru?: string;
  text_en?: string;
  options: Record<string, string>;
  options_ru?: Record<string, string>;
  options_en?: Record<string, string>;
  image?: string | null;
  video?: string | null;
  video_url?: string | null;
}

export interface IntroStartResponse {
  token: string;
  question_count: number;
  questions: IntroQuestion[];
}

export interface IntroAnswer {
  question: number;
  selected_option: string;
}

export interface IntroSubmitPayload {
  token: string;
  answers: IntroAnswer[];
}

export interface IntroResultItem {
  question: number;
  kind: 'logic' | 'psychology';
  selected_option: string;
  correct_option: string | null;
  is_correct: boolean | null;
  explanation?: string;
}

export interface IntroSubmitResponse {
  question_count: number;
  answered_count: number;
  correct_count: number;
  scored_count: number;
  results: IntroResultItem[];
  message: string;
  registration_required: boolean;
}

export interface AdminIntroQuestion extends IntroQuestion {
  correct_option?: string;
  explanation?: string;
  explanation_ru?: string;
  explanation_en?: string;
  order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const introApi = {
  // 🔓 Public Entrance Test
  getStart: async (): Promise<IntroStartResponse> => {
    const response = await api.get('/intro/start/');
    return response.data;
  },

  submit: async (payload: IntroSubmitPayload): Promise<IntroSubmitResponse> => {
    const response = await api.post('/intro/submit/', payload);
    return response.data;
  },

  // 👑 Admin Question Management
  getAdminQuestions: async (params?: { kind?: string; is_active?: boolean; page?: number }): Promise<AdminIntroQuestion[]> => {
    const response = await api.get('/intro/admin/questions/', { params });
    return Array.isArray(response.data) ? response.data : (response.data?.results || []);
  },

  createAdminQuestion: async (data: FormData | Partial<AdminIntroQuestion>): Promise<AdminIntroQuestion> => {
    const isFormData = data instanceof FormData;
    const response = await api.post('/intro/admin/questions/', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  getAdminQuestionById: async (id: number): Promise<AdminIntroQuestion> => {
    const response = await api.get(`/intro/admin/questions/${id}/`);
    return response.data;
  },

  updateAdminQuestion: async (id: number, data: FormData | Partial<AdminIntroQuestion>): Promise<AdminIntroQuestion> => {
    const isFormData = data instanceof FormData;
    const response = await api.patch(`/intro/admin/questions/${id}/`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  deleteAdminQuestion: async (id: number): Promise<void> => {
    await api.delete(`/intro/admin/questions/${id}/`);
  },
};
