import React, { useState } from 'react';
import { X, Star, MessageSquarePlus, CheckCircle, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';

interface ProjectReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectReviewModal({ isOpen, onClose }: ProjectReviewModalProps) {
  const { t } = useTranslation();
  const [type, setType] = useState<'feedback' | 'bug' | 'feature'>('feedback');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    
    // Post feedback to backend
    try {
      await api.post('/api/feedback/', {
        type,
        rating,
        title,
        message,
      });
    } catch (err) {
      console.error('Failed to send feedback to backend API:', err);
    }

    // Save to local storage for offline / local persistence
    try {
      const existingReviews = JSON.parse(localStorage.getItem('user_project_reviews') || '[]');
      const newReview = {
        id: Date.now(),
        type,
        rating,
        title,
        message,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('user_project_reviews', JSON.stringify([newReview, ...existingReviews]));
    } catch (err) {
      console.error('Failed to save review locally', err);
    }

    setIsSubmitting(false);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setTitle('');
      setMessage('');
      setType('feedback');
      setRating(5);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      <div className="bg-white dark:bg-dark-surface w-full max-w-lg rounded-3xl p-6 relative z-10 shadow-2xl border border-slate-100 dark:border-dark-border transform transition-all animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-dark-text-main hover:bg-slate-100 dark:hover:bg-dark-bg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 animate-bounce">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-dark-text-main mb-2">
              {t('reviews.thank_you', 'Спасибо за отзыв!')}
            </h3>
            <p className="text-slate-500 dark:text-dark-text-muted text-sm max-w-xs">
              {t('reviews.success_desc', 'Ваше мнение помогает сделать Uni-test лучше.')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                <MessageSquarePlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-dark-text-main">
                  {t('reviews.modal_title', 'Отзывы и предложения')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-dark-text-muted">
                  {t('reviews.modal_subtitle', 'Поделитесь впечатлением или сообщите о проблеме')}
                </p>
              </div>
            </div>



            {/* Rating */}
            <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-dark-text-muted uppercase tracking-wider mb-2">
                  {t('reviews.rating_label', 'Ваша оценка')}
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          (hoverRating || rating) >= star
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200 dark:text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-semibold text-slate-500 dark:text-dark-text-muted">
                    {rating}/5
                  </span>
                </div>
              </div>

            {/* Title / Topic */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-dark-text-muted uppercase tracking-wider mb-1.5">
                {t('reviews.topic_label', 'Тема или раздел')}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('reviews.topic_placeholder', 'Например: Тесты по математике, Интерфейс...')}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border text-slate-900 dark:text-dark-text-main text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-dark-text-muted uppercase tracking-wider mb-1.5">
                {t('reviews.message_label', 'Сообщение')} <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('reviews.message_placeholder', 'Опишите ваше впечатление, проблему или предложение подробнее...')}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border text-slate-900 dark:text-dark-text-main text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl font-bold text-slate-600 dark:text-dark-text-muted bg-slate-100 dark:bg-dark-bg hover:bg-slate-200 dark:hover:bg-dark-border transition-colors text-sm"
              >
                {t('common.cancel', 'Отмена')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-md shadow-violet-500/20 text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{t('reviews.send', 'Отправить')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
