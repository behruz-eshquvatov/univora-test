import { api } from '../api';

export interface TestSession {
  id: string;
  user: number;
  subject_id: number;
  subject_name?: string;
  start_time: string;
  end_time: string | null;
  score: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  current_question_index: number;
  total_questions: number;
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
  getSessions: async (): Promise<TestSession[] | any> => {
    const response = await api.get('/testengine/sessions/');
    return response.data;
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
    return response.data;
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
