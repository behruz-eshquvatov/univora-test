import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { useLanguageStore } from '../store/useLanguageStore';

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

// Response Interceptor: Handle 401s and refresh globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) throw new Error('No refresh token available');
        
        const response = await axios.post(`${baseURL}/api/refresh/`, {
          refresh: refreshToken
        });
        
        const newAccess = response.data.access;
        const newRefresh = response.data.refresh || refreshToken; 
        
        useAuthStore.getState().setTokens(newAccess, newRefresh);
        
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
