import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { useProgressStore } from '../store/useProgressStore';
import { X, Clock, ChevronRight, ChevronLeft, Loader2, Apple } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  testengineApi,
  type SessionQuestion,
  type SessionQuestionReview,
  type TestSessionDetail,
  type FinishResponse,
} from '../lib/api/testengine';

export default function QuizSession() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { isAuthenticated, login } = useAuthStore();
  const { decrementReviewsToday } = useProgressStore();

  // Session state
  const [sessionDetail, setSessionDetail] = useState<TestSessionDetail | null>(null);
  const [questions, setQuestions] = useState<SessionQuestion[]>([]);
  const [currentOrder, setCurrentOrder] = useState(1); // 1-based
  const [loadingInit, setLoadingInit] = useState(true);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

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

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const result = await testengineApi.finishSession(sessionId!);
      setFinishResult(result);
      decrementReviewsToday();
    } catch (e: any) {
      console.error(e);
      // If already finished, redirect to dashboard
      if (e.response?.status === 400) {
        navigate('/dashboard');
      }
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
          <h2 className="text-3xl font-extrabold text-slate-800 mb-2 pt-4">Тест завершен!</h2>
          <p className="text-slate-500 mb-8 font-medium">Отличная работа! Вот ваши результаты:</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-50 p-4 rounded-2xl border border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Точность</span>
              <span className="text-2xl font-extrabold text-slate-800">{accuracy}%</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Время</span>
              <span className="text-2xl font-extrabold text-slate-800">{formatTime(result.duration_seconds || 0)}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Правильно</span>
              <span className="text-2xl font-extrabold text-emerald-500">{result.correct_count}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Всего вопросов</span>
              <span className="text-2xl font-extrabold text-slate-800">{result.total_questions}</span>
            </div>
          </div>

          {/* Review section */}
          {review && review.length > 0 && (
            <div className="text-left mb-8 max-h-72 overflow-y-auto space-y-3 pr-1">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Разбор ошибок</h3>
              {(review as SessionQuestionReview[]).filter(r => !r.is_correct).map(r => (
                <div key={r.order} className="bg-rose-50 rounded-xl p-3 border border-rose-100">
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    {r.order}. {r.question.text.substring(0, 80)}{r.question.text.length > 80 ? '...' : ''}
                  </p>
                  <div className="flex gap-3 text-xs font-bold">
                    <span className="text-rose-500">Ваш: {r.selected_option || '—'}</span>
                    <span className="text-emerald-600">Верно: {r.correct_option}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:brightness-110 shadow-lg shadow-primary/20 transition-all"
          >
            Вернуться на главную
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
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Сессия недоступна</h2>
          <p className="text-slate-500 mb-8">Возможно, тест уже завершен или не существует.</p>
          <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-primary text-white rounded-xl font-bold">
            Вернуться в Дашборд
          </button>
        </div>
      </div>
    );
  }

  // ─── Main Quiz UI ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-body p-4 sm:p-8 items-center justify-center">

      <div className="w-full max-w-3xl bg-surface rounded-[2rem] shadow-2xl border border-white/10 flex flex-col overflow-hidden relative z-10">

        {/* Header */}
        <header className="p-4 sm:p-6 sm:px-8 border-b border-border flex items-center justify-between bg-surface">
          <button onClick={() => setShowExitConfirm(true)} className="text-slate-400 hover:text-rose-500 transition-colors p-1 shrink-0">
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center justify-end gap-4 text-slate-500 font-bold">
            <div className="flex sm:hidden items-center gap-1.5 text-sm text-slate-500 font-medium">
              <span className="text-emerald-500 font-bold">{answeredCount}</span>
              <span>/</span>
              <span>{totalQuestions}</span>
              <span className="ml-1">отвечено</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="w-12 text-center">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </header>

        {/* Progress Numbers (Desktop) */}
        <div className="hidden sm:flex w-full flex-wrap items-center justify-center gap-2 py-4 px-4 sm:px-8 bg-surface border-b border-border">
          {questions.map(q => {
            const isActive = q.order === currentOrder;
            const isAnswered = q.is_answered;
            return (
              <button
                key={q.order}
                onClick={() => goToQuestion(q.order)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all shrink-0 ${
                  isActive
                    ? 'bg-primary text-white ring-4 ring-primary/20'
                    : isAnswered
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:ring-2 hover:ring-emerald-300'
                      : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'
                }`}
              >
                {q.order}
              </button>
            );
          })}
        </div>

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
              {currentQuestion.question.has_image && currentQuestion.question.image && (
                <img
                  src={currentQuestion.question.image}
                  alt={currentQuestion.question.image_caption || 'Изображение к вопросу'}
                  className="w-full max-h-64 object-contain rounded-xl mb-6 border border-slate-100"
                />
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
        <footer className="p-4 sm:px-8 sm:py-5 border-t border-border flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            {/* Finish early */}
            <button
              onClick={() => setShowFinishConfirm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-slate-500 hover:text-rose-500 hover:bg-rose-50 transition-colors text-sm"
            >
              Завершить досрочно
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Prev button */}
            <button
              onClick={goPrev}
              disabled={currentOrder <= 1}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Назад</span>
            </button>

            {/* Next / Finish button */}
            <button
              onClick={goNext}
              className={`flex items-center gap-2 px-8 py-2.5 text-white rounded-xl font-bold hover:brightness-110 transition-all shadow-md ${
                currentOrder === totalQuestions
                  ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                  : 'bg-primary shadow-primary/20'
              }`}
            >
              {currentOrder === totalQuestions ? 'Завершить' : 'Вперед'}
              {currentOrder !== totalQuestions && <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </footer>
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
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Сохранить прогресс?</h3>
                <p className="text-slate-500">Войдите, чтобы ваши результаты были сохранены в профиле.</p>
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
                  onClick={() => alert('Вход через Apple в разработке')}
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
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Вы уверены?</h3>
              <p className="text-slate-500 mb-8">Если вы выйдете, ваш текущий прогресс будет потерян.</p>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-md transition-colors"
                >
                  Выйти
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
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Завершить тест?</h3>
              <p className="text-slate-500 mb-2">
                Отвечено: <span className="font-bold text-slate-700">{answeredCount}</span> из{' '}
                <span className="font-bold text-slate-700">{totalQuestions}</span>
              </p>
              {answeredCount < totalQuestions && (
                <p className="text-amber-600 text-sm font-medium mb-6">
                  Есть {totalQuestions - answeredCount} неотвеченных вопросов.
                </p>
              )}
              {answeredCount >= totalQuestions && <div className="mb-6" />}

              <div className="flex gap-4">
                <button
                  onClick={() => setShowFinishConfirm(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={() => {
                    setShowFinishConfirm(false);
                    handleFinish();
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-primary hover:brightness-110 shadow-md transition-colors"
                >
                  Завершить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
