import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { useProgressStore } from '../store/useProgressStore';
import { X, Clock, ChevronRight, Loader2, Apple } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { testengineApi, type TestQuestion, type TestSession } from '../lib/api/testengine';

export default function QuizSession() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { isAuthenticated, login } = useAuthStore();
  const { decrementReviewsToday } = useProgressStore();

  const [question, setQuestion] = useState<TestQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [quizResult, setQuizResult] = useState<any | null>(null);
  const [sessionDetail, setSessionDetail] = useState<TestSession | null>(null);

  useEffect(() => {
    if (!sessionId) {
      navigate('/dashboard');
      return;
    }

    const fetchSessionDetail = async () => {
      try {
        const detail = await testengineApi.getSessionDetail(sessionId);
        setSessionDetail(detail);
      } catch (error) {
        console.error("Failed to fetch session detail:", error);
      }
    };
    
    fetchSessionDetail();
    
    // Fetch first question
    fetchNextQuestion();

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionId, navigate]);

  const fetchNextQuestion = async () => {
    try {
      setLoadingQuestion(true);
      const nextQ = await testengineApi.getNextQuestion(sessionId!);
      setQuestion(nextQ);
      setSelectedOption('');
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 400) {
        // No more questions or session finished
        setQuestion(null);
        handleFinish();
      } else {
        console.error(error);
      }
    } finally {
      setLoadingQuestion(false);
    }
  };

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
      setQuizResult(result);
    } catch (e) {
      console.error(e);
      navigate('/dashboard');
    }
    decrementReviewsToday();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSetAnswer = (key: string) => {
    setSelectedOption(key);
  };

  const nextQuestion = async () => {
    if (!selectedOption || !question) return;
    try {
      setLoadingQuestion(true);
      await testengineApi.syncSession(sessionId!, [{
        question: question.id,
        selected_option: selectedOption,
        is_correct: false // dummy value for serializer compatibility
      }]);
      setQuestionNumber(prev => prev + 1);
      await fetchNextQuestion();
    } catch (e) {
      console.error(e);
      setLoadingQuestion(false);
    }
  };

  if (quizResult) {
    const accuracy = quizResult.answers_count > 0 
      ? Math.round((quizResult.correct_answers_count / quizResult.answers_count) * 100)
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
              <span className="text-2xl font-extrabold text-slate-800">{formatTime(quizResult.duration_seconds || 0)}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Правильно</span>
              <span className="text-2xl font-extrabold text-emerald-500">{quizResult.correct_answers_count}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Всего вопросов</span>
              <span className="text-2xl font-extrabold text-slate-800">{quizResult.answers_count}</span>
            </div>
          </div>
          
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

  if (loadingQuestion && !question) return (
    <div className="min-h-screen bg-transparent flex flex-col font-body p-4 sm:p-8 items-center justify-center">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-body p-4 sm:p-8 items-center justify-center">
      
      {(!question && !quizResult && !showAuthModal) ? (
        <div className="w-full max-w-3xl bg-surface rounded-[2rem] shadow-2xl border border-white/10 p-8 text-center relative z-10">
           <h2 className="text-2xl font-bold text-slate-800 mb-4">Сессия недоступна</h2>
           <p className="text-slate-500 mb-8">Возможно, тест уже завершен или не существует.</p>
           <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-primary text-white rounded-xl font-bold">
             Вернуться в Дашборд
           </button>
        </div>
      ) : (!question && !quizResult) ? null : (
        <div className="w-full max-w-3xl bg-surface rounded-[2rem] shadow-2xl border border-white/10 flex flex-col overflow-hidden relative z-10">
          
          {/* Header */}
          <header className="p-4 sm:p-6 sm:px-8 border-b border-border flex items-center justify-between bg-surface">
            <button onClick={() => setShowExitConfirm(true)} className="text-slate-400 hover:text-rose-500 transition-colors p-1 shrink-0">
              <X className="w-6 h-6" />
            </button>
          
          <div className="flex items-center justify-end gap-4 text-slate-500 font-bold">
            <div className="sm:hidden text-sm px-3 py-1 bg-slate-100 rounded-lg">
              {questionNumber} / {sessionDetail?.total_questions || '?'}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="w-12 text-center">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </header>

        {/* Question Container */}
        <main className="p-5 sm:p-8 bg-surface flex-1 flex flex-col">
          {/* Pagination Circles (Desktop only) */}
          <div className="hidden sm:flex w-full flex-wrap items-center justify-center gap-3 pb-4 pt-2 px-2">
            {sessionDetail?.total_questions ? (
              Array.from({ length: sessionDetail.total_questions }).map((_, index) => {
                const num = index + 1;
                const isActive = num === questionNumber;
                const isPast = num < questionNumber;
                
                return (
                  <div
                    key={num}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold transition-all shrink-0 ${
                      isActive 
                        ? 'bg-primary text-white ring-4 ring-primary/20' 
                        : isPast
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {num}
                  </div>
                );
              })
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold transition-all shrink-0 bg-primary text-white ring-4 ring-primary/20" 
              >
                {questionNumber}
              </div>
            )}
          </div>
          <AnimatePresence mode="wait">
            <motion.div 
              key={question?.id || questionNumber}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6 leading-relaxed text-left">
                {question?.text}
              </h2>

              <div className="space-y-3">
                {question && Object.entries(question.options).map(([key, opt]) => {
                  const isSelected = selectedOption === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleSetAnswer(key)}
                      className={`w-full text-left px-5 py-3.5 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 group ${
                        isSelected 
                          ? 'border-primary bg-primary/5 shadow-sm' 
                          : 'border-border hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                        isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                      }`}>
                        {key}
                      </div>
                      <span className={`text-base sm:text-lg font-medium ${isSelected ? 'text-primary' : 'text-slate-700'}`}>
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer Navigation */}
        <footer className="p-6 sm:px-8 border-t border-border flex items-center justify-between bg-slate-50">
          <button
            onClick={() => setShowFinishConfirm(true)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:text-rose-500 hover:bg-rose-50 transition-colors"
          >
            Завершить досрочно
          </button>
          
          <button
            onClick={nextQuestion}
            disabled={!selectedOption || loadingQuestion}
            className={`flex items-center gap-2 px-8 py-2.5 text-white rounded-xl font-bold hover:brightness-110 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
              sessionDetail?.total_questions && questionNumber === sessionDetail.total_questions 
                ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' 
                : 'bg-primary shadow-primary/20'
            }`}
          >
            {loadingQuestion ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : sessionDetail?.total_questions && questionNumber === sessionDetail.total_questions ? (
              'Завершить'
            ) : (
              'Вперед'
            )}
            {!loadingQuestion && (!sessionDetail?.total_questions || questionNumber !== sessionDetail.total_questions) && <ChevronRight className="w-5 h-5" />}
          </button>
        </footer>
      </div>
      )}

      {/* Auth Modal for Unauthenticated Users trying to finish */}
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
                          id_token: credentialResponse.credential 
                        });
                        
                        const { access, refresh, user } = response.data;
                        login(user || { id: '1', name: 'Student', email: '', role: 'student' }, access, refresh);
                        setShowAuthModal(false);
                        completeQuiz();
                      } catch (error) {
                        console.error('Google Auth Failed', error);
                      }
                    }}
                    onError={() => {
                      console.error('Google Auth Failed');
                    }}
                  />
                </div>
                
                <button
                  onClick={() => alert('Вход через Apple в разработке')}
                  className="flex items-center justify-center gap-2 bg-black text-white shadow-sm hover:bg-gray-900 transition-colors"
                  style={{ width: '280px', height: '40px', borderRadius: '4px' }}
                >
                  <Apple className="w-5 h-5 mb-0.5" />
                  <span className="text-sm font-medium font-roboto" style={{ fontFamily: 'Roboto, arial, sans-serif' }}>Sign in with Apple</span>
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
              <p className="text-slate-500 mb-8">Вы уверены, что хотите завершить тестирование? Вернуться к ответам будет нельзя.</p>
              
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
