import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { useQuizStore } from '../store/useQuizStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Brain, Loader2, X, ChevronRight, Apple } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const STATIC_QUESTIONS = [
  {
    id: 1,
    text: "Найдите закономерность и продолжите ряд: 2, 4, 8, 16, ...",
    options: ["24", "30", "32", "64"],
    correct: "32"
  },
  {
    id: 2,
    text: "Что из перечисленного не является языком программирования?",
    options: ["Python", "HTML", "Java", "C++"],
    correct: "HTML"
  },
  {
    id: 3,
    text: "Если 5 кошек ловят 5 мышей за 5 минут, сколько времени потребуется 1 кошке, чтобы поймать 1 мышь?",
    options: ["1 минута", "5 минут", "25 минут", "10 минут"],
    correct: "5 минут"
  },
  {
    id: 4,
    text: "Выберите лишнее слово:",
    options: ["Квадрат", "Круг", "Треугольник", "Куб"],
    correct: "Куб"
  }
];

export default function OnboardingQuiz() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { selectedSubjects } = useQuizStore();
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [selectedOption, setSelectedOption] = useState<string>('');
  
  const [stage, setStage] = useState<'quiz' | 'auth' | 'results'>('quiz');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const currentQ = STATIC_QUESTIONS[currentIdx];

  const handleNextQuestion = () => {
    if (!selectedOption) return;
    
    setAnswers(prev => ({ ...prev, [currentQ.id]: selectedOption }));
    
    if (currentIdx < STATIC_QUESTIONS.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOption('');
    } else {
      setShowConfirmModal(true);
    }
  };

  const calculateScore = () => {
    let s = 0;
    STATIC_QUESTIONS.forEach(q => {
      if (answers[q.id] === q.correct) s++;
    });
    return s;
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-body p-4 sm:p-8 items-center justify-center relative z-10">
      <AnimatePresence mode="wait">
        
        {stage === 'quiz' && (
          <motion.div 
            key="quiz"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-3xl bg-surface rounded-[2rem] shadow-2xl border border-white/10 flex flex-col overflow-hidden relative z-10"
          >
            {/* Header */}
            <header className="p-4 sm:p-6 sm:px-8 border-b border-border flex items-center justify-between bg-surface">
              <button onClick={() => navigate('/onboarding')} className="text-slate-400 hover:text-rose-500 transition-colors p-1 shrink-0">
                <X className="w-6 h-6" />
              </button>
              
              <div className="flex items-center justify-end gap-4 text-slate-500 font-bold">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  <span className="text-sm">{t('onboarding_quiz.title')}</span>
                </div>
              </div>
            </header>

            {/* Progress Numbers */}
            <div className="flex gap-2 overflow-x-auto py-4 px-4 sm:px-8 bg-surface border-b border-border justify-center">
              {STATIC_QUESTIONS.map((_, index) => {
                const num = index + 1;
                const isActive = num === currentIdx + 1;
                const isPast = num < currentIdx + 1;
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
              })}
            </div>

            {/* Content */}
            <div className="p-6 sm:p-10">
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
                    {currentQ.options.map((opt, i) => {
                      const isSelected = selectedOption === opt;
                      const letter = ['A', 'B', 'C', 'D'][i];
                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedOption(opt)}
                          className={`w-full text-left px-5 py-3.5 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 group ${
                            isSelected 
                              ? 'border-primary bg-primary/5 shadow-sm' 
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                            isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                          }`}>
                            {letter}
                          </div>
                          <span className={`text-base sm:text-lg font-medium ${isSelected ? 'text-primary' : 'text-slate-700'}`}>
                            {opt}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <footer className="p-6 sm:px-8 border-t border-border flex items-center justify-between bg-slate-50">
              <button
                onClick={() => setShowConfirmModal(true)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:text-rose-500 hover:bg-rose-50 transition-colors"
              >
                {t('onboarding_quiz.finish_early')}
              </button>
              
              <button
                onClick={handleNextQuestion}
                disabled={!selectedOption}
                className={`flex items-center gap-2 px-8 py-2.5 text-white rounded-xl font-bold hover:brightness-110 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
                  currentIdx === STATIC_QUESTIONS.length - 1
                    ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' 
                    : 'bg-primary shadow-primary/20'
                }`}
              >
                {currentIdx === STATIC_QUESTIONS.length - 1 ? t('onboarding_quiz.btn_finish') : t('onboarding_quiz.btn_forward')}
                {currentIdx !== STATIC_QUESTIONS.length - 1 && <ChevronRight className="w-5 h-5" />}
              </button>
            </footer>
          </motion.div>
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
              {t('onboarding_quiz.auth_title')}
            </h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
              {t('onboarding_quiz.auth_desc', { type: selectedSubjects.length > 0 ? t('onboarding_quiz.auth_type_subjects') : t('onboarding_quiz.auth_type_direction') })}
            </p>

            {isAuthenticating ? (
              <div className="flex flex-col items-center py-6">
                <Loader2 className="w-8 h-8 text-violet-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">{t('onboarding_quiz.auth_loading')}</p>
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
                        alert('Ошибка авторизации. Попробуйте снова.');
                      } finally {
                        setIsAuthenticating(false);
                      }
                    }}
                    onError={() => {
                      console.error('Google Auth Failed');
                    }}
                  />
                </div>
              </div>
            )}
            <p className="text-xs text-slate-400 mt-6">
              {t('onboarding_quiz.auth_footer')}
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
              {t('onboarding_quiz.results_title')}
            </h2>
            <p className="text-slate-500 mb-8">
              {t('onboarding_quiz.results_desc')}
            </p>

            <div className="bg-slate-50 rounded-2xl p-6 mb-8">
              <div className="text-5xl font-extrabold text-violet-600 mb-2">
                {calculateScore()} / {STATIC_QUESTIONS.length}
              </div>
              <p className="font-medium text-slate-600">
                {t('onboarding_quiz.results_correct')}
              </p>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-violet-500/30"
            >
              {t('onboarding_quiz.btn_dashboard')}
            </button>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-md p-8 rounded-3xl shadow-2xl relative text-slate-800 animate-in zoom-in-95 duration-300 text-center">

            
            <h3 className="text-2xl font-bold mb-4 text-slate-900">{t('onboarding_quiz.confirm_title')}</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">
              {t('onboarding_quiz.confirm_desc')}
            </p>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                {t('onboarding_quiz.btn_cancel')}
              </button>
              <button 
                onClick={() => {
                  setShowConfirmModal(false);
                  setStage('auth');
                }}
                className="flex-1 py-4 rounded-xl font-bold text-white bg-primary hover:bg-violet-600 transition-colors shadow-[0_0_20px_rgba(139,92,246,0.3)]"
              >
                {t('onboarding_quiz.btn_finish')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
