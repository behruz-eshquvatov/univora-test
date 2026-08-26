import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';
import { progressApi } from '../lib/api/progress';

interface User {
  id: string | number;
  name?: string; // fallback
  full_name?: string;
  email: string;
  avatar?: string;
  avatar_url?: string;
  role: 'student' | 'mentor' | 'admin';
  xp_total?: number;
}

interface AuthState {
  user: User | null;
  streak: number;
  xpSummary: { xp_total: number, xp_today: number, xp_this_week: number } | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  
  // Actions
  login: (user: User, accessToken: string, refreshToken?: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  fetchStreak: () => Promise<void>;
  fetchXpSummary: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      streak: 0,
      xpSummary: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: (user, accessToken, refreshToken) => set({ 
        user, 
        accessToken, 
        refreshToken: refreshToken || get().refreshToken,
        isAuthenticated: true 
      }),
      
      setTokens: (accessToken, refreshToken) => set({
        accessToken,
        refreshToken
      }),

      logout: async () => {
        try {
          if (get().refreshToken) {
            await api.post('/api/logout/', { refresh: get().refreshToken }).catch(() => {});
          }
        } finally {
          set({ user: null, streak: 0, xpSummary: null, accessToken: null, refreshToken: null, isAuthenticated: false });
        }
      },

      fetchUser: async () => {
        try {
          if (!get().accessToken) return;
          const response = await api.get('/api/auth/me/');
          set({ user: response.data });
        } catch (error) {
          console.error("Failed to fetch user data", error);
        }
      },

      fetchStreak: async () => {
        try {
          if (!get().accessToken) return;
          const streakData = await progressApi.getStreak();
          set({ streak: streakData.current_streak });
        } catch (error) {
          console.error("Failed to fetch streak", error);
        }
      },

      fetchXpSummary: async () => {
        try {
          if (!get().accessToken) return;
          const summary = await progressApi.getXpSummary();
          set({ xpSummary: summary });
        } catch (error) {
          console.error("Failed to fetch xp summary", error);
        }
      }
    }),
    {
      name: 'auth-storage',
    }
  )
);
