import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, Clock, ChevronRight, ChevronLeft, Loader2, BookOpen, UserPlus, ListOrdered, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { testengineApi, type TestQuestion } from '../lib/api/testengine';
import { useAuthStore } from '../store/useAuthStore';
import { useTranslation } from 'react-i18next';

export default function GuestQuizSession() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, loginAsGuest } = useAuthStore();
  const topicIdParam = searchParams.get('topic');

  // State
  const [guestTopics, setGuestTopics] = useState<any[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(
    topicIdParam ? Number(topicIdParam) : null
  );
  const [guestToken, setGuestToken] = useState<string | null>(null);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [currentOrder, setCurrentOrder] = useState(1); // 1-based
  const [answers, setAnswers] = useState<Record<number, string>>({}); // question.id -> selected_option

  const [loadingInit, setLoadingInit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<any | null>(null);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showMobileGridModal, setShowMobileGridModal] = useState(false);

  // Timer: 3 hours default (notice says token is valid 3 hours)
  const [timeLeft, setTimeLeft] = useState(3 * 60 * 60);

  useEffect(() => {
    if (!selectedTopicId) {
      // Load guest topics
      setLoadingInit(true);
      testengineApi.getGuestTopics()
        .then((res) => {
          const list = Array.isArray(res) ? res : (res as any).results || [];
          setGuestTopics(list);
        })
        .catch(console.error)
        .finally(() => setLoadingInit(false));
    } else {
      // Start guest session directly
      initGuestSession(selectedTopicId);
    }
  }, [selectedTopicId]);

  useEffect(() => {
    if (!guestToken) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [guestToken]);

  const initGuestSession = async (topicId: number) => {
    try {
      setLoadingInit(true);
      const data = await testengineApi.startGuestTest(topicId);
      setGuestToken(data.token);
      setQuestions(data.questions || []);
      setCurrentOrder(1);
    } catch (err) {
      console.error('Failed to start guest test:', err);
      alert('Ошибка запуска гостевого теста.');
    } finally {
      setLoadingInit(false);
    }
  };

  const currentQuestion = questions[currentOrder - 1];

  const handleSelectOption = (optionKey: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionKey,
    }));
  };

  const handleSubmitTest = async () => {
    if (!guestToken) return;
    try {
      setSubmitting(true);
      const answersPayload = Object.entries(answers).map(([qId, option]) => ({
        question: Number(qId),
        selected_option: option,
      }));

      const res = await testengineApi.submitGuestTest(guestToken, answersPayload);
      setSubmitResult(res);
      setShowRegisterModal(true);
    } catch (err) {
      console.error('Failed to submit guest test:', err);
      alert('Ошибка при отправке теста.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Step 0: Topic selection if none selected
  if (!selectedTopicId) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-bg p-4 sm:p-8 flex flex-col items-center justify-center">
        <div className="bg-white dark:bg-dark-surface rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-xl border border-slate-100 dark:border-dark-border">
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-dark-text-main mb-2">
            Гостевое тестирование
          </h2>
          <p className="text-sm text-slate-500 dark:text-dark-text-muted mb-6">
            Выберите тему для прохождения гостевого теста на 20 вопросов:
          </p>

          {loadingInit ? (
            <div className="py-12 flex justify-center text-violet-600">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {guestTopics.map((tp) => (
                <div
                  key={tp.id}
                  onClick={() => setSelectedTopicId(tp.id)}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-dark-border hover:border-violet-500 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/40 text-violet-600 flex items-center justify-center">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-dark-text-main">
                        {tp.name || tp.title}
                      </h4>
                      <p className="text-xs text-slate-400">20 вопросов</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-violet-500" />
                </div>
              ))}
              {guestTopics.length === 0 && (
                <p className="text-center py-8 text-slate-400 text-sm">
                  Нет доступных тем для гостей.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loadingInit) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-violet-600 mb-3" />
        <p className="font-medium text-sm">Загрузка гостевого теста...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-body p-4 sm:p-8 items-center justify-center relative z-10">
      
      {currentQuestion && (
        <div className="w-full max-w-6xl relative z-10 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 lg:gap-6">

          {/* Mobile / Tablet Compact Top Timer Bar (Right Aligned & Shorter) */}
          <div className="lg:hidden flex justify-end w-full max-w-2xl">
            <div className="bg-surface rounded-full shadow-md border border-white/20 px-3.5 py-1.5 flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-dark-text-main">
                VAQT
              </span>
              <span className="text-sm font-extrabold font-mono text-violet-700 dark:text-violet-400">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          {/* Left Column: Main Question Card (Centered) */}
          <div className="w-full max-w-2xl bg-surface rounded-[2rem] shadow-2xl border border-white/10 flex flex-col overflow-hidden relative z-10">
            {/* Header */}
            <header className="p-4 sm:p-6 sm:px-8 border-b border-border flex items-center justify-between bg-surface">
              <button 
                onClick={() => {
                  if (!isAuthenticated) loginAsGuest();
                  navigate('/dashboard');
                }} 
                className="text-slate-400 hover:text-rose-500 transition-colors p-1 shrink-0"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex items-center justify-end gap-3 font-bold">
                <span className="hidden sm:inline-block text-xs sm:text-sm text-slate-500 dark:text-dark-text-muted font-medium">
                  {t('guest.mode', 'Mehmon rejimi')}
                </span>
                <button
                  onClick={() => setShowMobileGridModal(true)}
                  className="lg:hidden flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors border border-slate-200/80 dark:border-slate-700 shadow-sm"
                >
                  <ListOrdered className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Savollar</span>
                  <span className="ml-0.5 text-violet-600 dark:text-violet-400 font-extrabold">{Object.keys(answers).length}/{questions.length}</span>
                </button>
              </div>
            </header>



            {/* Question Content */}
            <main className="p-5 sm:p-8 bg-surface flex-1 flex flex-col">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6 leading-relaxed text-left">
                {currentQuestion.text}
              </h2>

              {currentQuestion.image && (
                <div className="mb-6 rounded-2xl overflow-hidden max-h-64 flex justify-center bg-slate-50 border border-slate-100">
                  <img
                    src={currentQuestion.image}
                    alt={currentQuestion.image_caption || 'Illustration'}
                    className="object-contain max-h-64"
                  />
                </div>
              )}

              {/* Options */}
              <div className="space-y-3">
                {Object.entries(currentQuestion.options || {}).map(([key, val]) => {
                  const isSelected = answers[currentQuestion.id] === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleSelectOption(key)}
                      className={`w-full text-left px-5 py-3.5 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 group ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                        isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                      }`}>
                        {key}
                      </div>
                      <span className={`text-base sm:text-lg font-medium ${isSelected ? 'text-primary' : 'text-slate-700'}`}>
                        {val as string}
                      </span>
                    </button>
                  );
                })}
              </div>
            </main>

            {/* Bottom Nav */}
            <footer className="p-4 sm:px-8 sm:py-5 border-t border-border flex items-center justify-between bg-slate-50 gap-3">
              <button
                onClick={() => setShowFinishConfirm(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-slate-500 hover:text-rose-500 hover:bg-rose-50 transition-colors text-sm"
              >
                {t('quiz.early_finish', 'Erta yakunlash')}
              </button>

              <div className="flex items-center gap-2 sm:gap-3">
                {currentOrder > 1 && (
                  <button
                    onClick={() => setCurrentOrder((prev) => Math.max(1, prev - 1))}
                    className="flex items-center justify-center gap-1 px-3.5 sm:px-5 py-2.5 rounded-xl font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 transition-all text-sm sm:text-base"
                    title={t('common.back', 'Orqaga')}
                  >
                    <ChevronLeft className="w-5 h-5 shrink-0" />
                    <span className="hidden sm:inline">{t('common.back', 'Orqaga')}</span>
                  </button>
                )}

                {(() => {
                  const isAllAnswered = questions.every(q => Boolean(answers[q.id]));
                  const isLast = currentOrder === questions.length;
                  const showFinish = isAllAnswered || isLast;
                  return (
                    <button
                      onClick={() => {
                        if (showFinish) {
                          setShowFinishConfirm(true);
                        } else {
                          setCurrentOrder((prev) => Math.min(questions.length, prev + 1));
                        }
                      }}
                      disabled={submitting}
                      className={`flex items-center justify-center gap-1 sm:gap-2 px-4 sm:px-8 py-2.5 text-white rounded-xl font-bold hover:brightness-110 transition-all shadow-md text-sm sm:text-base disabled:opacity-50 ${
                        showFinish
                          ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                          : 'bg-primary shadow-primary/20'
                      }`}
                    >
                      {submitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <span className={!showFinish ? "hidden sm:inline" : ""}>
                            {showFinish ? t('quiz.finish', 'Tugatish') : t('common.next', 'Keyingisi')}
                          </span>
                          {!showFinish && <ChevronRight className="w-5 h-5 shrink-0" />}
                        </>
                      )}
                    </button>
                  );
                })()}
              </div>
            </footer>
          </div>

          {/* Right Column: Question Grid Container (Desktop Only) */}
          <div className="hidden lg:flex w-72 flex-col gap-4 shrink-0 lg:absolute lg:right-0 lg:top-1/2 lg:-translate-y-1/2 xl:relative xl:top-0 xl:translate-y-0">
            {/* Standalone Container 1: Timer Card */}
            <div className="bg-surface rounded-[2rem] shadow-xl border border-white/20 p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-violet-500/20">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-dark-text-main">
                  VAQT
                </span>
              </div>
              <span className="text-lg font-extrabold font-mono text-violet-700 dark:text-violet-400">
                {formatTime(timeLeft)}
              </span>
            </div>

            {/* Standalone Container 2: Question Navigation Card */}
            <div className="bg-surface rounded-[2rem] shadow-xl border border-white/20 p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                  Savollar
                </h5>
                <span className="text-xs font-extrabold px-2.5 py-1 bg-violet-100 text-violet-700 rounded-lg border border-violet-200">
                  {Object.keys(answers).length} / {questions.length}
                </span>
              </div>

              {/* Grid of Question Circles (5 columns, circular, no overflow scroll limit) */}
              <div className="grid grid-cols-5 gap-2.5 p-1.5">
                {questions.map((q, index) => {
                  const order = index + 1;
                  const isActive = order === currentOrder;
                  const isAnswered = Boolean(answers[q.id]);
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentOrder(order)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold transition-all ${
                        isActive
                          ? 'bg-primary text-white ring-4 ring-primary/20 scale-105 shadow-md shadow-violet-500/20'
                          : isAnswered
                            ? 'bg-emerald-500 text-white shadow-sm hover:ring-2 hover:ring-emerald-300'
                            : 'bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 shadow-sm'
                      }`}
                    >
                      {order}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      )}

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
              className="bg-white dark:bg-dark-surface rounded-3xl p-8 max-w-sm w-full border border-slate-100 dark:border-dark-border shadow-2xl relative text-center text-slate-800 dark:text-dark-text-main"
            >
              <h3 className="text-2xl font-bold mb-2">{t('quiz.finish_confirm_title', 'Testni yakunlaysizmi?')}</h3>
              {(() => {
                const answeredCount = Object.keys(answers).length;
                const totalQuestions = questions.length;
                return (
                  <>
                    <p className="text-slate-500 dark:text-dark-text-muted mb-2">
                      Javob berilgan: <span className="font-bold text-slate-700 dark:text-dark-text-main">{answeredCount}</span> / <span className="font-bold text-slate-700 dark:text-dark-text-main">{totalQuestions}</span>
                    </p>
                    {answeredCount < totalQuestions && (
                      <p className="text-amber-600 dark:text-amber-400 text-sm font-medium mb-6">
                        Yechilmagan savollar soni: {totalQuestions - answeredCount} ta
                      </p>
                    )}
                    {answeredCount >= totalQuestions && <div className="mb-6" />}
                  </>
                );
              })()}

              <div className="flex gap-4">
                <button
                  onClick={() => setShowFinishConfirm(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-slate-600 dark:text-dark-text-muted bg-slate-100 dark:bg-dark-bg hover:bg-slate-200 transition-colors text-sm"
                >
                  {t('common.cancel', 'Bekor qilish')}
                </button>
                <button
                  onClick={() => {
                    setShowFinishConfirm(false);
                    handleSubmitTest();
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-primary hover:brightness-110 shadow-md transition-colors text-sm"
                >
                  {t('quiz.finish', 'Tugatish')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Registration Offer & Results Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-dark-surface rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-dark-border text-center relative text-slate-800 dark:text-dark-text-main">
            
            {/* Score Percentage Badge / Circle */}
            <div className="mb-6">
              <div className="w-20 h-20 rounded-full bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex flex-col items-center justify-center mx-auto mb-3 shadow-inner">
                <span className="text-2xl font-black">{submitResult?.score_percent ?? 0}%</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Natija</span>
              </div>

              <h3 className="text-2xl font-extrabold mb-1">
                {t('guest.results_title', 'Test yakunlandi!')}
              </h3>
              <p className="text-sm text-slate-500 dark:text-dark-text-muted font-medium">
                {t('guest.accuracy_summary', 'Aniqlik ko\'rsatkichi')}: <strong className="text-violet-600 dark:text-violet-400 font-extrabold">{submitResult?.score_percent ?? 0}%</strong> ({submitResult?.correct_count ?? 0} / {submitResult?.total_questions ?? questions.length} {t('guest.correct_answers', 'to\'g\'ri')})
              </p>
            </div>

            {/* Blurred lock overlay message */}
            <div className="relative rounded-2xl bg-slate-50 dark:bg-dark-bg p-4 border border-slate-100 dark:border-dark-border mb-6 overflow-hidden">
              <div className="filter blur-[3px] select-none pointer-events-none opacity-40 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-dark-text-main">
                  <span>1-savol: To'g'ri (A)</span>
                  <span className="text-emerald-500">✓</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-dark-text-main">
                  <span>2-savol: Xato (C)</span>
                  <span className="text-rose-500">✗</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-dark-text-main">
                  <span>3-savol: To'g'ri (B)</span>
                  <span className="text-emerald-500">✓</span>
                </div>
              </div>

              <div className="absolute inset-0 bg-white/70 dark:bg-dark-surface/80 backdrop-blur-[2px] flex flex-col items-center justify-center p-3 text-center">
                <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center mb-1.5 shadow-sm">
                  <UserPlus className="w-4 h-4" />
                </div>
                <p className="text-xs font-extrabold text-slate-800 dark:text-dark-text-main max-w-xs leading-snug">
                  {t('guest.blur_notice', 'Qaysi savollar to\'g\'ri yoki xatoligini ko\'rish va to\'liq tahlil uchun ro\'yxatdan o\'ting!')}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-violet-600 hover:bg-violet-700 transition-all shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 text-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>{t('auth.btn_register', 'Ro\'yxatdan o\'tish')}</span>
              </button>

              <button
                onClick={() => {
                  if (!isAuthenticated) loginAsGuest();
                  navigate('/dashboard');
                }}
                className="w-full py-3 px-4 rounded-xl font-bold text-slate-500 hover:text-slate-700 dark:text-dark-text-muted transition-colors text-sm"
              >
                {t('common.later', 'Keyinroq')}
              </button>
            </div>
          </div>
        </div>
      )}

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
                    Savollar
                  </h4>
                  <span className="text-xs font-extrabold px-2.5 py-0.5 bg-violet-50 text-violet-700 rounded-lg">
                    {Object.keys(answers).length} / {questions.length}
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
                  {questions.map((q, index) => {
                    const order = index + 1;
                    const isActive = order === currentOrder;
                    const isAnswered = Boolean(answers[q.id]);
                    return (
                      <button
                        key={q.id}
                        onClick={() => {
                          setCurrentOrder(order);
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
                        {order}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Submitting Preloader Overlay */}
      <AnimatePresence>
        {submitting && (
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
                  Test yakunlanmoqda...
                </h3>
                <p className="text-xs text-slate-500 dark:text-dark-text-muted font-medium leading-relaxed">
                  Natijalaringiz hisoblanmoqda va saqlanmoqda
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
