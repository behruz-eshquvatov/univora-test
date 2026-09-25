import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { useProgressStore } from '../store/useProgressStore';
import { X, Clock, ChevronRight, ChevronLeft, Loader2, Apple, Crown, User as UserIcon, ListOrdered, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation, Trans } from 'react-i18next';
import {
  testengineApi,
  type SessionQuestion,
  type SessionQuestionReview,
  type TestSessionDetail,
  type FinishResponse,
} from '../lib/api/testengine';

export default function QuizSession() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { isAuthenticated, login, user, isGuest } = useAuthStore();
  const { decrementReviewsToday } = useProgressStore();

  // Session state
  const [sessionDetail, setSessionDetail] = useState<TestSessionDetail | null>(null);
  const [questions, setQuestions] = useState<SessionQuestion[]>([]);
  const [currentOrder, setCurrentOrder] = useState(1); // 1-based
  const [loadingInit, setLoadingInit] = useState(true);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [showMobileGridModal, setShowMobileGridModal] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  // Timer
  const [timeLeft, setTimeLeft] = useState(30 * 60);

  // Result state (after finish)
  const [finishResult, setFinishResult] = useState<FinishResponse | null>(null);

  // UI modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);

  // Track time spent on current question
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  const currentQuestion = questions.find(q => q.order === currentOrder) || null;
  const totalQuestions = sessionDetail?.total_questions || questions.length;

  // ─── Initialization ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!sessionId) {
      navigate('/dashboard');
      return;
    }
    initSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, i18n.language]);

  useEffect(() => {
    if (!sessionId) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionId]);

  const initSession = async () => {
    try {
      setLoadingInit(true);
      const [detail, qs] = await Promise.all([
        testengineApi.getSessionDetail(sessionId!),
        testengineApi.getSessionQuestions(sessionId!),
      ]);
      setSessionDetail(detail);

      // If session is already finished, show review
      if (detail.is_finished) {
        // Fetch review (already loaded via getSessionQuestions since finished)
        const review = await testengineApi.getSessionReview(sessionId!);
        // Construct a pseudo-FinishResponse for display
        setFinishResult({
          session: detail,
          result: {
            id: 0,
            session: detail.id,
            subject: detail.subject,
            user: detail.user,
            mode: detail.mode,
            mode_display: detail.mode_display,
            total_score: 0,
            correct_count: review.filter(r => r.is_correct).length,
            incorrect_count: review.filter(r => !r.is_correct && r.is_answered).length,
            unanswered_count: review.filter(r => !r.is_answered).length,
            total_questions: review.length,
            accuracy_percent: review.length > 0
              ? Math.round((review.filter(r => r.is_correct).length / review.length) * 100)
              : 0,
            duration_seconds: detail.duration_seconds || 0,
            created_at: detail.created_at,
            updated_at: detail.updated_at,
          },
          review,
        });
        return;
      }

      setQuestions(qs);

      // Find first unanswered question
      const firstUnanswered = qs.find(q => !q.is_answered);
      setCurrentOrder(firstUnanswered?.order || 1);
      setQuestionStartTime(Date.now());
    } catch (error: any) {
      console.error('Failed to init session:', error);
      navigate('/dashboard');
    } finally {
      setLoadingInit(false);
    }
  };

  // ─── Answer submission ────────────────────────────────────────────────────

  const submitAnswer = useCallback(async (selectedOption: string) => {
    if (!currentQuestion || submittingAnswer) return;

    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

    // Optimistic update
    setQuestions(prev =>
      prev.map(q =>
        q.order === currentOrder
          ? {
              ...q,
              is_answered: true,
              my_answer: {
                id: q.my_answer?.id || 0,
                selected_option: selectedOption.toUpperCase(),
                confidence: '',
                time_spent_seconds: timeSpent,
                updated_at: new Date().toISOString(),
              },
            }
          : q
      )
    );

    try {
      setSubmittingAnswer(true);
      const updated = await testengineApi.answerQuestion(
        sessionId!,
        currentOrder,
        selectedOption,
        { time_spent_seconds: timeSpent }
      );
      // Update with server response
      setQuestions(prev =>
        prev.map(q => (q.order === currentOrder ? updated : q))
      );
    } catch (error) {
      console.error('Failed to submit answer:', error);
      // Rollback optimistic update on error
      setQuestions(prev =>
        prev.map(q =>
          q.order === currentOrder
            ? { ...q, is_answered: false, my_answer: null }
            : q
        )
      );
    } finally {
      setSubmittingAnswer(false);
    }
  }, [currentQuestion, currentOrder, questionStartTime, submittingAnswer, sessionId]);

  const handleOptionClick = (key: string) => {
    // Allow changing answer any time before finish
    submitAnswer(key);
  };

  // ─── Navigation ───────────────────────────────────────────────────────────

  const goToQuestion = (order: number) => {
    if (order < 1 || order > totalQuestions) return;
    setCurrentOrder(order);
    setQuestionStartTime(Date.now());
  };

  const goNext = () => {
    if (currentOrder < totalQuestions) {
      goToQuestion(currentOrder + 1);
    } else {
      // Last question — show finish confirm
      setShowFinishConfirm(true);
    }
  };

  const goPrev = () => {
    if (currentOrder > 1) {
      goToQuestion(currentOrder - 1);
    }
  };

  // ─── Finish ───────────────────────────────────────────────────────────────

  const handleFinish = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    await completeQuiz();
  };

  const completeQuiz = async () => {
    try {
      setIsFinishing(true);
      const result = await testengineApi.finishSession(sessionId!);
      setFinishResult(result);
      decrementReviewsToday();
    } catch (e: any) {
      console.error(e);
      // If already finished, redirect to dashboard
      if (e.response?.status === 400) {
        navigate('/dashboard');
      }
    } finally {
      setIsFinishing(false);
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const answeredCount = questions.filter(q => q.is_answered).length;
  const selectedOption = currentQuestion?.my_answer?.selected_option || '';

  // ─── Result Screen ────────────────────────────────────────────────────────

  if (finishResult) {
    const { result, review } = finishResult;
    const accuracy = result.total_questions > 0
      ? Math.round((result.correct_count / result.total_questions) * 100)
      : 0;

    return (
      <div className="min-h-screen bg-transparent flex flex-col font-body p-4 sm:p-8 items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg bg-surface rounded-[2rem] shadow-2xl border border-white/10 p-8 text-center relative z-10"
        >
          <h2 className="text-3xl font-extrabold text-slate-800 mb-2 pt-4">{t('quiz.finished_title')}</h2>
          <p className="text-slate-500 mb-8 font-medium">{t('quiz.finished_desc')}</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-50 p-4 rounded-2xl border border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">{t('quiz.accuracy')}</span>
              <span className="text-2xl font-extrabold text-slate-800">{accuracy}%</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">{t('quiz.time')}</span>
              <span className="text-2xl font-extrabold text-slate-800">{formatTime(result.duration_seconds || 0)}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">{t('quiz.correct')}</span>
              <span className="text-2xl font-extrabold text-emerald-500">{result.correct_count}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">{t('quiz.total_questions')}</span>
              <span className="text-2xl font-extrabold text-slate-800">{result.total_questions}</span>
            </div>
          </div>

          {/* Review section */}
          {review && review.length > 0 && (
            <div className="text-left mb-8 max-h-72 overflow-y-auto space-y-3 pr-1">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">{t('quiz.review_mistakes')}</h3>
              {(review as SessionQuestionReview[]).filter(r => !r.is_correct).map(r => (
                <div key={r.order} className="bg-rose-50 rounded-xl p-3 border border-rose-100">
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    {r.order}. {r.question.text.substring(0, 80)}{r.question.text.length > 80 ? '...' : ''}
                  </p>
                  <div className="flex gap-3 text-xs font-bold mb-2">
                    <span className="text-rose-500">{t('quiz.your_answer', { answer: r.selected_option || '—' })}</span>
                    <span className="text-emerald-600">{t('quiz.correct_answer', { answer: r.correct_option })}</span>
                  </div>

                  {r.hint && (
                    <div className="text-xs text-amber-800 font-medium mb-1.5 bg-amber-50 p-2 rounded-lg border border-amber-100">
                      💡 <strong>Подсказка:</strong> {r.hint}
                    </div>
                  )}

                  {finishResult?.explanation_access?.can_access ? (
                    r.explanation ? (
                      <div className="mt-2 p-2.5 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-900 font-medium leading-relaxed">
                        📖 <strong>Разбор решения:</strong> {r.explanation}
                      </div>
                    ) : null
                  ) : (
                    <button
                      onClick={() => navigate('/plans')}
                      className="mt-2 text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border border-amber-200"
                    >
                      <Crown className="w-3.5 h-3.5 fill-current text-amber-600" />
                      <span>Nega xato? → Pro'da ochiladi 👑</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:brightness-110 shadow-lg shadow-primary/20 transition-all"
          >
            {t('quiz.back_to_home')}
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loadingInit) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col font-body p-4 sm:p-8 items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col font-body p-4 sm:p-8 items-center justify-center">
        <div className="w-full max-w-3xl bg-surface rounded-[2rem] shadow-2xl border border-white/10 p-8 text-center relative z-10">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">{t('quiz.session_unavailable')}</h2>
          <p className="text-slate-500 mb-8">{t('quiz.session_unavailable_desc')}</p>
          <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-primary text-white rounded-xl font-bold">
            {t('quiz.back_to_dashboard')}
          </button>
        </div>
      </div>
    );
  }

  // ─── Main Quiz UI ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-body p-4 sm:p-8 items-center justify-center">

      <div className="w-full max-w-6xl relative z-10 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 lg:gap-6">

        {/* Mobile / Tablet Compact Top Timer Bar (Right Aligned & Shorter) */}
        <div className="lg:hidden flex justify-end w-full max-w-2xl">
          <div className="bg-surface rounded-full shadow-md border border-white/20 px-3.5 py-1.5 flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-dark-text-main">
              {t('quiz.time', 'VAQT')}
            </span>
            <span className="text-sm font-extrabold font-mono text-violet-700 dark:text-violet-400">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Left Column: Main Quiz Card (Centered) */}
        <div className="w-full max-w-2xl bg-surface rounded-[2rem] shadow-2xl border border-white/10 flex flex-col overflow-hidden relative z-10">
          {/* Header */}
          <header className="p-4 sm:p-6 sm:px-8 border-b border-border flex items-center justify-between bg-surface">
            <button onClick={() => setShowExitConfirm(true)} className="text-slate-400 hover:text-rose-500 transition-colors p-1 shrink-0">
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center justify-end gap-3 font-bold">
              <button
                onClick={() => setShowMobileGridModal(true)}
                className="lg:hidden flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors border border-slate-200/80 dark:border-slate-700 shadow-sm"
              >
                <ListOrdered className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>{t('quiz.questions', 'Savollar')}</span>
                <span className="ml-0.5 text-violet-600 dark:text-violet-400 font-extrabold">{answeredCount}/{totalQuestions}</span>
              </button>
            </div>
          </header>



          {/* Question Content */}
          <main className="p-5 sm:p-8 bg-surface flex-1 flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.order}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6 leading-relaxed text-left">
                  {currentQuestion.question.text}
                </h2>

                {/* Question image */}
                {currentQuestion.question.image && (
                  <div className="mb-6">
                    <img
                      src={currentQuestion.question.image}
                      alt={currentQuestion.question.image_caption || 'Изображение к вопросу'}
                      className="w-full max-h-64 object-contain rounded-xl border border-slate-100 bg-slate-50/50"
                    />
                    {currentQuestion.question.image_caption && (
                      <p className="text-sm text-center text-slate-500 mt-2 font-medium">
                        {currentQuestion.question.image_caption}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  {currentQuestion.question && Object.entries(currentQuestion.question.options).map(([key, opt]) => {
                    const isSelected = selectedOption === key;
                    return (
                      <button
                        key={key}
                        onClick={() => handleOptionClick(key)}
                        disabled={submittingAnswer}
                        className={`w-full text-left px-5 py-3.5 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 group ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        } ${submittingAnswer ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                          isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                        }`}>
                          {key}
                        </div>
                        <span className={`text-base sm:text-lg font-medium ${isSelected ? 'text-primary' : 'text-slate-700'}`}>
                          {opt as string}
                        </span>
                        {submittingAnswer && isSelected && (
                          <Loader2 className="w-4 h-4 ml-auto text-primary animate-spin" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Footer Navigation */}
          <footer className="p-4 sm:px-8 sm:py-5 border-t border-border flex items-center justify-between bg-slate-50 gap-3">
            <button
              onClick={() => setShowFinishConfirm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-slate-500 hover:text-rose-500 hover:bg-rose-50 transition-colors text-sm"
            >
              {t('quiz.finish_early')}
            </button>

            <div className="flex items-center gap-2 sm:gap-3">
              {currentOrder > 1 && (
                <button
                  onClick={goPrev}
                  className="flex items-center justify-center gap-1 px-3.5 sm:px-5 py-2.5 rounded-xl font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 transition-all text-sm sm:text-base"
                  title={t('quiz.back', 'Orqaga')}
                >
                  <ChevronLeft className="w-5 h-5 shrink-0" />
                  <span className="hidden sm:inline">{t('quiz.back', 'Orqaga')}</span>
                </button>
              )}

              {(() => {
                const isAllAnswered = answeredCount === totalQuestions;
                const isLast = currentOrder === totalQuestions;
                const showFinish = isAllAnswered || isLast;
                return (
                  <button
                    onClick={goNext}
                    className={`flex items-center justify-center gap-1 sm:gap-2 px-4 sm:px-8 py-2.5 text-white rounded-xl font-bold hover:brightness-110 transition-all shadow-md text-sm sm:text-base ${
                      showFinish
                        ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                        : 'bg-primary shadow-primary/20'
                    }`}
                  >
                    <span className={!showFinish ? "hidden sm:inline" : ""}>
                      {showFinish ? t('quiz.finish', 'Tugatish') : t('quiz.forward', 'Keyingisi')}
                    </span>
                    {!showFinish && <ChevronRight className="w-5 h-5 shrink-0" />}
                  </button>
                );
              })()}
            </div>
          </footer>
        </div>

        {/* Right Column: User Profile & Multi-row Question Grid (Desktop Only) */}
        <div className="hidden lg:flex w-72 flex-col gap-4 shrink-0 lg:absolute lg:right-0 lg:top-1/2 lg:-translate-y-1/2 xl:relative xl:top-0 xl:translate-y-0">
          
          {/* Standalone Container 1: Timer Card */}
          <div className="bg-surface rounded-[2rem] shadow-xl border border-white/20 p-4 sm:p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-violet-500/20">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {t('quiz.time', 'VAQT')}
              </span>
            </div>
            <span className="text-lg font-extrabold font-mono text-violet-700">
              {formatTime(timeLeft)}
            </span>
          </div>

          {/* Standalone Container 2: Profile & Question Navigation Card */}
          <div className="bg-surface rounded-[2rem] shadow-xl border border-white/20 p-6 flex flex-col gap-5">
            {/* User Profile Card (Shown ONLY for authorized non-guest users) */}
            {user && !isGuest && (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                {user.avatar_url || user.avatar ? (
                  <img
                    src={user.avatar_url || user.avatar}
                    alt={user.full_name || user.name || 'User'}
                    className="w-10 h-10 rounded-full object-cover border border-violet-200 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold shrink-0">
                    <UserIcon className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-sm text-slate-800 truncate">
                    {user.full_name || user.name || 'Foydalanuvchi'}
                  </h4>
                  <p className="text-xs font-semibold text-slate-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            )}

          {/* Question Grid Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                {t('quiz.questions', 'Savollar')}
              </h5>
              <span className="text-xs font-extrabold px-2.5 py-0.5 bg-violet-50 text-violet-700 rounded-lg">
                {answeredCount} / {totalQuestions}
              </span>
            </div>

            {/* Grid of Question Circles (5 columns, circular, no overflow scroll limit) */}
            <div className="grid grid-cols-5 gap-2.5 p-1.5">
              {questions.map(q => {
                const isActive = q.order === currentOrder;
                const isAnswered = q.is_answered;
                return (
                  <button
                    key={q.order}
                    onClick={() => goToQuestion(q.order)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold transition-all ${
                      isActive
                        ? 'bg-primary text-white ring-4 ring-primary/20 scale-105 shadow-md shadow-violet-500/20'
                        : isAnswered
                          ? 'bg-emerald-500 text-white shadow-sm hover:ring-2 hover:ring-emerald-300'
                          : 'bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 shadow-sm'
                    }`}
                  >
                    {q.order}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-surface rounded-3xl p-8 max-w-md w-full border border-border shadow-2xl relative"
            >
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500 bg-slate-50 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-8 mt-4">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">🔐</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">{t('quiz.save_progress')}</h3>
                <p className="text-slate-500">{t('quiz.save_progress_desc')}</p>
              </div>

              <div className="flex flex-col gap-3 items-center w-full">
                <div className="flex justify-center">
                  <GoogleLogin
                    width="280"
                    onSuccess={async (credentialResponse) => {
                      try {
                        const response = await api.post('/api/auth/google/', {
                          id_token: credentialResponse.credential,
                        });
                        const { access, refresh, user } = response.data;
                        login(user || { id: '1', name: 'Student', email: '', role: 'student' }, access, refresh);
                        setShowAuthModal(false);
                        completeQuiz();
                      } catch (error) {
                        console.error('Google Auth Failed', error);
                      }
                    }}
                    onError={() => console.error('Google Auth Failed')}
                  />
                </div>

                <button
                  onClick={() => alert(t('quiz.apple_dev'))}
                  className="flex items-center justify-center gap-2 bg-black text-white shadow-sm hover:bg-gray-900 transition-colors"
                  style={{ width: '280px', height: '40px', borderRadius: '4px' }}
                >
                  <Apple className="w-5 h-5 mb-0.5" />
                  <span className="text-sm font-medium" style={{ fontFamily: 'Roboto, arial, sans-serif' }}>Sign in with Apple</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-surface rounded-3xl p-8 max-w-sm w-full border border-border shadow-2xl relative text-center"
            >
              <h3 className="text-2xl font-bold text-slate-800 mb-2">{t('quiz.exit_confirm_title')}</h3>
              <p className="text-slate-500 mb-8">{t('quiz.exit_confirm_desc')}</p>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-md transition-colors"
                >
                  {t('quiz.exit')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Finish Confirmation Modal */}
      <AnimatePresence>
        {showFinishConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-surface rounded-3xl p-8 max-w-sm w-full border border-border shadow-2xl relative text-center"
            >
              <h3 className="text-2xl font-bold text-slate-800 mb-2">{t('quiz.finish_confirm_title')}</h3>
              <p className="text-slate-500 mb-2">
                <Trans i18nKey="quiz.answered_count" values={{ answered: answeredCount, total: totalQuestions }}>
                  Отвечено: <span className="font-bold text-slate-700">{answeredCount}</span> из{' '}
                  <span className="font-bold text-slate-700">{totalQuestions}</span>
                </Trans>
              </p>
              {answeredCount < totalQuestions && (
                <p className="text-amber-600 text-sm font-medium mb-6">
                  {t('quiz.unanswered_count', { count: totalQuestions - answeredCount })}
                </p>
              )}
              {answeredCount >= totalQuestions && <div className="mb-6" />}

              <div className="flex gap-4">
                <button
                  onClick={() => setShowFinishConfirm(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => {
                    setShowFinishConfirm(false);
                    handleFinish();
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-primary hover:brightness-110 shadow-md transition-colors"
                >
                  {t('quiz.finish')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Question Grid Modal / Drawer */}
      <AnimatePresence>
        {showMobileGridModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 max-h-[85vh] text-slate-800"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ListOrdered className="w-5 h-5 text-violet-600" />
                  <h4 className="font-extrabold text-base text-slate-800">
                    {t('quiz.questions', 'Savollar')}
                  </h4>
                  <span className="text-xs font-extrabold px-2.5 py-0.5 bg-violet-50 text-violet-700 rounded-lg">
                    {answeredCount} / {totalQuestions}
                  </span>
                </div>
                <button
                  onClick={() => setShowMobileGridModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[60vh] p-1.5">
                <div className="grid grid-cols-5 gap-3 p-1.5">
                  {questions.map((q) => {
                    const isActive = q.order === currentOrder;
                    const isAnswered = q.is_answered;
                    return (
                      <button
                        key={q.order}
                        onClick={() => {
                          goToQuestion(q.order);
                          setShowMobileGridModal(false);
                        }}
                        className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-extrabold transition-all ${
                          isActive
                            ? 'bg-primary text-white ring-4 ring-primary/20 scale-105 shadow-md shadow-violet-500/20'
                            : isAnswered
                              ? 'bg-emerald-500 text-white shadow-sm hover:ring-2 hover:ring-emerald-300'
                              : 'bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 shadow-sm'
                        }`}
                      >
                        {q.order}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Finishing Preloader Overlay */}
      <AnimatePresence>
        {isFinishing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex flex-col items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white dark:bg-dark-surface rounded-3xl p-8 sm:p-10 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-dark-border text-center flex flex-col items-center justify-center gap-4"
            >
              <div className="relative flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center">
                  <Brain className="w-8 h-8 text-violet-600 animate-pulse" />
                </div>
                <Loader2 className="w-20 h-20 text-violet-600 animate-spin absolute -inset-2" />
              </div>
              <div>
                <h3 className="font-extrabold text-xl text-slate-800 dark:text-dark-text-main mb-1.5">
                  {t('quiz.finishing_title', 'Test yakunlanmoqda...')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-dark-text-muted font-medium leading-relaxed">
                  {t('quiz.finishing_desc', 'Natijalaringiz hisoblanmoqda va saqlanmoqda')}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
