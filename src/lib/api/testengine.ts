import { api } from '../api';

// ─── Типы ───────────────────────────────────────────────────────────────────

export interface SubjectMinimal {
  id: number;
  name: string;
}

export interface UserMinimal {
  id: number;
  email: string;
  full_name: string;
  avatar_url: string;
}

export interface TestQuestion {
  id: number;
  topic_id: number;
  topic_name: string;
  text: string;
  options: Record<string, string>;
  image: string | null;
  image_caption: string;
  has_image: boolean;
  difficulty: number;
}

export interface MyAnswer {
  id: number;
  selected_option: string;
  confidence: string;
  time_spent_seconds: number;
  updated_at: string;
}

/** Один вопрос сессии (до завершения). */
export interface SessionQuestion {
  order: number;
  question: TestQuestion;
  my_answer: MyAnswer | null;
  is_answered: boolean;
}

/** Один вопрос сессии (после завершения — есть правильный ответ). */
export interface SessionQuestionReview extends SessionQuestion {
  correct_option: string;
  selected_option: string | null;
  is_correct: boolean;
  time_spent_seconds: number;
}

export interface TestSession {
  id: number;
  user: UserMinimal;
  subject: SubjectMinimal;
  mode: string;
  mode_display: string;
  question_count: number;
  started_at: string;
  finished_at: string | null;
  is_finished: boolean;
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
}

/** Детальная сессия: дополнительно contains счётчики прогресса. */
export interface TestSessionDetail extends TestSession {
  total_questions: number;
  answered_count: number;
  unanswered_count: number;
}

export interface SessionProgress {
  total_questions: number;
  answered_count: number;
  unanswered_count: number;
  unanswered_orders: number[];
  is_finished: boolean;
}

export interface TestResult {
  id: number;
  session: number;
  subject: SubjectMinimal;
  user: UserMinimal;
  mode: string;
  mode_display: string;
  total_score: number;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  total_questions: number;
  accuracy_percent: number;
  duration_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface FinishResponse {
  session: TestSessionDetail;
  result: TestResult;
  review: SessionQuestionReview[];
}

// ─── API ────────────────────────────────────────────────────────────────────

export const testengineApi = {
  // Список сессий (пагинированный)
  getSessions: async (): Promise<TestSession[]> => {
    const response = await api.get('/testengine/sessions/');
    return response.data.results || response.data;
  },

  // Создать новую сессию
  startSession: async (
    subjectId: number,
    options?: { question_count?: number; mode?: string }
  ): Promise<TestSessionDetail> => {
    const response = await api.post('/testengine/sessions/', {
      subject: subjectId,
      mode: options?.mode || 'practice',
      question_count: options?.question_count,
    });
    return response.data;
  },

  // Детали сессии
  getSessionDetail: async (id: string | number): Promise<TestSessionDetail> => {
    const response = await api.get(`/testengine/sessions/${id}/`);
    return response.data;
  },

  // Все вопросы сессии (сразу весь тест)
  getSessionQuestions: async (id: string | number): Promise<SessionQuestion[]> => {
    const response = await api.get(`/testengine/sessions/${id}/questions/`);
    return response.data.results || response.data;
  },

  // Один вопрос по порядковому номеру (1-based)
  getQuestionByOrder: async (
    sessionId: string | number,
    order: number
  ): Promise<SessionQuestion> => {
    const response = await api.get(`/testengine/sessions/${sessionId}/questions/${order}/`);
    return response.data;
  },

  // Ответить на вопрос (или изменить ответ)
  answerQuestion: async (
    sessionId: string | number,
    order: number,
    selectedOption: string,
    options?: { confidence?: string; time_spent_seconds?: number }
  ): Promise<SessionQuestion> => {
    const response = await api.post(
      `/testengine/sessions/${sessionId}/questions/${order}/answer/`,
      {
        selected_option: selectedOption.toUpperCase(),
        confidence: options?.confidence || '',
        time_spent_seconds: options?.time_spent_seconds || 0,
      }
    );
    return response.data;
  },

  // Прогресс сессии
  getProgress: async (id: string | number): Promise<SessionProgress> => {
    const response = await api.get(`/testengine/sessions/${id}/progress/`);
    return response.data;
  },

  // Завершить сессию (возвращает результат + разбор)
  finishSession: async (id: string | number): Promise<FinishResponse> => {
    const response = await api.post(`/testengine/sessions/${id}/finish/`);
    return response.data;
  },

  // Разбор завершённой сессии (вопросы с правильными ответами)
  getSessionReview: async (id: string | number): Promise<SessionQuestionReview[]> => {
    const response = await api.get(`/testengine/sessions/${id}/review/`);
    return response.data.results || response.data;
  },

  // Синхронизация (bulk-ответы, для оффлайн режима)
  syncSession: async (
    id: string | number,
    answers: { question: number; selected_option: string; time_spent_seconds?: number }[]
  ): Promise<any> => {
    const response = await api.post(`/testengine/sessions/${id}/sync/`, { answers });
    return response.data;
  },

  // Результаты (история)
  getMyResults: async (): Promise<TestResult[]> => {
    const response = await api.get('/testengine/results/my-results/');
    return response.data.results || response.data;
  },

  getResult: async (id: string | number): Promise<TestResult> => {
    const response = await api.get(`/testengine/results/${id}/`);
    return response.data;
  },

  // Legacy: next-question (ещё работает на бэке, оставляем как fallback)
  getNextQuestion: async (id: string | number): Promise<SessionQuestion> => {
    const response = await api.get(`/testengine/sessions/${id}/next-question/`);
    return response.data;
  },
};
