import { api } from '../api';

export interface Subject {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  translations?: { uz?: string; ru?: string; en?: string };
  created_at?: string;
  total_solved_tests?: number;
  has_test?: boolean;
}

export interface Grade {
  id: number;
  subject: number;
  subject_name?: string;
  name: string;
  name_ru?: string;
  name_en?: string;
  translations?: { uz?: string; ru?: string; en?: string };
  order?: number;
  is_active?: boolean;
  topic_count?: number;
  has_test?: boolean;
}

export interface Topic {
  id: number;
  subject: number | Subject;
  subject_name?: string;
  grade?: number;
  grade_name?: string;
  name?: string;
  title?: string;
  description?: string;
  translations?: { uz?: string; ru?: string; en?: string };
  order?: number;
  has_test?: boolean;
  available_counts?: number[];
  question_count?: number | null;
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

  // Grades (Sinf / Kitob)
  getGrades: async (params?: { subject?: number | string; name?: string; is_active?: boolean }): Promise<Grade[]> => {
    const response = await api.get('/catalog/grades/', { params });
    return response.data.results || response.data;
  },
  getGradeById: async (id: number | string): Promise<Grade> => {
    const response = await api.get<Grade>(`/catalog/grades/${id}/`);
    return response.data;
  },

  // Topics
  getTopics: async (params?: number | string | { subject?: number | string; grade?: number | string; has_test?: boolean; is_active?: boolean }): Promise<Topic[]> => {
    let queryParams: any = {};
    if (typeof params === 'object') {
      queryParams = params;
    } else if (params !== undefined) {
      queryParams = { subject: params };
    }
    const response = await api.get('/catalog/topics/', { params: queryParams });
    return response.data.results || response.data;
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
  deleteSubject: async (id: number | string, cascade = true) => {
    await api.delete(`/catalog/subjects/${id}/`, { params: { cascade } });
  },

  createGrade: async (data: Partial<Grade>) => {
    const response = await api.post<Grade>('/catalog/grades/', data);
    return response.data;
  },
  updateGrade: async (id: number | string, data: Partial<Grade>) => {
    const response = await api.patch<Grade>(`/catalog/grades/${id}/`, data);
    return response.data;
  },
  deleteGrade: async (id: number | string, cascade = true) => {
    await api.delete(`/catalog/grades/${id}/`, { params: { cascade } });
  },

  createTopic: async (data: Partial<Topic>) => {
    const response = await api.post<Topic>('/catalog/topics/', data);
    return response.data;
  },
  updateTopic: async (id: number | string, data: Partial<Topic>) => {
    const response = await api.patch<Topic>(`/catalog/topics/${id}/`, data);
    return response.data;
  },
  deleteTopic: async (id: number | string, cascade = true) => {
    await api.delete(`/catalog/topics/${id}/`, { params: { cascade } });
  },

  createQuestion: async (data: Partial<Question> | FormData) => {
    const isFormData = data instanceof FormData;
    const response = await api.post<Question>('/catalog/questions/', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },
  updateQuestion: async (id: number | string, data: Partial<Question> | FormData) => {
    const isFormData = data instanceof FormData;
    const response = await api.patch<Question>(`/catalog/questions/${id}/`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },
  deleteQuestion: async (id: number | string) => {
    await api.delete(`/catalog/questions/${id}/`);
  },
};
