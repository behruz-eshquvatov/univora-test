import { useState, useEffect, useRef } from 'react';
import { Target, Flame, Snowflake, Star, Zap, History, Clock, BookOpen } from 'lucide-react';
import { progressApi, type XPSummary, type Streak, type XPTransaction, type ReviewCard } from '../lib/api/progress';

export default function Progress() {
  const [xpSummary, setXpSummary] = useState<XPSummary | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [transactions, setTransactions] = useState<XPTransaction[]>([]);
  const [reviews, setReviews] = useState<ReviewCard[]>([]);
  
  const [isFreezing, setIsFreezing] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    progressApi.getXpSummary().then(setXpSummary).catch(console.error);
    progressApi.getStreak().then(setStreak).catch(console.error);
    progressApi.getXpTransactions().then(setTransactions).catch(console.error);
    progressApi.getTodayReviews().then(setReviews).catch(console.error);
  }, []);

  useEffect(() => {
    if (isReviewing && reviews[currentReviewIndex]) {
      startTimeRef.current = Date.now();
      setSelectedOption(null);
    }
  }, [isReviewing, currentReviewIndex, reviews]);

  const handleFreeze = async () => {
    setIsFreezing(true);
    try {
      const updatedStreak = await progressApi.freezeStreak();
      setStreak(updatedStreak);
      alert('Заморозка активирована!');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Не удалось заморозить стрик.');
    } finally {
      setIsFreezing(false);
    }
  };

  const handleOptionClick = async (key: string) => {
    if (selectedOption || isSubmitting) return; // Prevent double clicks
    
    setSelectedOption(key);
    setIsSubmitting(true);

    const currentCard = reviews[currentReviewIndex];
    if (!currentCard) return;

    const isCorrect = key === currentCard.correct_option;
    const responseTime = Math.floor((Date.now() - startTimeRef.current) / 1000);

    // Give user 1.5 seconds to see correct/incorrect color
    setTimeout(async () => {
      try {
        await progressApi.submitReview(currentCard.id, isCorrect, responseTime);
        
        if (currentReviewIndex < reviews.length - 1) {
          setCurrentReviewIndex(prev => prev + 1);
        } else {
          setIsReviewing(false);
          // Refresh reviews
          progressApi.getTodayReviews().then(setReviews).catch(console.error);
        }
      } catch (err) {
        console.error(err);
        alert('Ошибка при отправке ответа');
      } finally {
        setIsSubmitting(false);
      }
    }, 1500);
  };

  return (
    <div className="md:bg-slate-50/95 dark:md:bg-dark-surface/90 md:backdrop-blur-xl md:rounded-2xl md:shadow-2xl md:border md:border-white/60 dark:md:border-dark-border/60 min-h-[calc(100vh-2rem)] md:p-8 flex flex-col gap-6 md:gap-8 relative overflow-hidden">
      
      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-dark-text-main tracking-tight">Прогресс</h1>
          <p className="text-slate-500 dark:text-dark-text-muted mt-2 font-medium text-lg">Аналитика, достижения и повторение</p>
        </div>
      </div>

      <div className="relative z-10 flex flex-col gap-8">
        
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Total XP */}
          <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-3xl p-6 text-white shadow-lg shadow-violet-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-violet-100 font-bold mb-1">Опыт (XP)</p>
                <h3 className="text-4xl font-extrabold">{xpSummary?.xp_total || 0}</h3>
              </div>
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
            {xpSummary && (
              <div className="mt-6 flex flex-col gap-2">
                <div className="flex justify-between text-sm font-bold text-violet-100">
                  <span>За сегодня:</span>
                  <span>+{xpSummary.xp_today} XP</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-violet-100">
                  <span>За эту неделю:</span>
                  <span>+{xpSummary.xp_this_week} XP</span>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Streak */}
          <div className="bg-white dark:bg-dark-surface rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-dark-border group hover:shadow-lg hover:border-orange-100 dark:hover:border-orange-950 transition-all flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 dark:text-dark-text-muted font-bold mb-1">Ударный режим</p>
                <h3 className="text-4xl font-extrabold text-slate-800 dark:text-dark-text-main flex items-baseline gap-2">
                  {streak?.current_streak || 0} 
                  <span className="text-xl text-slate-400 dark:text-dark-text-muted font-semibold">дн.</span>
                </h3>
              </div>
              <div className="w-12 h-12 bg-orange-50 dark:bg-orange-950/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Flame className={`w-6 h-6 ${streak?.is_active ? 'text-orange-500 fill-orange-500' : 'text-orange-300'}`} />
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm font-bold text-slate-500 dark:text-dark-text-muted">
                <span>Максимум: {streak?.longest_streak || 0} дн.</span>
                <span className="flex items-center gap-1"><Snowflake className="w-4 h-4 text-cyan-500" /> {streak?.freezes_available || 0} шт.</span>
              </div>
              <button 
                onClick={handleFreeze}
                disabled={isFreezing || !streak?.freezes_available || streak?.freezes_available === 0}
                className="w-full py-2.5 bg-cyan-50 dark:bg-cyan-950/20 hover:bg-cyan-100 dark:hover:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 font-bold rounded-xl transition-colors text-sm disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-dark-bg flex items-center justify-center gap-2"
              >
                <Snowflake className="w-4 h-4" />
                Заморозить стрик
              </button>
            </div>
          </div>

          {/* Card 3: Reviews */}
          <div className="bg-white dark:bg-dark-surface rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-dark-border group hover:shadow-lg hover:border-blue-100 dark:hover:border-blue-950 transition-all flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 dark:text-dark-text-muted font-bold mb-1">Карточки на сегодня</p>
                <h3 className="text-4xl font-extrabold text-slate-800 dark:text-dark-text-main">{reviews.length}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/20 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                <BookOpen className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <div className="mt-6">
              <button 
                onClick={() => {
                  if (reviews.length > 0) {
                    setCurrentReviewIndex(0);
                    setIsReviewing(true);
                  }
                }}
                disabled={reviews.length === 0}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors text-sm disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-dark-bg dark:disabled:text-dark-text-muted flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4" />
                {reviews.length > 0 ? 'Начать повторение' : 'Всё повторено'}
              </button>
            </div>
          </div>

        </div>

        {/* Sections Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {/* XP Transactions List */}
          <div className="bg-white dark:bg-dark-surface rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-dark-border flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-extrabold text-slate-800 dark:text-dark-text-main text-xl">История опыта</h3>
              <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-dark-bg flex items-center justify-center">
                <History className="w-5 h-5 text-slate-400 dark:text-dark-text-muted" />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 space-y-3">
              {transactions.length > 0 ? transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-dark-bg border border-slate-100 dark:border-dark-border hover:border-violet-200 dark:hover:border-violet-950 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 rounded-xl flex items-center justify-center">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-dark-text-main text-sm">{tx.source_display}</p>
                      <p className="text-xs text-slate-500 dark:text-dark-text-muted">{new Date(tx.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-emerald-500">+{tx.amount} XP</span>
                </div>
              )) : (
                <div className="p-8 text-center text-slate-500 dark:text-dark-text-muted font-medium">Нет недавних начислений XP</div>
              )}
            </div>
          </div>

          {/* Leaderboard Preview */}
          <div className="bg-white dark:bg-dark-surface rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-dark-border flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-extrabold text-slate-800 dark:text-dark-text-main text-xl">Направления развития</h3>
              <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-dark-bg flex items-center justify-center">
                <Star className="w-5 h-5 text-slate-400 dark:text-dark-text-muted" />
              </div>
            </div>
            <p className="text-slate-600 dark:text-dark-text-muted mb-4 leading-relaxed">
              Выполняйте тесты, повторяйте карточки и поддерживайте ударный режим, чтобы зарабатывать опыт и подниматься в рейтинге.
            </p>
            <div className="mt-auto bg-violet-50 dark:bg-violet-950/20 rounded-2xl p-5 border border-violet-100 dark:border-violet-900/30 text-center">
              <p className="text-sm font-bold text-violet-800 dark:text-violet-400 mb-2">Готовы соревноваться?</p>
              <a href="/leaderboard" className="inline-block bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 px-6 rounded-xl transition-colors text-sm">
                Открыть таблицу лидеров
              </a>
            </div>
          </div>

        </div>

      </div>

      {/* Review Modal */}
      {isReviewing && reviews[currentReviewIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-dark-surface rounded-3xl p-8 w-full max-w-lg shadow-2xl relative flex flex-col min-h-[400px] border dark:border-dark-border">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-dark-text-main flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                Карточка {currentReviewIndex + 1} из {reviews.length}
              </h3>
              <button onClick={() => setIsReviewing(false)} className="text-slate-400 dark:text-dark-text-muted hover:text-slate-700 dark:hover:text-dark-text-main">
                <Target className="w-6 h-6" /> {/* close placeholder */}
              </button>
            </div>
            
            <div className="flex-1 flex flex-col bg-slate-50 dark:bg-dark-bg rounded-2xl border border-slate-100 dark:border-dark-border p-6 mb-8">
              <p className="text-lg font-medium text-slate-800 dark:text-dark-text-main text-center mb-6">
                {reviews[currentReviewIndex].question_text || "Вопрос карточки"}
              </p>

              {reviews[currentReviewIndex].options && (
                <div className="grid grid-cols-1 gap-3 w-full">
                  {Object.entries(reviews[currentReviewIndex].options).map(([key, text]) => {
                    const isCorrect = key === reviews[currentReviewIndex].correct_option;
                    const isSelected = key === selectedOption;
                    const showFeedback = selectedOption !== null;
                    
                    let btnClass = 'bg-white dark:bg-dark-surface border-slate-200 dark:border-dark-border hover:border-violet-300 dark:hover:border-violet-900/40 text-slate-700 dark:text-dark-text-main hover:shadow-md';
                    let letterClass = 'bg-slate-100 dark:bg-dark-bg text-slate-500';

                    if (showFeedback) {
                      if (isCorrect) {
                        btnClass = 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-700 dark:text-emerald-400';
                        letterClass = 'bg-emerald-500 text-white';
                      } else if (isSelected) {
                        btnClass = 'bg-rose-50 dark:bg-rose-950/20 border-rose-500 text-rose-700 dark:text-rose-400';
                        letterClass = 'bg-rose-500 text-white';
                      } else {
                        btnClass = 'bg-slate-50 dark:bg-dark-bg border-slate-200 dark:border-dark-border text-slate-400 opacity-50 cursor-not-allowed';
                      }
                    }

                    return (
                      <button 
                        key={key} 
                        onClick={() => handleOptionClick(key)}
                        disabled={showFeedback || isSubmitting}
                        className={`p-4 rounded-xl border flex items-center gap-4 transition-all w-full text-left cursor-pointer ${btnClass}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-colors ${letterClass}`}>
                          {key}
                        </div>
                        <span className="font-medium text-base flex-1">{String(text)}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
