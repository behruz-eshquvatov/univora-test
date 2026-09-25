import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Clock, BookOpen, Calculator, Atom, Terminal, Globe, CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { testengineApi, type TestResult } from '../lib/api/testengine';
import { progressApi, type ReviewCard } from '../lib/api/progress';
import { useAuthStore } from '../store/useAuthStore';

export default function History() {
  const { t, i18n } = useTranslation();
  const { isGuest } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'tests' | 'reviews'>('tests');
  const [results, setResults] = useState<TestResult[]>([]);
  const [reviews, setReviews] = useState<ReviewCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'tests') {
          const res = await testengineApi.getMyResults();
          setResults(res);
        } else {
          const revs = await progressApi.getAllReviews();
          setReviews(revs);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab, i18n.language]);

  const getSubjectIconAndColor = (name: string, index: number) => {
    const defaultColors = ['from-blue-500 to-cyan-400', 'from-purple-500 to-indigo-500', 'from-emerald-500 to-teal-400', 'from-rose-500 to-pink-500', 'from-amber-400 to-orange-500'];
    const color = defaultColors[index % defaultColors.length];
    const lower = (name || '').toLowerCase();
    
    let icon = <BookOpen className="w-5 h-5 text-white" />;
    if (lower.includes('mat') || lower.includes('мат') || lower.includes('math') || lower.includes('alg') || lower.includes('geom')) {
      icon = <Calculator className="w-5 h-5 text-white" />;
    } else if (lower.includes('fiz') || lower.includes('физ') || lower.includes('phys')) {
      icon = <Atom className="w-5 h-5 text-white" />;
    } else if (lower.includes('inf') || lower.includes('инф') || lower.includes('it') || lower.includes('comp') || lower.includes('dastur')) {
      icon = <Terminal className="w-5 h-5 text-white" />;
    } else if (lower.includes('ing') || lower.includes('eng') || lower.includes('англ') || lower.includes('яз') || lower.includes('til')) {
      icon = <Globe className="w-5 h-5 text-white" />;
    }
    
    return { icon, color };
  };

  const groupedResults = useMemo(() => {
    const grouped: Record<string, TestResult[]> = {};
    results.forEach(result => {
      const dateObj = new Date(result.created_at);
      dateObj.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const diffTime = dateObj.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      let label = '';
      if (diffDays === 0) label = t('history.today');
      else if (diffDays === -1) label = t('history.yesterday');
      else label = dateObj.toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : i18n.language === 'uz' ? 'uz-UZ' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
      
      if (!grouped[label]) grouped[label] = [];
      grouped[label].push(result);
    });
    return grouped;
  }, [results]);

  const groupedReviews = useMemo(() => {
    const grouped: Record<string, ReviewCard[]> = {};
    // Sort reviews by date first
    const sorted = [...reviews].sort((a, b) => new Date(a.next_review_date).getTime() - new Date(b.next_review_date).getTime());
    
    sorted.forEach(card => {
      const dateObj = new Date(card.next_review_date);
      dateObj.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const diffTime = dateObj.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      let label = '';
      if (diffDays < 0) label = t('history.overdue');
      else if (diffDays === 0) label = t('history.today');
      else if (diffDays === 1) label = t('history.tomorrow');
      else label = dateObj.toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : i18n.language === 'uz' ? 'uz-UZ' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
      
      if (!grouped[label]) grouped[label] = [];
      grouped[label].push(card);
    });
    return grouped;
  }, [reviews]);

  return (
    <div className="md:bg-slate-50/95 dark:md:bg-dark-surface/90 md:backdrop-blur-xl md:rounded-2xl md:shadow-2xl md:border md:border-white/60 dark:md:border-dark-border/60 min-h-[calc(100vh-2rem)] md:p-8 flex flex-col gap-6 relative overflow-hidden">
      
      {/* Guest Mode Overlay Alert */}
      {isGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md">
          <div className="bg-white dark:bg-dark-surface rounded-3xl p-8 sm:p-10 max-w-md w-full shadow-2xl border border-slate-100 dark:border-dark-border text-center flex flex-col items-center animate-in fade-in zoom-in-95">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-dark-text-main mb-3">
              {t('history.guest_lock_title', 'Tarixni ko\'rish uchun ro\'yxatdan o\'ting')}
            </h2>
            <p className="text-slate-500 dark:text-dark-text-muted text-sm font-medium mb-8 leading-relaxed">
              {t('history.guest_lock_desc', 'O\'tgan testlaringiz va takrorlashlar tarixingizni saqlash uchun shaxsiy hisobingizga kiring.')}
            </p>
            <Link
              to="/login"
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold rounded-2xl transition-all text-base hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
            >
              {t('dashboard.guest_banner_btn', 'Ro\'yxatdan o\'tish')}
            </Link>
          </div>
        </div>
      )}

      {/* Decorative top-left glare inside the card */}
      <div className="hidden md:block absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/80 to-transparent dark:from-white/5 rounded-t-2xl pointer-events-none"></div>

      {/* Header */}
      <div className={`relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2 mb-4 ${isGuest ? 'filter blur-md opacity-30 select-none pointer-events-none' : ''}`}>
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-dark-text-main tracking-tight">{t('history.title')}</h1>
          <p className="text-slate-500 dark:text-dark-text-muted mt-2 font-medium text-lg">{t('history.subtitle')}</p>
        </div>

        {activeTab === 'tests' && !isGuest && (
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                try {
                  const blob = await testengineApi.exportResults('xlsx');
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'my_test_results.xlsx';
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                } catch {
                  alert('Export error');
                }
              }}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center gap-1.5"
            >
              Excel yuklab olish
            </button>
            <button
              onClick={async () => {
                try {
                  const blob = await testengineApi.exportResults('pdf');
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'my_test_results.pdf';
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                } catch {
                  alert('Export error');
                }
              }}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-colors flex items-center gap-1.5"
            >
              PDF yuklab olish
            </button>
          </div>
        )}
      </div>

      <div className={`relative z-10 ${isGuest ? 'filter blur-md opacity-30 select-none pointer-events-none' : ''}`}>
        {/* Tabs */}
        <div className="flex bg-slate-100 dark:bg-dark-bg p-1.5 rounded-2xl mb-8 max-w-sm">
          <button 
            onClick={() => setActiveTab('tests')}
            className={`flex-1 py-2.5 px-4 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'tests' 
                ? 'bg-white dark:bg-dark-surface shadow-sm text-slate-900 dark:text-dark-text-main' 
                : 'text-slate-500 dark:text-dark-text-muted hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t('history.tab_tests')}
          </button>
          <button 
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 py-2.5 px-4 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'reviews' 
                ? 'bg-white dark:bg-dark-surface shadow-sm text-slate-900 dark:text-dark-text-main' 
                : 'text-slate-500 dark:text-dark-text-muted hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t('history.tab_reviews')}
          </button>
        </div>

        {loading ? (
          <div className="space-y-4 max-w-4xl">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white dark:bg-dark-bg rounded-2xl p-5 border border-slate-100 dark:border-dark-border flex items-center gap-5 animate-pulse">
                <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                  <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8 max-w-4xl">
            {activeTab === 'tests' && (
              <>
                {Object.keys(groupedResults).length > 0 ? Object.entries(groupedResults).map(([dateLabel, dateResults]) => (
                  <div key={dateLabel} className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider pl-1">
                      {dateLabel}
                    </h3>
                    {dateResults.map((result, idx) => {
                      const { icon, color } = getSubjectIconAndColor(result.subject?.name || '', idx);
                      return (
                        <Link to={`/history/${result.id}`} key={result.id} className="block bg-white dark:bg-dark-bg rounded-2xl p-5 border border-slate-100 dark:border-dark-border flex items-center gap-5 hover:border-violet-200 dark:hover:border-violet-900 transition-colors shadow-sm">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0 shadow-sm`}>
                            {icon}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-bold text-slate-800 dark:text-dark-text-main truncate">
                                {result.subject?.name || t('history.default_subject')}
                              </h4>
                              <div className="font-extrabold text-emerald-500 shrink-0">
                                {result.accuracy_percent}%
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs font-bold text-slate-400 dark:text-dark-text-muted">
                              <span>{t('history.correct_answers', { correct: result.correct_count, total: result.total_questions })}</span>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{new Date(result.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )) : (
                  <div className="text-center py-16 text-slate-400 dark:text-dark-text-muted bg-white dark:bg-dark-bg rounded-3xl border border-slate-100 dark:border-dark-border shadow-sm">
                    <p className="font-medium">{t('history.no_tests')}</p>
                  </div>
                )}
              </>
            )}

            {activeTab === 'reviews' && (
              <>
                {Object.keys(groupedReviews).length > 0 ? Object.entries(groupedReviews).map(([dateLabel, dateReviews]) => (
                  <div key={dateLabel} className="space-y-4">
                    <h3 className={`text-sm font-bold uppercase tracking-wider pl-1 ${dateLabel.includes(t('history.overdue')) ? 'text-rose-500' : 'text-slate-400 dark:text-dark-text-muted'}`}>
                      {dateLabel}
                    </h3>
                    {dateReviews.map(card => {
                      const isToday = new Date(card.next_review_date).toDateString() === new Date().toDateString();
                      const isPast = new Date(card.next_review_date) < new Date();
                      const urgencyClass = isPast ? 'text-rose-500 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30' : isToday ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30' : 'text-slate-500 bg-slate-50 dark:bg-dark-surface border border-transparent';

                      return (
                        <div key={card.id} className={`bg-white dark:bg-dark-bg rounded-2xl p-5 border border-slate-100 dark:border-dark-border hover:border-violet-200 dark:hover:border-violet-900 transition-colors shadow-sm`}>
                          <p className="text-sm font-medium text-slate-800 dark:text-dark-text-main mb-4 line-clamp-2">
                            {card.question_text}
                          </p>
                          <div className="flex items-center gap-3">
                            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${urgencyClass}`}>
                              <CalendarDays className="w-3.5 h-3.5" />
                              {isPast || isToday ? t('history.review_today') : t('history.review_date', { date: new Date(card.next_review_date).toLocaleDateString() })}
                            </div>
                            <div className="text-xs font-bold text-slate-400">
                              {t('history.interval_days', { days: card.interval_days })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )) : (
                  <div className="text-center py-16 text-slate-400 dark:text-dark-text-muted bg-white dark:bg-dark-bg rounded-3xl border border-slate-100 dark:border-dark-border shadow-sm">
                    <p className="font-medium">{t('history.no_reviews')}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
