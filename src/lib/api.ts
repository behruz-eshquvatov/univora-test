import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { useLimitStore } from '../store/useLimitStore';

const baseURL = 'http://localhost:8000';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach token and language automatically
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    const language = useLanguageStore.getState().language;
    
    if (config.headers) {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      config.headers['X-Language'] = language;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401s and limit/upgrade errors globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isGuest = useAuthStore.getState().isGuest;

    // Limit/Upgrade Error Check
    if (error.response?.data) {
      const data = error.response.data;
      const limitCodes = [
        'upgrade_required',
        'mistake_test_limit_reached',
        'review_card_limit_reached',
        'streak_freeze_limit_reached',
        'exam_mode_unavailable',
        'question_count_exceeded',
      ];

      const isUpgradeLimit = Boolean(
        data.upgrade_required ||
        data.code === 'upgrade_required' ||
        limitCodes.includes(data.code)
      );

      if (isUpgradeLimit) {
        if (data.detail && !originalRequest?.url?.includes('/billing/plan/')) {
          useLimitStore.getState().showLimitModal({
            reason: data.detail,
            resetAt: data.reset_at || null,
          });
        }
      }
    }

    // Guest users don't have auth tokens, ignore 401 refresh logic
    if (isGuest) {
      return Promise.reject(error);
    }
    
    // Avoid attempting token refresh on auth endpoints to prevent loops
    if (originalRequest?.url?.includes('/api/auth/')) {
      if (originalRequest.url?.includes('/api/auth/refresh/')) {
        useAuthStore.getState().clearAuth();
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) throw new Error('No refresh token available');
        
        const response = await axios.post(`${baseURL}/api/auth/refresh/`, {
          refresh: refreshToken
        });
        
        const newAccess = response.data.access;
        const newRefresh = response.data.refresh || refreshToken; 
        
        useAuthStore.getState().setTokens(newAccess, newRefresh);
        
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().clearAuth();
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

