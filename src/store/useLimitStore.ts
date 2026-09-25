import { create } from 'zustand';

interface LimitState {
  isOpen: boolean;
  title?: string;
  reason?: string;
  resetAt?: string | null;
  showLimitModal: (data?: { title?: string; reason?: string; resetAt?: string | null }) => void;
  closeLimitModal: () => void;
}

export const useLimitStore = create<LimitState>((set) => ({
  isOpen: false,
  title: undefined,
  reason: undefined,
  resetAt: undefined,

  showLimitModal: (data) =>
    set({
      isOpen: true,
      title: data?.title,
      reason: data?.reason,
      resetAt: data?.resetAt,
    }),

  closeLimitModal: () =>
    set({
      isOpen: false,
      title: undefined,
      reason: undefined,
      resetAt: undefined,
    }),
}));
