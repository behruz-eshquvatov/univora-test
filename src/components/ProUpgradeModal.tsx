import React from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Crown, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  reason?: string;
  resetAt?: string | null;
}

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({
  isOpen,
  onClose,
  title,
  reason,
  resetAt,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleGoToPlans = () => {
    onClose();
    navigate('/plans');
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-dark-surface rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-dark-border relative text-slate-800 dark:text-dark-text-main text-center overflow-hidden">
        
        {/* Glow Header */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-300"></div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-dark-bg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center mx-auto mb-5 shadow-lg shadow-orange-500/25">
          <Crown className="w-8 h-8 fill-current" />
        </div>

        <h3 className="text-2xl font-extrabold mb-2 text-slate-800 dark:text-dark-text-main">
          {title || t('pro.modal_title', 'Перейдите на Pro')}
        </h3>

        <p className="text-sm text-slate-500 dark:text-dark-text-muted mb-6 leading-relaxed">
          {reason ||
            t(
              'pro.modal_desc',
              'Вы достигли дневного лимита тем (4 из 4). Перейдите на Pro для доступа ко всем темам без ограничений!'
            )}
        </p>

        {resetAt && (
          <div className="mb-6 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 shrink-0" />
            <span>
              {t('pro.reset_at', 'Сброс лимита: {{time}}', {
                time: new Date(resetAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              })}
            </span>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleGoToPlans}
            className="w-full py-4 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 text-base active:scale-95"
          >
            <Sparkles className="w-5 h-5" />
            <span>{t('pro.btn_view_plans', 'Смотреть тарифы Pro')}</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl font-bold text-slate-400 hover:text-slate-600 dark:hover:text-dark-text-muted transition-colors text-sm"
          >
            {t('common.close', 'Закрыть')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
