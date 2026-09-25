import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { api } from '../lib/api';
import { introApi, type IntroQuestion, type IntroSubmitResponse } from '../lib/api/intro';
import { useAuthStore } from '../store/useAuthStore';
import { useQuizStore } from '../store/useQuizStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Brain, Loader2, X, ChevronRight, ChevronLeft, Clock, User as UserIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function OnboardingQuiz() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, loginAsGuest, user, isGuest, isAuthenticated } = useAuthStore();
  const { selectedSubjects } = useQuizStore();

  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string>('');
  const [questions, setQuestions] = useState<IntroQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitResult, setSubmitResult] = useState<IntroSubmitResponse | null>(null);

  const [stage, setStage] = useState<'quiz' | 'auth' | 'results'>('quiz');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  useEffect(() => {
    fetchRandomIntroQuestions();
  }, []);

  const fetchRandomIntroQuestions = async () => {
    setLoading(true);
    try {
      const data = await introApi.getStart();
      setToken(data.token);
      setQuestions(data.questions || []);
    } catch (err) {
      console.error('Failed to fetch intro questions from backend', err);
      // Fallback 4 intro questions
      setQuestions([
        {
          id: 1,
          kind: 'logic',
          text: 'Mantiqiy ketma-ketlikni davom ettiring: 2, 4, 8, 16, ...',
          options: { A: '32', B: '24', C: '64', D: '30' }
        },
        {
          id: 2,
          kind: 'logic',
          text: 'To\'g\'ri to\'rtburchakning eni 4 sm, bo\'yi 6 sm. Yuzini toping.',
          options: { A: '24 sm²', B: '20 sm²', C: '10 sm²', D: '16 sm²' }
        },
        {
          id: 3,
          kind: 'logic',
          text: 'Agar barcha mushuklar hayvon bo\'lsa va Tom mushuk bo\'lsa, Tom kim?',
          options: { A: 'Hayvon', B: 'O\'simlik', C: 'Qush', D: 'Inson' }
        },
        {
          id: 4,
          kind: 'psychology',
          text: 'Yangi fan yoki mavzuni o\'rganishda sizga qaysi usul eng ko\'p yordam beradi?',
          options: { A: 'Amaliy mashqlar va testlar', B: 'Kitob va konspektlar', C: 'Videodarsliklar', D: 'Boshqalar bilan muhokama' }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stage !== 'quiz') return;
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [stage]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentQ = questions[currentIdx];
  const selectedOption = currentQ ? (answers[currentQ.id] || '') : '';

  const handleSelectOption = (optKey: string) => {
    if (!currentQ) return;
    setAnswers(prev => ({ ...prev, [currentQ.id]: optKey }));
  };

  const handleNextQuestion = () => {
    if (!selectedOption) return;

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setShowConfirmModal(true);
    }
  };

  const handlePrevQuestion = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleGoToQuestion = (idx: number) => {
    setCurrentIdx(idx);
  };

  const handleFinishQuiz = async () => {
    setShowConfirmModal(false);
    if (token) {
      try {
        const payloadAnswers = Object.entries(answers).map(([qid, opt]) => ({
          question: Number(qid),
          selected_option: opt,
        }));
        const res = await introApi.submit({ token, answers: payloadAnswers });
        setSubmitResult(res);
      } catch (err) {
        console.error('Failed to submit intro quiz answers', err);
      }
    }
    setStage('auth');
  };

  const calculateScore = () => {
    if (submitResult) {
      return submitResult.correct_count;
    }
    return Object.keys(answers).length;
  };

  const totalScoredQuestions = submitResult ? (submitResult.scored_count || questions.length) : questions.length;

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-body p-4 sm:p-8 items-center justify-center relative z-10">
      <AnimatePresence mode="wait">

        {stage === 'quiz' && (
          loading ? (
            <div className="w-full max-w-md bg-surface rounded-[2rem] shadow-xl p-12 text-center flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-violet-600 animate-spin mb-4" />
              <p className="text-slate-600 font-bold">Savollar yuklanmoqda...</p>
            </div>
          ) : (
            <div className="w-full max-w-6xl relative z-10 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 lg:gap-6">

              {/* Mobile / Tablet Compact Top Timer Bar */}
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

              {/* Center: Main Question Card */}
              <motion.div 
                key="quiz"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="w-full max-w-2xl bg-surface rounded-[2rem] shadow-2xl border border-white/10 flex flex-col overflow-hidden relative z-10"
              >
                {/* Header */}
                <header className="p-4 sm:p-6 sm:px-8 border-b border-border flex items-center justify-between bg-surface">
                  <button onClick={() => navigate('/onboarding')} className="text-slate-400 hover:text-rose-500 transition-colors p-1 shrink-0">
                    <X className="w-6 h-6" />
                  </button>

                  <div className="flex items-center justify-end gap-4 text-slate-500 font-bold">
                    <div className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-violet-600" />
                      <span className="text-sm">{t('onboarding_quiz.title', 'Kirish testi (4 savol)')}</span>
                    </div>
                  </div>
                </header>

                {/* Content */}
                <div className="p-6 sm:p-10 flex-1">
                  {currentQ && (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentQ.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6 leading-relaxed text-left">
                          {currentQ.text}
                        </h2>

                        <div className="space-y-3">
                          {Object.entries(currentQ.options || {}).map(([optKey, optVal]) => {
                            const isSelected = selectedOption === optKey;
                            return (
                              <button
                                key={optKey}
                                onClick={() => handleSelectOption(optKey)}
                                className={`w-full text-left px-5 py-3.5 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 group ${
                                  isSelected 
                                    ? 'border-primary bg-primary/5 shadow-sm' 
                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                                  isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                                }`}>
                                  {optKey}
                                </div>
                                <span className={`text-base sm:text-lg font-medium ${isSelected ? 'text-primary' : 'text-slate-700'}`}>
                                  {optVal}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>

                {/* Footer */}
                <footer className="p-6 sm:px-8 border-t border-border flex items-center justify-between bg-slate-50 gap-3">
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:text-rose-500 hover:bg-rose-50 transition-colors text-sm sm:text-base"
                  >
                    {t('onboarding_quiz.finish_early', 'Erta yakunlash')}
                  </button>

                  <div className="flex items-center gap-3">
                    {currentIdx > 0 && (
                      <button
                        onClick={handlePrevQuestion}
                        className="flex items-center gap-1 px-5 py-2.5 rounded-xl font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 transition-all text-sm sm:text-base"
                      >
                        <ChevronLeft className="w-5 h-5" />
                        <span>{t('onboarding_quiz.btn_back', 'Orqaga')}</span>
                      </button>
                    )}

                    {(() => {
                      const isAllAnswered = questions.every(q => Boolean(answers[q.id]));
                      const isLast = currentIdx === questions.length - 1;
                      const showFinish = isAllAnswered || isLast;
                      return (
                        <button
                          onClick={handleNextQuestion}
                          disabled={!selectedOption}
                          className={`flex items-center gap-2 px-6 sm:px-8 py-2.5 text-white rounded-xl font-bold hover:brightness-110 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base ${
                            showFinish
                              ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' 
                              : 'bg-primary shadow-primary/20'
                          }`}
                        >
                          <span>{showFinish ? t('onboarding_quiz.btn_finish', 'Yakunlash') : t('onboarding_quiz.btn_forward', 'Keyingisi')}</span>
                          {!showFinish && <ChevronRight className="w-5 h-5" />}
                        </button>
                      );
                    })()}
                  </div>
                </footer>
              </motion.div>

              {/* Right Column: Profile & Question Grid */}
              <div className="hidden lg:flex w-72 flex-col gap-4 shrink-0 lg:absolute lg:right-0 lg:top-1/2 lg:-translate-y-1/2 xl:relative xl:top-0 xl:translate-y-0">
                {/* Timer Card */}
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

                {/* Question Grid Card */}
                <div className="bg-surface rounded-[2rem] shadow-xl border border-white/20 p-6 flex flex-col gap-5">
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

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                        {t('quiz.questions', 'Savollar')}
                      </h5>
                      <span className="text-xs font-extrabold px-2.5 py-0.5 bg-violet-50 text-violet-700 rounded-lg">
                        {Object.keys(answers).length} / {questions.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-2.5">
                      {questions.map((q, index) => {
                        const num = index + 1;
                        const isActive = index === currentIdx;
                        const isAnswered = Boolean(answers[q.id]);
                        return (
                          <button
                            key={num}
                            onClick={() => handleGoToQuestion(index)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold transition-all ${
                              isActive 
                                ? 'bg-primary text-white ring-4 ring-primary/20 scale-105 shadow-md shadow-violet-500/20' 
                                : isAnswered
                                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:ring-2 hover:ring-emerald-300'
                                  : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        )}

        {stage === 'auth' && (
          <motion.div 
            key="auth"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md bg-surface rounded-[2rem] shadow-xl border border-slate-100 p-8 text-center"
          >
            <h2 className="text-3xl font-extrabold text-slate-800 mb-3">
              {t('onboarding_quiz.auth_title', 'Natijangizni saqlang!')}
            </h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
              {t('onboarding_quiz.auth_desc', { type: selectedSubjects.length > 0 ? t('onboarding_quiz.auth_type_subjects') : t('onboarding_quiz.auth_type_direction') })}
            </p>

            {isAuthenticating ? (
              <div className="flex flex-col items-center py-6">
                <Loader2 className="w-8 h-8 text-violet-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">{t('onboarding_quiz.auth_loading', 'Tizimga kirilmoqda...')}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 items-center w-full px-4 mb-4">
                <div className="flex justify-center">
                  <GoogleLogin
                    width="280"
                    onSuccess={async (credentialResponse) => {
                      setIsAuthenticating(true);
                      try {
                        const response = await api.post('/api/auth/google/', { 
                          id_token: credentialResponse.credential 
                        });
                        const { access, refresh, user } = response.data;
                        login(user || { id: '1', name: 'Student', email: '', role: 'student' }, access, refresh);
                        setStage('results');
                      } catch (error) {
                        console.error('Google Auth Failed', error);
                        alert('Авторизацияда xatolik. Qaytadan urinib ko\'ring.');
                      } finally {
                        setIsAuthenticating(false);
                      }
                    }}
                    onError={() => {
                      console.error('Google Auth Failed');
                    }}
                  />
                </div>

                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      loginAsGuest();
                    }
                    setStage('results');
                  }}
                  className="w-full max-w-[280px] py-2.5 rounded-xl font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors text-sm"
                >
                  {t('onboarding_quiz.btn_skip', 'O\'tkazib yuborish')}
                </button>
              </div>
            )}
            <p className="text-xs text-slate-400 mt-6">
              {t('onboarding_quiz.auth_footer', 'Ro\'yxatdan o\'tish orqali foydalanish shartlariga rozilik bildirasiz.')}
            </p>
          </motion.div>
        )}

        {stage === 'results' && (
          <motion.div 
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-surface rounded-[2rem] shadow-xl border border-slate-100 p-8 text-center"
          >
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10" />
            </div>

            <h2 className="text-3xl font-extrabold text-slate-800 mb-2">
              {t('onboarding_quiz.results_title', 'Tabriklaymiz!')}
            </h2>
            <p className="text-slate-500 mb-8">
              {t('onboarding_quiz.results_desc', 'Siz kirish testini muvaffaqiyatli topshirdingiz!')}
            </p>

            <div className="bg-slate-50 rounded-2xl p-6 mb-8">
              <div className="text-5xl font-extrabold text-violet-600 mb-2">
                {calculateScore()} / {totalScoredQuestions}
              </div>
              <p className="font-medium text-slate-600">
                {t('onboarding_quiz.results_correct', 'To\'g\'ri javoblar')}
              </p>
            </div>

            <button
              onClick={() => {
                if (!isAuthenticated) {
                  loginAsGuest();
                }
                navigate('/dashboard');
              }}
              className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-violet-500/30"
            >
              {t('onboarding_quiz.btn_dashboard', 'Boshqaruv paneliga o\'tish')}
            </button>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-md p-8 rounded-3xl shadow-2xl relative text-slate-800 animate-in zoom-in-95 duration-300 text-center">

            <h3 className="text-2xl font-bold mb-4 text-slate-900">{t('onboarding_quiz.confirm_title', 'Testni yakunlaysizmi?')}</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">
              {t('onboarding_quiz.confirm_desc', 'Barcha berilgan javoblaringiz saqlanadi va natijalaringiz hisoblanadi.')}
            </p>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                {t('onboarding_quiz.btn_cancel', 'Bekor qilish')}
              </button>
              <button 
                onClick={handleFinishQuiz}
                className="flex-1 py-4 rounded-xl font-bold text-white bg-primary hover:bg-violet-600 transition-colors shadow-[0_0_20px_rgba(139,92,246,0.3)]"
              >
                {t('onboarding_quiz.btn_finish', 'Yakunlash')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
