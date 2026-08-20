import { api } from '../api';

export interface Plan {
  id: number;
  name: string;
  description: string;
  price: string;
  duration_days: number;
  features: string[]; // Mocked as array if backend sends string
}

export interface Subscription {
  id: number;
  user: number;
  plan: Plan;
  starts_at: string;
  expires_at: string;
  status: 'active' | 'expired' | 'cancelled';
}

export interface Payment {
  id: number;
  user: number;
  amount: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
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
  getCurrentSubscription: async (): Promise<Subscription | null> => {
    try {
      const response = await api.get('/billing/subscriptions/current/');
      if (response.data && response.data.has_active_subscription === false) {
        return null;
      }
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // No active subscription
      }
      throw error;
    }
  },

  cancelSubscription: async (id: number): Promise<void> => {
    await api.post(`/billing/subscriptions/${id}/cancel/`);
  },

  selectPlan: async (planId: number): Promise<Subscription> => {
    const response = await api.post('/billing/subscriptions/', { plan_id: planId });
    return response.data;
  },

  getPayments: async (): Promise<Payment[]> => {
    const response = await api.get('/billing/payments/');
    return response.data;
  },

  createPayment: async (data: { plan_id: number; amount: number }): Promise<Payment> => {
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
    await api.post(`/billing/payments/${id}/approve/`);
  },

  rejectPayment: async (id: number): Promise<void> => {
    await api.post(`/billing/payments/${id}/reject/`);
  },
};
