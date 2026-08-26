import { api } from '../api';

export interface XPSummary {
  xp_total: number;
  xp_today: number;
  xp_this_week: number;
}

export interface XPTransaction {
  id: number;
  amount: number;
  source: string;
  source_display: string;
  description: string;
  created_at: string;
}

export interface Streak {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
  is_active: boolean;
  freezes_available: number;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  nickname: string;
  avatar_url?: string;
  xp_this_week: number;
  is_current_user: boolean;
}

export interface ReviewCard {
  id: number;
  question_id: number;
  question_text: string;
  options: Record<string, string>;
  correct_option: string;
  next_review_date: string;
  interval_days: number;
  ease_factor: number;
}

export const progressApi = {
  getXpSummary: async (): Promise<XPSummary> => {
    const response = await api.get('/progress/xp/summary/');
    return response.data;
  },

  getXpTransactions: async (): Promise<XPTransaction[]> => {
    const response = await api.get('/progress/xp/transactions/');
    return response.data.results || response.data;
  },

  getStreak: async (): Promise<Streak> => {
    const response = await api.get('/progress/streak/');
    return response.data;
  },

  freezeStreak: async (): Promise<Streak> => {
    const response = await api.post('/progress/streak/freeze/');
    return response.data;
  },

  getWeeklyLeaderboard: async (): Promise<LeaderboardEntry[]> => {
    const response = await api.get('/progress/leaderboard/weekly/');
    return response.data;
  },

  getTodayReviews: async (): Promise<ReviewCard[]> => {
    const response = await api.get('/progress/reviews/today/');
    return response.data.results || response.data; // fallback to response.data if it ever changes
  },

  getAllReviews: async (): Promise<ReviewCard[]> => {
    const response = await api.get('/progress/reviews/');
    return response.data.results || response.data;
  },

  submitReview: async (id: number, is_correct: boolean, response_time: number): Promise<ReviewCard> => {
    const response = await api.post(`/progress/reviews/${id}/submit/`, { is_correct, response_time });
    return response.data;
  }
};
