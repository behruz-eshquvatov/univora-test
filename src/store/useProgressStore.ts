import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProgressState {
  xp: number;
  streak: number;
  reviewsToday: number;
  addXp: (amount: number) => void;
  decrementReviewsToday: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      xp: 2450, // Starting mock value
      streak: 5,
      reviewsToday: 8,
      addXp: (amount) => set((state) => ({ xp: state.xp + amount })),
      decrementReviewsToday: () => 
        set((state) => ({ 
          reviewsToday: Math.max(0, state.reviewsToday - 1) 
        })),
    }),
    {
      name: 'progress-storage', // persists to local storage
    }
  )
);
