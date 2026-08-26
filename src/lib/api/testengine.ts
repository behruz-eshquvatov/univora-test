import { api } from '../api';

export interface TestSession {
  id: string;
  user: {
    id: number;
    email: string;
    full_name: string;
    avatar_url: string;
  };
  subject: {
    id: number;
    name: string;
  };
  mode: string;
  mode_display: string;
  started_at: string;
  finished_at: string | null;
  duration_seconds: number | null;
  total_questions: number;
  created_at: string;
  updated_at: string;
}

export interface QuestionOption {
  id: number;
  text: string;
}

export interface TestQuestion {
  id: number;
  text: string;
  options: Record<string, string>;
}

export const testengineApi = {
  getSessions: async (): Promise<TestSession[]> => {
    const response = await api.get('/testengine/sessions/');
    return response.data.results || response.data;
  },

  startSession: async (subjectId: number): Promise<TestSession> => {
    const response = await api.post('/testengine/sessions/', { 
      subject: subjectId,
      subject_id: subjectId 
    });
    return response.data;
  },

  getSessionDetail: async (id: string): Promise<TestSession> => {
    const response = await api.get(`/testengine/sessions/${id}/`);
    return response.data;
  },

  getNextQuestion: async (id: string): Promise<TestQuestion> => {
    const response = await api.get(`/testengine/sessions/${id}/next-question/`);
    return response.data.question || response.data;
  },

  syncSession: async (id: string, answers: { question: number, selected_option: string, is_correct: boolean }[]): Promise<any> => {
    const response = await api.post(`/testengine/sessions/${id}/sync/`, { answers });
    return response.data;
  },

  finishSession: async (id: string): Promise<TestSession> => {
    const response = await api.post(`/testengine/sessions/${id}/finish/`);
    return response.data;
  },

  getSessionAnalytics: async (id: string): Promise<any> => {
    const response = await api.get(`/testengine/sessions/${id}/an/`);
    return response.data;
  }
};
