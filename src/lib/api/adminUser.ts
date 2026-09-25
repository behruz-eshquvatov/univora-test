import { api } from '../api';

export interface AdminUserListItem {
  id: number;
  email: string;
  full_name: string;
  role: 'student' | 'mentor' | 'admin' | 'support';
  avatar_url: string;
  xp_total: number;
  is_active: boolean;
  is_blocked: boolean;
  blocked_at: string | null;
  blocked_by_email: string | null;
  block_reason: string;
  last_login: string | null;
  created_at: string;
}

export interface AdminUsersStats {
  total: number;
  blocked: number;
  students: number;
  mentors: number;
  pro: number;
}

export interface AdminUsersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminUserListItem[];
  stats: AdminUsersStats;
}

export interface AdminUserDetail extends AdminUserListItem {
  phone_number: string;
  telegram_username: string;
  region: string;
  target_major: string;
  language: string;
  subscription: {
    plan: string;
    plan_id: number;
    expires_at: string;
    days_left: number;
  } | null;
  entitlements: Record<string, any>;
  sessions_total: number;
  sessions_finished: number;
  last_test_at: string | null;
  devices_count: number;
}

export interface AdminUsersQueryParams {
  search?: string;
  role?: 'student' | 'mentor' | 'admin' | 'support';
  is_active?: boolean;
  tier?: 'pro' | 'free';
  ordering?: string;
  page?: number;
  page_size?: number;
}

export const adminUserApi = {
  getUsers: async (params?: AdminUsersQueryParams): Promise<AdminUsersResponse> => {
    const response = await api.get('/dashboard/admin/users/', { params });
    return response.data;
  },

  getUserDetail: async (id: number): Promise<AdminUserDetail> => {
    const response = await api.get(`/dashboard/admin/users/${id}/`);
    return response.data;
  },

  blockUser: async (id: number, reason?: string): Promise<AdminUserListItem> => {
    const response = await api.post(`/dashboard/admin/users/${id}/block/`, { reason });
    return response.data;
  },

  unblockUser: async (id: number): Promise<AdminUserListItem> => {
    const response = await api.post(`/dashboard/admin/users/${id}/unblock/`);
    return response.data;
  },
};
