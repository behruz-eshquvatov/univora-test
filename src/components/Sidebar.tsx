import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, BarChart2, Crown, MessageSquarePlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { AuthRequiredModal } from './AuthRequiredModal';
import ProjectReviewModal from './ProjectReviewModal';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isGuest } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const navLinks = [
    { name: t('nav.dashboard'), path: '/dashboard', icon: Home, requiresAuth: false },
    { name: t('nav.tests'), path: '/tests', icon: FileText, requiresAuth: false },
    { name: t('nav.progress'), path: '/progress', icon: BarChart2, requiresAuth: true },
    { name: t('nav.plans', 'Tariflar'), path: '/plans', icon: Crown, requiresAuth: false },
    { name: t('reviews.btn_label', 'Отзывы'), path: '#reviews', icon: MessageSquarePlus, requiresAuth: false, isAction: true },
  ];

  return (
    <>
      <aside className="hidden md:flex fixed top-4 bottom-4 left-4 z-50 bg-white dark:bg-dark-surface rounded-3xl border border-slate-100 dark:border-dark-border shadow-xl shadow-slate-200/40 dark:shadow-[0_4px_25px_rgba(0,0,0,0.6)] dark:shadow-black/60 flex-col transition-all duration-300 ease-in-out w-22 hover:w-72 group">
        {/* Logo */}
        <div className="px-5 py-6 flex items-center gap-3 overflow-hidden shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-dark-bg border border-slate-100 dark:border-dark-border shadow-md shrink-0 flex items-center justify-center p-1.5">
            <img src="/logo.png" alt="Unitest Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-extrabold text-2xl text-slate-800 dark:text-dark-text-main tracking-tight opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-300">
            Uni-test
          </span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-5 py-2 flex flex-col gap-2 overflow-x-hidden overflow-y-auto no-scrollbar">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <button
                key={link.path}
                onClick={() => {
                  if (link.isAction) {
                    setIsReviewModalOpen(true);
                    return;
                  }
                  if (link.requiresAuth && isGuest) {
                    setShowAuthModal(true);
                    return;
                  }
                  navigate(link.path);
                }}
                className={`flex items-center gap-3 p-2 rounded-2xl font-bold transition-all w-full overflow-hidden shrink-0 text-left cursor-pointer ${
                  isActive 
                    ? 'bg-linear-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/20' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-dark-text-muted dark:hover:bg-dark-bg dark:hover:text-dark-text-main'
                }`}
              >
                <div className="shrink-0 flex items-center justify-center w-8 h-8 relative">
                  <link.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 dark:text-dark-text-muted'}`} />
                </div>
                <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-300 flex-1 flex items-center justify-between">
                  {link.name}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <ProjectReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
      />
    </>
  );
}
