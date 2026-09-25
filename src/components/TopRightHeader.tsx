import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Bell, User, Crown, History, Globe, Moon, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { notificationsApi } from '../lib/api/notifications';
import { useTranslation } from 'react-i18next';
import { useLanguageStore } from '../store/useLanguageStore';
import SettingsModal from './SettingsModal';
import { AuthRequiredModal } from './AuthRequiredModal';

export default function TopRightHeader() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, streak, logout, isGuest } = useAuthStore();
  const { language, setLanguage } = useLanguageStore();

  const [unreadCount, setUnreadCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'profile' | 'payments'>('profile');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showAuthRequiredModal, setShowAuthRequiredModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (isGuest) return;
    const fetchUnreadCount = async () => {
      try {
        const data = await notificationsApi.getUnreadCount();
        setUnreadCount(data.unread_count);
      } catch (err) {
        // Quiet fallback
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isGuest]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = user?.full_name || user?.name || 'Гость';
  const initial = displayName.charAt(0).toUpperCase();

  const openSettings = (tab: 'profile' | 'payments') => {
    setSettingsTab(tab);
    setIsSettingsModalOpen(true);
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowLogoutModal(false);
  };

  return (
    <>
      {/* Top Right Floating Container */}
      <header className="hidden md:flex fixed top-4 right-6 z-40 items-center gap-2 h-12 px-3 bg-white/90 dark:bg-dark-surface/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-dark-border shadow-lg shadow-slate-200/50 dark:shadow-black/60 transition-all">
        
        {/* Streak Pill (Hidden in guest mode) */}
        {!isGuest && (
          <div 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/40 text-orange-600 dark:text-orange-400 text-xs font-extrabold cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-950/50 transition-colors"
            onClick={() => navigate('/progress')}
            title="Ketma-ket kunlar / Streak"
          >
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            <span>{streak} дн.</span>
          </div>
        )}

        {/* Notifications Icon Button (Hidden in guest mode) */}
        {!isGuest && (
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2 rounded-xl text-slate-500 dark:text-dark-text-muted hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-dark-bg transition-all flex items-center justify-center cursor-pointer"
            title={t('nav.notifications', 'Bildirishnomalar')}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-dark-surface animate-pulse" />
            )}
          </button>
        )}

        <div className="h-6 w-px bg-slate-200 dark:bg-dark-border mx-0.5"></div>

        {/* Profile Avatar Button & Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-bg transition-all outline-none"
          >
            {(user?.avatar || user?.avatar_url) ? (
              <img src={user.avatar || user.avatar_url} alt={displayName} className="w-8 h-8 rounded-xl object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
                {initial}
              </div>
            )}
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-3 w-64 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border shadow-2xl dark:shadow-black/70 rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 z-50">
              <div className="p-4 border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/40">
                <p className="font-bold text-slate-800 dark:text-dark-text-main text-sm truncate">{displayName}</p>
                <p className="text-xs text-slate-400 truncate mt-0.5">{user?.email || 'Гостевой аккаунт'}</p>
              </div>

              <div className="py-2">
                {isGuest ? (
                  <button 
                    onClick={() => {
                      setIsMenuOpen(false);
                      setShowAuthRequiredModal(true);
                    }} 
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-violet-50 dark:hover:bg-violet-950/30 text-violet-600 dark:text-violet-400 font-bold text-sm transition-colors"
                  >
                    <User className="w-4 h-4" />
                    {t('auth.btn_login', 'Tizimga kirish')}
                  </button>
                ) : (
                  <>
                    <button onClick={() => openSettings('profile')} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-dark-bg text-slate-700 dark:text-dark-text-main font-medium text-sm transition-colors">
                      <User className="w-4 h-4 text-slate-400 dark:text-dark-text-muted" />
                      {t('sidebar.my_profile', 'Mening profilim')}
                    </button>

                    <button onClick={() => { navigate('/plans'); setIsMenuOpen(false); }} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-dark-bg text-slate-700 dark:text-dark-text-main font-medium text-sm transition-colors">
                      <div className="flex items-center gap-3">
                        <Crown className="w-4 h-4 text-violet-500" />
                        {t('sidebar.plans_and_subscription', 'Tariflar')}
                      </div>
                      <span className="text-xs font-bold bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full">Pro</span>
                    </button>

                    <button onClick={() => openSettings('payments')} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-dark-bg text-slate-700 dark:text-dark-text-main font-medium text-sm transition-colors">
                      <History className="w-4 h-4 text-slate-400 dark:text-dark-text-muted" />
                      {t('sidebar.payment_history', 'To\'lovlar tarixi')}
                    </button>

                    <div className="h-px bg-slate-100 dark:bg-dark-border my-2 mx-4"></div>
                  </>
                )}

                <div className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-dark-bg text-slate-700 dark:text-dark-text-main font-medium text-sm">
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-slate-400 dark:text-dark-text-muted" />
                    {t('common.language', 'Til')}
                  </div>
                  <select 
                    value={language}
                    onChange={(e) => {
                      const code = e.target.value as 'uz' | 'ru' | 'en';
                      i18n.changeLanguage(code);
                      setLanguage(code);
                      window.location.reload();
                    }}
                    className="bg-transparent font-medium text-slate-500 dark:text-dark-text-muted text-xs outline-none cursor-pointer"
                  >
                    <option value="uz">O'zbekcha</option>
                    <option value="ru">Русский</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div 
                  onClick={() => setIsDark(!isDark)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-dark-bg text-slate-700 dark:text-dark-text-main font-medium text-sm cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Moon className="w-4 h-4 text-slate-400 dark:text-dark-text-muted" />
                    {t('common.dark_mode', 'Tungi rejim')}
                  </div>
                  <div 
                    className={`w-9 h-5 rounded-full p-0.5 flex items-center transition-colors duration-200 ${isDark ? 'bg-violet-600' : 'bg-slate-200 dark:bg-dark-border'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${isDark ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </div>
                </div>

                <div className="h-px bg-slate-100 dark:bg-dark-border my-2 mx-4"></div>

                <button onClick={() => setShowLogoutModal(true)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-sm font-medium transition-colors">
                  <LogOut className="w-4 h-4" />
                  {t('common.logout', 'Chiqish')}
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
        initialTab={settingsTab}
      />

      {/* Auth Required Modal */}
      <AuthRequiredModal
        isOpen={showAuthRequiredModal}
        onClose={() => setShowAuthRequiredModal(false)}
      />

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)}></div>
          <div className="bg-white dark:bg-dark-surface w-full max-w-sm rounded-3xl p-6 relative z-10 shadow-2xl border border-slate-100 dark:border-dark-border">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                <LogOut className="w-6 h-6 text-rose-500" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-dark-text-main text-center mb-2">
              {t('sidebar.logout_title', 'Hisobdan chiqish')}
            </h3>
            <p className="text-slate-500 dark:text-dark-text-muted text-sm text-center mb-8">
              {t('sidebar.logout_confirm', 'Hisobingizdan chiqishni xohlaysizmi?')}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 rounded-2xl font-bold text-slate-600 dark:text-dark-text-muted bg-slate-100 dark:bg-dark-bg hover:bg-slate-200 dark:hover:bg-dark-bg/80 transition-colors text-sm"
              >
                {t('common.cancel', 'Bekor qilish')}
              </button>
              <button 
                onClick={handleLogout}
                className="flex-1 py-3 rounded-2xl font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors text-sm"
              >
                {t('common.logout', 'Chiqish')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
