import { useState, useEffect, useRef } from 'react';
import { GraduationCap, Flame, LogOut, Globe, Moon, Crown, History, User } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import SettingsModal from './SettingsModal';
import NotificationBell from './NotificationBell';
import LanguageSwitcher from './LanguageSwitcher';

export default function MobileHeader() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'profile' | 'payments'>('profile');
  const [isVisible, setIsVisible] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const openSettings = (tab: 'profile' | 'payments') => {
    setSettingsTab(tab);
    setIsSettingsModalOpen(true);
    setIsMenuOpen(false);
  };

  const displayName = user?.full_name || user?.name || 'Гость';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <>
      <header className={`md:hidden bg-white/90 dark:bg-dark-surface/90 backdrop-blur-md border-b border-slate-100 dark:border-dark-border shadow-[0_4px_25px_rgba(0,0,0,0.05)] dark:shadow-black/60 p-4 flex items-center justify-between fixed top-0 left-0 right-0 z-40 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="flex items-center gap-2">
          <div className="bg-violet-600 p-2 rounded-xl">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="flex items-center gap-4" ref={menuRef}>
          {/* Streak icon */}
          <div className="flex items-center gap-1 font-bold text-slate-600 dark:text-dark-text-muted text-base">
            <Flame className="w-6 h-6 text-orange-500 fill-orange-500" />
            <span>{useAuthStore((state) => state.streak)}</span>
          </div>

          <LanguageSwitcher />
          <NotificationBell />

          <div className="relative cursor-pointer" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {(user?.avatar || user?.avatar_url) ? (
              <img src={user.avatar || user.avatar_url} alt={displayName} className="w-10 h-10 rounded-full object-cover shadow-sm" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center shadow-sm">
                <span className="font-extrabold text-violet-700 text-sm">{initial}</span>
              </div>
            )}

            {isMenuOpen && (
              <div className="absolute top-12 right-0 w-64 bg-white dark:bg-dark-surface border border-slate-100 dark:border-dark-border shadow-xl dark:shadow-[0_10px_30px_rgba(0,0,0,0.6)] dark:shadow-black/60 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                <div className="p-4 border-b border-slate-100 dark:border-dark-border flex items-center gap-3">
                  {(user?.avatar || user?.avatar_url) ? (
                    <img src={user.avatar || user.avatar_url} alt={displayName} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
                      <span className="font-extrabold text-violet-700 text-sm">{initial}</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 dark:text-dark-text-main text-sm truncate">{displayName}</p>
                    <p className="text-xs text-slate-500 dark:text-dark-text-muted truncate">{user?.email}</p>
                  </div>
                </div>

                <div className="py-2">
                  <button onClick={() => openSettings('profile')} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-dark-bg transition-colors text-slate-700 dark:text-dark-text-main font-medium text-sm">
                    <User className="w-4 h-4 text-slate-400 dark:text-dark-text-muted" />
                    Мой профиль
                  </button>

                  <button onClick={() => { navigate('/plans'); setIsMenuOpen(false); }} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-dark-bg transition-colors text-slate-700 dark:text-dark-text-main font-medium text-sm">
                    <div className="flex items-center gap-3">
                      <Crown className="w-4 h-4 text-violet-500" />
                      Тарифы
                    </div>
                    <span className="text-[10px] font-bold bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full">Pro</span>
                  </button>

                  <button onClick={() => openSettings('payments')} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-dark-bg transition-colors text-slate-700 dark:text-dark-text-main font-medium text-sm">
                    <History className="w-4 h-4 text-slate-400 dark:text-dark-text-muted" />
                    История платежей
                  </button>

                  <div className="h-px bg-slate-100 dark:bg-dark-border my-2 mx-4"></div>

                  <div className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-dark-bg transition-colors cursor-pointer text-slate-700 dark:text-dark-text-main font-medium text-sm">
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-slate-400 dark:text-dark-text-muted" />
                      Язык
                    </div>
                    <select className="bg-transparent font-medium text-slate-500 dark:text-dark-text-muted outline-none cursor-pointer text-sm">
                      <option value="ru">Рус</option>
                      <option value="uz">O'zb</option>
                    </select>
                  </div>

                  <div 
                    onClick={() => setIsDark(!isDark)}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-dark-bg transition-colors cursor-pointer text-slate-700 dark:text-dark-text-main font-medium text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <Moon className="w-4 h-4 text-slate-400 dark:text-dark-text-muted" />
                      Темная тема
                    </div>
                    <div className={`w-8 h-4 rounded-full p-0.5 flex items-center transition-colors duration-200 ${isDark ? 'bg-violet-600' : 'bg-slate-200 dark:bg-dark-border'}`}>
                      <div className={`w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${isDark ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 dark:bg-dark-border my-2 mx-4"></div>

                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 transition-colors font-medium text-sm">
                    <LogOut className="w-4 h-4" />
                    Выйти
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
        initialTab={settingsTab}
      />
    </>
  );
}
