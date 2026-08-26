import { api } from '../api';

export interface Subject {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  created_at?: string;
  total_solved_tests?: number;
}

export interface Topic {
  id: number;
  subject: number | Subject;
  title: string;
  description?: string;
  order?: number;
  created_at?: string;
}

export interface Question {
  id: number;
  topic: number | Topic;
  text: string;
  question_type: string;
  options: any; 
  correct_answer: any;
  explanation?: string;
  difficulty?: number;
}

export const catalogApi = {
  // Subjects
  getSubjects: async (): Promise<Subject[]> => {
    const res = await api.get('/catalog/subjects/');
    return res.data.results || res.data;
  },
  getSubjectById: async (id: number | string) => {
    const response = await api.get<Subject>(`/catalog/subjects/${id}/`);
    return response.data;
  },

  // Topics
  getTopics: async (subjectId?: number | string) => {
    // If your backend supports filtering by subject
    const url = subjectId ? `/catalog/topics/?subject=${subjectId}` : '/catalog/topics/';
    const response = await api.get<Topic[]>(url);
    return response.data;
  },
  getTopicById: async (id: number | string) => {
    const response = await api.get<Topic>(`/catalog/topics/${id}/`);
    return response.data;
  },

  // Questions
  getQuestions: async (topicId?: number | string) => {
    // If your backend supports filtering by topic
    const url = topicId ? `/catalog/questions/?topic=${topicId}` : '/catalog/questions/';
    const response = await api.get<Question[]>(url);
    return response.data;
  },
  getQuestionById: async (id: number | string) => {
    const response = await api.get<Question>(`/catalog/questions/${id}/`);
    return response.data;
  },

  // --- Admin Methods ---
  createSubject: async (data: Partial<Subject>) => {
    const response = await api.post<Subject>('/catalog/subjects/', data);
    return response.data;
  },
  updateSubject: async (id: number | string, data: Partial<Subject>) => {
    const response = await api.patch<Subject>(`/catalog/subjects/${id}/`, data);
    return response.data;
  },
  deleteSubject: async (id: number | string) => {
    await api.delete(`/catalog/subjects/${id}/`);
  },

  createTopic: async (data: Partial<Topic>) => {
    const response = await api.post<Topic>('/catalog/topics/', data);
    return response.data;
  },
  updateTopic: async (id: number | string, data: Partial<Topic>) => {
    const response = await api.patch<Topic>(`/catalog/topics/${id}/`, data);
    return response.data;
  },
  deleteTopic: async (id: number | string) => {
    await api.delete(`/catalog/topics/${id}/`);
  },

  createQuestion: async (data: Partial<Question>) => {
    const response = await api.post<Question>('/catalog/questions/', data);
    return response.data;
  },
  updateQuestion: async (id: number | string, data: Partial<Question>) => {
    const response = await api.patch<Question>(`/catalog/questions/${id}/`, data);
    return response.data;
  },
  deleteQuestion: async (id: number | string) => {
    await api.delete(`/catalog/questions/${id}/`);
  },
};
