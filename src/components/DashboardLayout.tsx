import { Outlet, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import MobileBottomNav from './MobileBottomNav';
import TopRightHeader from './TopRightHeader';
import { useAuthStore } from '../store/useAuthStore';
import { useLimitStore } from '../store/useLimitStore';
import { ProUpgradeModal } from './ProUpgradeModal';

export default function DashboardLayout() {
  const { t } = useTranslation();
  const { fetchUser, fetchStreak, fetchXpSummary, isGuest } = useAuthStore();
  const { isOpen, title, reason, resetAt, closeLimitModal } = useLimitStore();

  useEffect(() => {
    fetchUser();
    fetchStreak();
    fetchXpSummary();
  }, [fetchUser, fetchStreak, fetchXpSummary]);

  return (
    <div className="min-h-screen bg-transparent flex flex-col md:flex-row relative pt-[72px] md:pt-0 pb-[70px] md:pb-0">
      <MobileHeader />

      <Sidebar />

      {/* Fixed Top-Left Guest Mode Banner */}
      {isGuest && (
        <header className="hidden md:flex fixed top-4 left-[120px] right-[400px] h-12 z-40 items-center justify-between gap-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl text-white shadow-lg shadow-violet-500/20 backdrop-blur-xl border border-white/20 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
            </div>
            <div className="truncate text-xs sm:text-sm font-bold">
              <span>{t('dashboard.guest_banner_title', 'Siz mehmon rejimidasiz')}</span>
              <span className="font-medium text-violet-100 ml-2 opacity-90 hidden lg:inline">
                - {t('dashboard.guest_banner_desc', 'Bollarni, testlar tarixini saqlash va XP olish uchun ro\'yxatdan o\'ting.')}
              </span>
            </div>
          </div>
          <Link
            to="/login"
            className="px-4 py-1.5 bg-white text-violet-700 hover:bg-slate-100 font-extrabold rounded-xl text-xs transition-all text-center shrink-0 shadow-sm"
          >
            {t('dashboard.guest_banner_btn', 'Ro\'yxatdan o\'tish')}
          </Link>
        </header>
      )}

      <TopRightHeader />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 md:pl-[120px] md:pr-4 md:pt-20 md:pb-8 transition-all duration-300">
        <Outlet />
      </main>

      <MobileBottomNav />

      {/* Global Pro Upgrade & Limit Modal */}
      <ProUpgradeModal
        isOpen={isOpen}
        onClose={closeLimitModal}
        title={title}
        reason={reason}
        resetAt={resetAt}
      />
    </div>
  );
}
