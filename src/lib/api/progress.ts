import { api } from '../api';

export interface XPSummary {
  total_xp: number;
  level: number;
  next_level_xp: number;
  progress_percent: number;
}

export interface XPTransaction {
  id: number;
  amount: number;
  reason: string;
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
  full_name: string;
  xp: number;
  is_current_user: boolean;
}

export interface ReviewCard {
  id: number;
  question_id: number;
  question_text: string;
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
    return response.data;
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
    return response.data;
  },

  getAllReviews: async (): Promise<ReviewCard[]> => {
    const response = await api.get('/progress/reviews/');
    return response.data;
  },

  submitReview: async (id: number, quality: number): Promise<ReviewCard> => {
    const response = await api.post(`/progress/reviews/${id}/submit/`, { quality });
    return response.data;
  }
};
