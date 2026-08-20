import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';

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
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  
  // Actions
  login: (user: User, accessToken: string, refreshToken?: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
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
          // Attempt to notify backend of logout
          if (get().refreshToken) {
            await api.post('/api/logout/', { refresh: get().refreshToken }).catch(() => {});
          }
        } finally {
          // Always clear local state regardless of backend response
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
        }
      },

      fetchUser: async () => {
        try {
          if (!get().accessToken) return;
          const response = await api.get('/api/auth/me/');
          set({ user: response.data });
        } catch (error) {
          console.error("Failed to fetch user data", error);
          // Don't auto-logout here, let the interceptor handle 401s if it's an auth issue
        }
      }
    }),
    {
      name: 'auth-storage',
    }
  )
);
