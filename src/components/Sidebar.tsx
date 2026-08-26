import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, Bot, BarChart2, LogOut, Flame, GraduationCap, Globe, Moon, Crown, History, User } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import SettingsModal from './SettingsModal';

export default function Sidebar() {
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'profile' | 'payments'>('profile');
  const menuRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'Главная', path: '/dashboard', icon: Home },
    { name: 'Тесты', path: '/tests', icon: FileText },
    { name: 'AI Наставник', path: '/mentor', icon: Bot },
    { name: 'Прогресс', path: '/progress', icon: BarChart2 },
  ];

  const displayName = user?.full_name || user?.name || 'Гость';
  const initial = displayName.charAt(0).toUpperCase();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsSettingsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openSettings = (tab: 'profile' | 'payments') => {
    setSettingsTab(tab);
    setIsSettingsModalOpen(true);
    setIsSettingsMenuOpen(false);
  };

  return (
    <>
      {/* Sidebar */}
      <aside className={`
        hidden md:flex fixed top-4 bottom-4 left-4 z-50
        bg-white dark:bg-dark-surface rounded-3xl border border-slate-100 dark:border-dark-border shadow-xl shadow-slate-200/40 dark:shadow-[0_4px_25px_rgba(0,0,0,0.6)] dark:shadow-black/60
        flex-col
        transition-all duration-300 ease-in-out
        w-[88px] hover:w-72 group
      `}>
        {/* Logo */}
        <div className="px-5 py-6 flex items-center gap-3 overflow-hidden shrink-0">
          <div className="bg-violet-600 rounded-2xl shadow-lg shadow-violet-500/20 shrink-0 flex items-center justify-center w-12 h-12">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="font-extrabold text-2xl text-slate-800 dark:text-dark-text-main tracking-tight opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-300">
            Univora
          </span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-5 py-2 flex flex-col gap-2 overflow-x-hidden overflow-y-auto no-scrollbar">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`
                  flex items-center gap-3 p-2 rounded-2xl font-bold transition-all w-full overflow-hidden shrink-0
                  ${isActive 
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/20' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-dark-text-muted dark:hover:bg-dark-bg dark:hover:text-dark-text-main'
                  }
                `}
              >
                <div className="shrink-0 flex items-center justify-center w-8 h-8">
                  <link.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 dark:text-dark-text-muted'}`} />
                </div>
                <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-300">
                  {link.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User Settings Popover Base */}
        <div className="px-5 py-6 mt-auto border-t border-slate-100 dark:border-dark-border relative shrink-0" ref={menuRef}>
          <div 
            onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
            className="flex items-center gap-3 cursor-pointer overflow-hidden w-full"
          >
            {(user?.avatar || user?.avatar_url) ? (
              <img src={user.avatar || user.avatar_url} alt={displayName} className="w-12 h-12 rounded-2xl object-cover shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
                <span className="font-extrabold text-violet-700">{initial}</span>
              </div>
            )}
            <div className="flex-1 min-w-0 opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-300">
              <p className="font-bold text-slate-800 dark:text-dark-text-main text-sm truncate">{displayName}</p>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs font-bold text-slate-500 dark:text-dark-text-muted">
                <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                <span>{useAuthStore((state) => state.streak)} дн.</span>
              </div>
            </div>
          </div>

          {/* Popover Menu */}
          {isSettingsMenuOpen && (
            <div className="absolute bottom-[calc(100%+8px)] left-[calc(100%+8px)] w-64 bg-white dark:bg-dark-surface border border-slate-100 dark:border-dark-border shadow-xl dark:shadow-[0_10px_30px_rgba(0,0,0,0.6)] dark:shadow-black/60 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 z-50">
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-1">Профиль</div>
                
                <button onClick={() => openSettings('profile')} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-dark-bg transition-colors text-slate-700 dark:text-dark-text-main font-medium">
                  <User className="w-4 h-4 text-slate-400 dark:text-dark-text-muted" />
                  Мой профиль
                </button>

                <button onClick={() => { navigate('/plans'); setIsSettingsMenuOpen(false); }} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-dark-bg transition-colors text-slate-700 dark:text-dark-text-main font-medium">
                  <div className="flex items-center gap-3">
                    <Crown className="w-4 h-4 text-violet-500" />
                    Тарифы и подписка
                  </div>
                  <span className="text-xs font-bold bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full">Pro</span>
                </button>

                <button onClick={() => openSettings('payments')} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-dark-bg transition-colors text-slate-700 dark:text-dark-text-main font-medium">
                  <History className="w-4 h-4 text-slate-400 dark:text-dark-text-muted" />
                  История платежей
                </button>

                <div className="h-px bg-slate-100 dark:bg-dark-border my-2 mx-4"></div>
                <div className="px-4 py-2 text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-1">Система</div>

                <div className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-dark-bg transition-colors cursor-pointer text-slate-700 dark:text-dark-text-main font-medium">
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-slate-400 dark:text-dark-text-muted" />
                    Язык
                  </div>
                  <select className="bg-transparent font-medium text-slate-500 dark:text-dark-text-muted outline-none cursor-pointer">
                    <option value="ru">Русский</option>
                    <option value="uz">O'zbekcha</option>
                  </select>
                </div>

                <div 
                  onClick={() => setIsDark(!isDark)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-dark-bg transition-colors cursor-pointer text-slate-700 dark:text-dark-text-main font-medium"
                >
                  <div className="flex items-center gap-3">
                    <Moon className="w-4 h-4 text-slate-400 dark:text-dark-text-muted" />
                    Темная тема
                  </div>
                  <div 
                    className={`w-9 h-5 rounded-full p-0.5 flex items-center transition-colors duration-200 ${isDark ? 'bg-violet-600' : 'bg-slate-200 dark:bg-dark-border'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${isDark ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </div>
                </div>

                <div className="h-px bg-slate-100 dark:bg-dark-border my-2 mx-4"></div>

                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 transition-colors font-medium">
                  <LogOut className="w-4 h-4" />
                  Выйти
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
        initialTab={settingsTab}
      />
    </>
  );
}
