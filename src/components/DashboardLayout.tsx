import { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, Bot, BarChart2, X, LogOut, Flame, GraduationCap, Globe, Moon, Crown, History, User } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import SettingsModal from './SettingsModal';

export default function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'profile' | 'payments'>('profile');
  const menuRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

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
    <div className="min-h-screen bg-transparent flex flex-col md:flex-row relative">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-100 p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="bg-violet-600 p-2 rounded-xl">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-lg text-slate-800 tracking-tight">TestYourself</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed top-4 bottom-4 left-4 z-50
        bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40
        flex flex-col
        transition-all duration-300 ease-in-out
        w-[88px] hover:w-72 group
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-[150%] md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="px-5 py-6 flex items-center gap-3 overflow-hidden shrink-0">
          <div className="bg-violet-600 rounded-2xl shadow-lg shadow-violet-500/20 shrink-0 flex items-center justify-center w-12 h-12">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <span className="font-extrabold text-2xl text-slate-800 tracking-tight opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-300">
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
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 p-2 rounded-2xl font-bold transition-all w-full overflow-hidden shrink-0
                  ${isActive 
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/20' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
              >
                <div className="shrink-0 flex items-center justify-center w-8 h-8">
                  <link.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                </div>
                <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-300">
                  {link.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User Settings Popover Base */}
        <div className="px-5 py-6 mt-auto border-t border-slate-100 relative shrink-0" ref={menuRef}>
          <div 
            onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
            className="flex items-center gap-3 cursor-pointer overflow-hidden w-full"
          >
            {(user?.avatar || user?.avatar_url) ? (
              <img src={user.avatar || user.avatar_url} alt={displayName} className="w-12 h-12 rounded-2xl object-cover shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center shrink-0">
                <span className="font-extrabold text-violet-700">{initial}</span>
              </div>
            )}
            <div className="flex-1 min-w-0 opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-300">
              <p className="font-bold text-slate-800 text-sm truncate">{displayName}</p>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs font-bold text-slate-500">
                <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                <span>12 дн.</span>
              </div>
            </div>
          </div>

          {/* Popover Menu */}
          {isSettingsMenuOpen && (
            <div className="absolute bottom-[calc(100%+8px)] left-[calc(100%+8px)] w-64 bg-white border border-slate-100 shadow-xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 z-50">
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Профиль</div>
                
                <button onClick={() => openSettings('profile')} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-slate-700 font-medium">
                  <User className="w-4 h-4 text-slate-400" />
                  Мой профиль
                </button>

                <button onClick={() => { navigate('/plans'); setIsSettingsMenuOpen(false); }} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors text-slate-700 font-medium">
                  <div className="flex items-center gap-3">
                    <Crown className="w-4 h-4 text-violet-500" />
                    Тарифы и подписка
                  </div>
                  <span className="text-xs font-bold bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full">Pro</span>
                </button>

                <button onClick={() => openSettings('payments')} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-slate-700 font-medium">
                  <History className="w-4 h-4 text-slate-400" />
                  История платежей
                </button>

                <div className="h-px bg-slate-100 my-2 mx-4"></div>
                <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Система</div>

                <div className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer text-slate-700 font-medium">
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-slate-400" />
                    Язык
                  </div>
                  <select className="bg-transparent font-medium text-slate-500 outline-none cursor-pointer">
                    <option value="ru">Русский</option>
                    <option value="uz">O'zbekcha</option>
                  </select>
                </div>

                <div className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer text-slate-700 font-medium">
                  <div className="flex items-center gap-3">
                    <Moon className="w-4 h-4 text-slate-400" />
                    Темная тема
                  </div>
                  <div className="w-9 h-5 rounded-full p-1 flex items-center transition-colors bg-slate-200 justify-start">
                    <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm"></div>
                  </div>
                </div>

                <div className="h-px bg-slate-100 my-2 mx-4"></div>

                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-rose-50 text-rose-600 transition-colors font-medium">
                  <LogOut className="w-4 h-4" />
                  Выйти
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 md:pl-[120px] md:pr-4 md:py-4 transition-all duration-300">
        <Outlet />
      </main>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
        initialTab={settingsTab}
      />
    </div>
  );
}
