import { create } from 'zustand';
import type { Question } from '../lib/mockData';

interface QuizState {
  direction: string | null;
  selectedSubjects: string[];
  generatedQuestions: Question[];
  setDirection: (direction: string) => void;
  toggleSubject: (subject: string) => void;
  setGeneratedQuestions: (questions: Question[]) => void;
  clearQuiz: () => void;
}

export const useQuizStore = create<QuizState>((set) => ({
  direction: null,
  selectedSubjects: [],
  generatedQuestions: [],
  
  setDirection: (direction) => set({ direction }),
  
  toggleSubject: (subject) => set((state) => {
    if (state.selectedSubjects.includes(subject)) {
      return { selectedSubjects: state.selectedSubjects.filter(s => s !== subject) };
    }
    if (state.selectedSubjects.length >= 5) {
      return state; // max 5 subjects
    }
    return { selectedSubjects: [...state.selectedSubjects, subject] };
  }),
  
  setGeneratedQuestions: (questions) => set({ generatedQuestions: questions }),
  
  clearQuiz: () => set({ direction: null, selectedSubjects: [], generatedQuestions: [] })
}));
