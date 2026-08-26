import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';

const languages = [
  { code: 'uz', label: 'O\'zbekcha' },
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' }
] as const;

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { language, setLanguage } = useLanguageStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLangLabel = languages.find(l => l.code === language)?.label || 'O\'zbekcha';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const changeLanguage = (code: 'uz' | 'ru' | 'en') => {
    i18n.changeLanguage(code);
    setLanguage(code);
    setIsOpen(false);
    // Reload page to re-fetch data with new language header, or just let components refetch dynamically
    window.location.reload();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border text-slate-500 hover:text-violet-600 dark:text-dark-text-muted dark:hover:text-violet-400 transition-colors"
      >
        <Globe className="w-5 h-5 sm:w-6 sm:h-6" />
        <span className="hidden sm:inline-block font-bold text-sm">{currentLangLabel}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-40 bg-white dark:bg-dark-surface rounded-2xl shadow-xl border border-slate-200 dark:border-dark-border z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
          <div className="flex flex-col">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={(e) => {
                  e.stopPropagation();
                  changeLanguage(lang.code);
                }}
                className={`text-left px-4 py-3 text-sm font-bold transition-colors ${
                  language === lang.code
                    ? 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400'
                    : 'text-slate-700 hover:bg-slate-50 dark:text-dark-text-main dark:hover:bg-dark-border/30'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
