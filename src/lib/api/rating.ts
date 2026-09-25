import { api } from '../api';

export interface LeagueParticipant {
  rank: number;
  user_id: number;
  nickname: string;
  avatar_url?: string;
  xp: number;
  xp_this_week?: number;
  is_current_user: boolean;
  zone?: 'promotion' | 'safe' | 'demotion';
}

export interface LeagueGroup {
  has_league: boolean;
  tier: number;
  tier_name: string;
  league_size: number;
  promote_count: number;
  demote_count: number;
  my_rank: number;
  my_zone: 'promotion' | 'safe' | 'demotion';
  standings: LeagueParticipant[];
}

export interface LeagueTierInfo {
  tier: number;
  name: string;
  icon?: string;
  min_xp?: number;
}

export interface LeaderboardResult {
  period: string;
  results: LeagueParticipant[];
  my_position?: {
    rank: number;
    total_participants: number;
    in_top: boolean;
  };
}

export interface WeakTopic {
  topic_id: number;
  topic_name: string;
  subject_id?: number;
  subject_name: string;
  grade_id?: number;
  grade_name?: string;
  accuracy_percentage: number;
  mistake_count: number;
  total_attempted?: number;
  can_start_test: boolean;
}

export interface UserRatingStats {
  stars: number;
  xp: number;
  rank: number;
  accuracy_percentage: number;
  completion_percentage: number;
}

export const ratingApi = {
  getLeague: async (): Promise<LeagueGroup> => {
    const response = await api.get('/rating/league/');
    return response.data;
  },

  getLeagueTiers: async (): Promise<LeagueTierInfo[]> => {
    const response = await api.get('/rating/league/tiers/');
    return response.data.results || response.data;
  },

  getLeagueHistory: async (): Promise<any[]> => {
    const response = await api.get('/rating/league/history/');
    return response.data.results || response.data;
  },

  getLeaderboard: async (period: string = 'weekly'): Promise<LeaderboardResult> => {
    const response = await api.get(`/rating/leaderboard/${period}/`);
    return response.data;
  },

  getWeakTopics: async (): Promise<WeakTopic[]> => {
    const response = await api.get('/rating/weak-topics/');
    return response.data.results || response.data;
  },

  getMyRatingInfo: async (): Promise<UserRatingStats> => {
    const response = await api.get('/rating/me/');
    return response.data;
  }
};
