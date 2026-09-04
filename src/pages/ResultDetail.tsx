import { useState, useEffect } from 'react';
import { Clock, BookOpen, Calculator, Atom, Terminal, Globe, ChevronLeft, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { testengineApi, type TestResult, type SessionQuestionReview } from '../lib/api/testengine';
import { useParams, Link } from 'react-router-dom';

export default function ResultDetail() {
  const { t, i18n } = useTranslation();
  const { resultId } = useParams();
  const [result, setResult] = useState<TestResult | null>(null);
  const [review, setReview] = useState<SessionQuestionReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResultData = async () => {
      if (!resultId) return;
      setLoading(true);
      try {
        const resData = await testengineApi.getResult(resultId);
        setResult(resData);
        if (resData.session) {
          const revData = await testengineApi.getSessionReview(resData.session);
          let reviewArray = [];
          if (Array.isArray(revData)) {
            reviewArray = revData;
          } else if (revData && typeof revData === 'object') {
            reviewArray = (revData as any).results || (revData as any).questions || (revData as any).review || Object.values(revData).find(v => Array.isArray(v)) || [];
          }
          setReview(reviewArray);
        }
      } catch (err: any) {
        console.error(err);
        setError(t('history.failed_to_load'));
      } finally {
        setLoading(false);
      }
    };
    fetchResultData();
  }, [resultId, t, i18n.language]);

  const getSubjectIconAndColor = (name: string) => {
    const defaultColor = 'from-blue-500 to-cyan-400';
    let icon = <BookOpen className="w-8 h-8 text-white" />;
    
    if (!name) return { icon, color: defaultColor };
    
    const lowerName = name.toLowerCase();
    if (lowerName.includes('mat') || lowerName.includes('мат')) icon = <Calculator className="w-8 h-8 text-white" />;
    if (lowerName.includes('phy') || lowerName.includes('физ')) icon = <Atom className="w-8 h-8 text-white" />;
    if (lowerName.includes('inf') || lowerName.includes('ит') || lowerName.includes('it')) icon = <Terminal className="w-8 h-8 text-white" />;
    if (lowerName.includes('eng') || lowerName.includes('анг') || lowerName.includes('яз')) icon = <Globe className="w-8 h-8 text-white" />;
    
    return { icon, color: defaultColor };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-2rem)]">
        <Clock className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-2rem)]">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-dark-text-main mb-4">{error || t('history.result_not_found')}</h2>
        <Link to="/history" className="px-6 py-2.5 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-colors">
          {t('history.back_to_history')}
        </Link>
      </div>
    );
  }

  const { icon, color } = getSubjectIconAndColor(result.subject?.name || '');

  return (
    <div className="bg-white dark:bg-dark-surface min-h-[calc(100vh-2rem)] rounded-[2rem] p-6 sm:p-10 border border-slate-100 dark:border-dark-border overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <Link to="/history" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-dark-text-muted dark:hover:text-dark-text-main mb-8 transition-colors">
          <ChevronLeft className="w-4 h-4" /> {t('history.back_to_history_short')}
        </Link>

        {/* Summary Card */}
        <div className="bg-slate-50 dark:bg-dark-bg rounded-3xl p-8 border border-slate-100 dark:border-dark-border mb-10 flex flex-col md:flex-row items-center gap-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
          
          <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0 shadow-lg`}>
            {icon}
          </div>
          
          <div className="flex-1 text-center md:text-left z-10">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-dark-text-main mb-2">
              {result.subject?.name || t('history.default_subject')}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-bold text-slate-500 dark:text-dark-text-muted">
              <span className="px-3 py-1 rounded-lg bg-white dark:bg-dark-surface shadow-sm">{result.mode_display}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {t('history.duration', { min: Math.floor(result.duration_seconds / 60), sec: result.duration_seconds % 60 })}</span>
              <span>{new Date(result.created_at).toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : i18n.language === 'uz' ? 'uz-UZ' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
          
          <div className="text-center shrink-0 z-10 bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-dark-border">
            <div className={`text-4xl font-black mb-1 ${result.accuracy_percent >= 70 ? 'text-emerald-500' : result.accuracy_percent >= 40 ? 'text-amber-500' : 'text-rose-500'}`}>
              {result.accuracy_percent}%
            </div>
            <div className="text-sm font-bold text-slate-400">
              {t('history.correct_of', { correct: result.correct_count, total: result.total_questions })}
            </div>
          </div>
        </div>

        {/* Detailed Review */}
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-dark-text-main mb-6">{t('history.questions_review')}</h2>
          <div className="space-y-6">
            {review.map((q, idx) => (
              <div key={q.order} className="bg-white dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-2xl p-6 shadow-sm overflow-hidden">
                <div className="flex items-start gap-4 mb-6">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-white shadow-sm mt-1 ${q.is_correct ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0 prose prose-slate dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-base">{q.question.text}</div>
                    {q.question.image && (
                      <div className="mt-4 rounded-xl overflow-hidden max-w-lg border border-slate-200 dark:border-dark-border">
                        <img src={q.question.image} alt={q.question.image_caption || t('history.question_image')} className="w-full h-auto object-cover" />
                        {q.question.image_caption && (
                          <div className="bg-slate-50 dark:bg-dark-surface p-2 text-xs text-center text-slate-500 dark:text-dark-text-muted">
                            {q.question.image_caption}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(q.question.options).map(([key, value]) => {
                    const isSelected = key === q.selected_option;
                    const isCorrect = key === q.correct_option;
                    
                    let bgClass = "bg-slate-50 dark:bg-dark-surface border-slate-200 dark:border-dark-border";
                    let icon = null;
                    
                    if (isCorrect) {
                      bgClass = "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50";
                      icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
                    } else if (isSelected && !isCorrect) {
                      bgClass = "bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800/50";
                      icon = <XCircle className="w-5 h-5 text-rose-500 shrink-0" />;
                    }

                    return (
                      <div key={key} className={`flex items-start gap-3 p-4 rounded-xl border ${bgClass} transition-colors`}>
                        <div className="flex items-center justify-center w-6 h-6 rounded bg-white dark:bg-dark-bg border border-slate-200 dark:border-dark-border shrink-0 font-bold text-xs text-slate-500 mt-0.5">
                          {key}
                        </div>
                        <div className="flex-1 min-w-0 text-sm font-medium text-slate-700 dark:text-dark-text-main">
                          <div className="whitespace-pre-wrap">{value}</div>
                        </div>
                        {icon}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
