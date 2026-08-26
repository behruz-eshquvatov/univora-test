import { api } from '../api';

export interface Plan {
  id: number;
  name: string;
  name_ru?: string;
  name_en?: string;
  description: string;
  description_ru?: string;
  description_en?: string;
  price: string;
  duration_days: number;
  features: string[]; // Mocked as array if backend sends string
}

export interface Subscription {
  id: number;
  user: number;
  plan: Plan;
  status: 'active' | 'expired' | 'cancelled';
  status_display: string;
  is_currently_active: boolean;
  starts_at: string;
  expires_at: string;
  days_left: number;
  created_at: string;
}

export interface Payment {
  id: number;
  user: number;
  user_email: string;
  user_full_name: string;
  plan: Plan;
  subscription: number | null;
  provider: string;
  provider_transaction_id: string;
  amount: string;
  amount_display: string;
  status: 'pending' | 'approved' | 'rejected';
  status_display: string;
  contact_phone: string;
  contact_telegram: string;
  note: string;
  rejection_reason: string;
  reviewed_at: string;
  created_at: string;
}

export interface CurrentSubscriptionResponse {
  has_active_subscription: boolean;
  subscription: Subscription | null;
  pending_request: Payment | null;
}

export interface SubscriptionRequestResponse {
  ariza: Payment;
  subscription: Subscription | null;
  auto_activated: boolean;
  message: string;
  admin_telegram: string;
  contact: {
    contact_phone: string;
    contact_telegram: string;
  };
}

export const billingApi = {
  // --- Student & Admin ---
  getPlans: async (): Promise<Plan[]> => {
    const response = await api.get('/billing/plan/');
    return response.data;
  },

  getPlanById: async (id: number): Promise<Plan> => {
    const response = await api.get(`/billing/plan/${id}/`);
    return response.data;
  },

  // --- Student ---
  getCurrentSubscription: async (): Promise<CurrentSubscriptionResponse> => {
    const response = await api.get('/billing/subscriptions/current/');
    return response.data;
  },

  cancelSubscription: async (id: number): Promise<void> => {
    await api.post(`/billing/subscriptions/${id}/cancel/`);
  },

  getPayments: async (): Promise<Payment[]> => {
    const response = await api.get('/billing/payments/');
    return response.data.results || response.data;
  },

  createPayment: async (data: { plan_id: number; amount?: number; contact_phone?: string; contact_telegram?: string; note?: string }): Promise<SubscriptionRequestResponse> => {
    const response = await api.post('/billing/payments/', data);
    return response.data;
  },

  // --- Admin ---
  createPlan: async (data: any): Promise<Plan> => {
    const response = await api.post('/billing/plan/', data);
    return response.data;
  },

  updatePlan: async (id: number, data: any): Promise<Plan> => {
    const response = await api.put(`/billing/plan/${id}/`, data);
    return response.data;
  },

  deletePlan: async (id: number): Promise<void> => {
    await api.delete(`/billing/plan/${id}/`);
  },

  approvePayment: async (id: number): Promise<void> => {
    await api.patch(`/billing/payments/${id}/approve/`);
  },

  rejectPayment: async (id: number, reason?: string): Promise<void> => {
    await api.patch(`/billing/payments/${id}/reject/`, { reason });
  },
};
