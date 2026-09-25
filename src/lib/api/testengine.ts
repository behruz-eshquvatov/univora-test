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

/** Один вопрос сессии (после завершения — есть правильный ответ и пояснение). */
export interface SessionQuestionReview extends SessionQuestion {
  correct_option: string;
  selected_option: string | null;
  is_correct: boolean;
  time_spent_seconds: number;
  hint?: string | null;
  explanation?: string | null;
}

export interface ExplanationAccess {
  can_access: boolean;
  code?: string;
  reason?: string;
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
  explanation_access?: ExplanationAccess;
}

export interface AvailableCountsResponse {
  tiers: number[];
  is_available: boolean;
  reason: string | null;
  min_required: number;
  access: {
    can_start: boolean;
    daily_topic_limit: number | null;
    topics_used_today: number;
    topics_remaining_today: number | null;
    reset_at: string | null;
    upgrade_required: boolean;
  };
  entitlements?: any;
  topic?: any;
  subject?: any;
  grade?: any;
}

export interface MyLimitsResponse {
  daily_topic_limit: number | null;
  topics_used_today: number;
  topics_remaining_today: number | null;
  reset_at: string | null;
  question_count_tiers: number[];
  entitlements?: any;
}

export interface MockExamSubjectItem {
  session_id: number;
  order: number;
  subject: SubjectMinimal;
  question_count: number;
  is_finished: boolean;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  total_score: number;
}

export interface MockExamSummary {
  total_questions: number;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  total_score: number;
  accuracy_percent: number;
}

export interface MockExam {
  id: number;
  time_limit_seconds: number;
  expires_at: string;
  seconds_left: number;
  finished_at: string | null;
  is_finished: boolean;
  auto_finished: boolean;
  subjects: MockExamSubjectItem[];
  summary: MockExamSummary;
  created_at?: string;
}

// ─── API ────────────────────────────────────────────────────────────────────

export const testengineApi = {
  // Available counts for a topic
  getAvailableCounts: async (topicId: number | string): Promise<AvailableCountsResponse> => {
    const response = await api.get(`/testengine/topics/${topicId}/available-counts/`);
    return response.data;
  },

  // My limits (daily topic limits status)
  getMyLimits: async (): Promise<MyLimitsResponse> => {
    const response = await api.get('/testengine/my-limits/');
    return response.data;
  },

  // Список сессий (пагинированный)
  getSessions: async (): Promise<TestSession[]> => {
    const response = await api.get('/testengine/sessions/');
    return response.data.results || response.data;
  },

  // Создать новую сессию
  startSession: async (
    subjectId: number,
    options?: { question_count?: number; count?: number; mode?: string; topics?: number[] } | number
  ): Promise<TestSessionDetail> => {
    const question_count = typeof options === 'number' ? options : (options?.question_count || options?.count);
    const mode = typeof options === 'object' ? options?.mode : 'practice';
    const topics = typeof options === 'object' ? options?.topics : undefined;
    const response = await api.post('/testengine/sessions/', {
      subject: subjectId,
      mode: mode || 'practice',
      question_count: question_count,
      topics: topics,
    });
    return response.data;
  },

  // Запуск теста по конкретной теме
  startTopicTest: async (
    topicId: number,
    options?: { count?: number; mode?: string } | number
  ): Promise<TestSessionDetail> => {
    const count = typeof options === 'number' ? options : options?.count;
    const mode = typeof options === 'object' ? options?.mode : 'practice';
    const response = await api.post(`/testengine/topics/${topicId}/start-test/`, {
      count: count,
      mode: mode || 'practice',
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

  // ─── Guest API ─────────────────────────────────────────────────────────────
  getGuestTopics: async (params?: { subject?: number | string; grade?: number | string }): Promise<any[]> => {
    const response = await api.get('/testengine/guest/topics/', { params });
    return response.data.results || response.data;
  },

  startGuestTest: async (topicId: number): Promise<{
    token: string;
    question_count: number;
    questions: TestQuestion[];
    topic: any;
    subject: any;
    is_guest: boolean;
    notice?: string;
  }> => {
    const response = await api.post('/testengine/guest/start/', { topic: topicId });
    return response.data;
  },

  submitGuestTest: async (
    token: string,
    answers: { question: number; selected_option: string; time_spent_seconds?: number }[]
  ): Promise<{
    requires_registration: boolean;
    results_hidden: boolean;
    title: string;
    detail: string;
    actions: { register: string; later: string };
    total_questions: number;
    answered_count: number;
    code: string;
  }> => {
    const response = await api.post('/testengine/guest/submit/', { token, answers });
    return response.data;
  },

  // ─── DTM Mock Exams (Blok imtihoni) ───────────────────────────────────────
  createMockExam: async (subjects: number[], question_count: number): Promise<MockExam> => {
    const response = await api.post('/testengine/mock-exams/', { subjects, question_count });
    return response.data;
  },

  getMockExam: async (id: number | string): Promise<MockExam> => {
    const response = await api.get(`/testengine/mock-exams/${id}/`);
    return response.data;
  },

  finishMockExam: async (id: number | string): Promise<MockExam> => {
    const response = await api.post(`/testengine/mock-exams/${id}/finish/`);
    return response.data;
  },

  getMockExams: async (page: number = 1): Promise<{ count: number; results: MockExam[] }> => {
    const response = await api.get('/testengine/mock-exams/', { params: { page } });
    return response.data;
  },

  // ─── Mistakes Test ───────────────────────────────────────────────────────
  startMistakesTest: async (count?: number): Promise<TestSession> => {
    const response = await api.post('/testengine/mistakes/start-test/', count ? { count } : {});
    return response.data;
  },

  // ─── Results Export ──────────────────────────────────────────────────────
  exportResults: async (type: 'xlsx' | 'pdf' = 'xlsx'): Promise<Blob> => {
    const response = await api.get('/testengine/results/export/', {
      params: { type },
      responseType: 'blob',
    });
    return response.data;
  },
};
