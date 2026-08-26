import { api } from '../api';

export interface NotificationLog {
  id: number;
  type: string;
  type_display: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface Announcement {
  id: number;
  title: string;
  message: string;
  created_by: number;
  created_by_email: string;
  is_sent: boolean;
  sent_at: string | null;
  recipients_count: number;
  created_at: string;
}

export const notificationsApi = {
  // --- Student ---
  getMyNotifications: async (): Promise<NotificationLog[]> => {
    const response = await api.get('/notifications/my/');
    return response.data.results || response.data;
  },

  getUnreadCount: async (): Promise<{ unread_count: number }> => {
    const response = await api.get('/notifications/unread-count/');
    return response.data;
  },

  markAllAsRead: async (): Promise<void> => {
    await api.post('/notifications/mark-read/');
  },

  markAsRead: async (id: number): Promise<void> => {
    await api.post(`/notifications/mark-read/${id}/`);
  },

  // --- Admin ---
  getAnnouncements: async (): Promise<Announcement[]> => {
    const response = await api.get('/notifications/announcements/');
    return response.data.results || response.data;
  },

  createAnnouncement: async (data: { title: string; message: string }): Promise<Announcement> => {
    const response = await api.post('/notifications/announcements/', data);
    return response.data;
  },
};
