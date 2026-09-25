import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { introApi, type IntroQuestion, type IntroSubmitResponse } from '../lib/api/intro';
import { useAuthStore } from '../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, Loader2, ArrowRight, CheckCircle2, XCircle, ArrowLeft, Trophy, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function IntroQuiz() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isGuest, isAuthenticated } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [token, setToken] = useState<string>('');
  const [questions, setQuestions] = useState<IntroQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<IntroSubmitResponse | null>(null);

  useEffect(() => {
    // Fetch random 4 intro questions
    setLoading(true);
    introApi
      .getStart()
      .then((data) => {
        setToken(data.token);
        setQuestions(data.questions);
      })
      .catch((err: any) => {
        if (err?.response?.status === 403 && err?.response?.data?.code === 'already_registered') {
          setError(t('intro.already_registered', 'Siz ro\'yxatdan o\'tgansiz'));
        } else if (err?.response?.status === 503) {
          setError(t('intro.not_enough_questions', 'Savollar tez kunda qo\'shiladi'));
        } else {
          setError(err?.response?.data?.detail || 'Xatolik yuz berdi');
        }
      })
      .finally(() => setLoading(false));
  }, [i18n.language, t]);

  const currentQ = questions[currentIdx];
  const selectedOpt = currentQ ? answers[currentQ.id] || '' : '';

  const handleSelectOption = (optKey: string) => {
    if (result) return; // Read-only after submit
    setAnswers((prev) => ({ ...prev, [currentQ.id]: optKey }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payloadAnswers = Object.entries(answers).map(([qId, opt]) => ({
        question: Number(qId),
        selected_option: opt,
      }));
      const res = await introApi.submit({ token, answers: payloadAnswers });
      setResult(res);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  const getEmbedVideoUrl = (url: string) => {
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/');
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1];
      return `https://www.youtube.com/embed/${id}`;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-bg flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-violet-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-dark-text-muted font-bold">
            {t('common.loading', 'Yuklanmoqda...')}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-bg flex items-center justify-center p-4">
        <div className="bg-white dark:bg-dark-surface p-8 rounded-3xl max-w-md w-full border border-slate-200 dark:border-dark-border text-center shadow-xl">
          <Brain className="w-12 h-12 text-violet-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 dark:text-dark-text-main mb-2">Kirish testi</h3>
          <p className="text-slate-500 dark:text-dark-text-muted text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate(isAuthenticated || isGuest ? '/dashboard' : '/')}
            className="w-full py-3 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-colors"
          >
            {t('common.back', 'Orqaga')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg text-slate-800 dark:text-dark-text-main flex flex-col items-center justify-center p-4 py-8 relative z-10">
      <div className="w-full max-w-2xl">
        
        {/* Header navigation bar */}
        <div className="flex items-center justify-between mb-6 px-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-dark-text-main transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('common.back', 'Orqaga')}</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 font-bold text-xs">
            <Sparkles className="w-4 h-4" />
            <span>Kirish testi</span>
          </div>
        </div>

        {/* Results Screen */}
        {result ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-dark-surface rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 dark:border-dark-border text-center"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-dark-text-main mb-2">
              Natijangiz!
            </h2>
            <p className="text-slate-500 dark:text-dark-text-muted text-sm mb-6 max-w-md mx-auto">
              {result.message}
            </p>

            {/* Score summary */}
            <div className="bg-slate-50 dark:bg-dark-bg rounded-2xl p-5 mb-6 flex items-center justify-around border border-slate-100 dark:border-dark-border">
              <div>
                <span className="text-3xl font-black text-violet-600 dark:text-violet-400">
                  {result.correct_count} / {result.scored_count}
                </span>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">To'g'ri javoblar</p>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-dark-border"></div>
              <div>
                <span className="text-3xl font-black text-slate-700 dark:text-dark-text-main">
                  {result.answered_count} / {result.question_count}
                </span>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Javob berildi</p>
              </div>
            </div>

            {/* Question explanations breakdown */}
            <div className="space-y-3 mb-8 text-left max-h-64 overflow-y-auto pr-1">
              {result.results.map((res, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border text-xs"
                >
                  <div className="flex items-center justify-between mb-1 font-bold">
                    <span>
                      Savol #{idx + 1} ({res.kind === 'logic' ? 'Mantiqiy' : 'Psixologik'})
                    </span>
                    {res.kind === 'logic' && (
                      res.is_correct ? (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> To'g'ri
                        </span>
                      ) : (
                        <span className="text-rose-500 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Xato
                        </span>
                      )
                    )}
                  </div>
                  {res.explanation && (
                    <p className="text-slate-600 dark:text-dark-text-muted leading-relaxed mt-1">
                      {res.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/register')}
                className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all shadow-md shadow-violet-500/20 text-sm flex items-center justify-center gap-2"
              >
                <span>To'liq ro'yxatdan o'tish</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => navigate('/dashboard')}
                className="py-3.5 px-6 rounded-2xl font-bold text-slate-700 dark:text-dark-text-main bg-slate-100 dark:bg-dark-bg hover:bg-slate-200 dark:hover:bg-dark-border transition-colors text-sm"
              >
                Asosiy sahifaga o'tish
              </button>
            </div>
          </motion.div>
        ) : (
          /* Question Card */
          <div className="bg-white dark:bg-dark-surface rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 dark:border-dark-border">
            
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 mb-2">
                <span>Savol {currentIdx + 1} / {questions.length}</span>
                <span className="uppercase">{currentQ?.kind === 'logic' ? 'Mantiqiy' : 'Psixologik'}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-dark-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-600 transition-all duration-300 rounded-full"
                  style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Media Rendering */}
            {currentQ?.image && (
              <div className="mb-5 rounded-2xl overflow-hidden max-h-56 bg-slate-100 dark:bg-dark-bg flex items-center justify-center border border-slate-100 dark:border-dark-border">
                <img src={currentQ.image} alt="Question Attachment" className="max-h-56 object-contain" />
              </div>
            )}

            {currentQ?.video_url && (
              <div className="mb-5 rounded-2xl overflow-hidden aspect-video bg-black">
                <iframe
                  src={getEmbedVideoUrl(currentQ.video_url)}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Question Video"
                ></iframe>
              </div>
            )}

            {currentQ?.video && !currentQ.video_url && (
              <div className="mb-5 rounded-2xl overflow-hidden aspect-video bg-black">
                <video src={currentQ.video} controls className="w-full h-full object-contain" />
              </div>
            )}

            {/* Question Text */}
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-dark-text-main mb-6 leading-relaxed">
              {currentQ?.text}
            </h2>

            {/* Options List */}
            <div className="space-y-3 mb-8">
              {currentQ &&
                Object.entries(currentQ.options || {}).map(([key, value]) => {
                  const isSelected = selectedOpt === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleSelectOption(key)}
                      className={`w-full p-4 rounded-2xl border text-left font-semibold text-sm transition-all flex items-center gap-3 ${
                        isSelected
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 shadow-sm'
                          : 'border-slate-200 dark:border-dark-border text-slate-700 dark:text-dark-text-main hover:bg-slate-50 dark:hover:bg-dark-bg'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-violet-600 text-white'
                            : 'bg-slate-100 dark:bg-dark-bg text-slate-500 dark:text-dark-text-muted'
                        }`}
                      >
                        {key}
                      </div>
                      <span className="flex-1">{value}</span>
                    </button>
                  );
                })}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-dark-border">
              <button
                onClick={handlePrev}
                disabled={currentIdx === 0}
                className="py-3 px-5 rounded-xl font-bold text-slate-500 hover:text-slate-800 dark:hover:text-dark-text-main disabled:opacity-40 transition-colors text-sm"
              >
                {t('common.back', 'Orqaga')}
              </button>

              <button
                onClick={handleNext}
                disabled={!selectedOpt || submitting}
                className="py-3 px-6 rounded-2xl font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 transition-all shadow-md shadow-violet-500/20 text-sm flex items-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : currentIdx === questions.length - 1 ? (
                  <span>Natijani ko'rish</span>
                ) : (
                  <>
                    <span>Keyingisi</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
