import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'uz' | 'ru' | 'en';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'uz', // Default language
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'univora-language-storage',
    }
  )
);
