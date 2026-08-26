import { useState, useEffect } from 'react';
import { Clock, BookOpen, Calculator, Atom, Terminal, Globe, BrainCircuit, Activity, CalendarDays } from 'lucide-react';
import { testengineApi, type TestResult } from '../lib/api/testengine';
import { progressApi, type ReviewCard } from '../lib/api/progress';

export default function History() {
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
  }, [activeTab]);

  const getSubjectIconAndColor = (name: string, index: number) => {
    const defaultColors = ['from-blue-500 to-cyan-400', 'from-purple-500 to-indigo-500', 'from-emerald-500 to-teal-400', 'from-rose-500 to-pink-500', 'from-amber-400 to-orange-500'];
    const color = defaultColors[index % defaultColors.length];
    
    let icon = <BookOpen className="w-5 h-5 text-white" />;
    const lowerName = name.toLowerCase();
    if (lowerName.includes('mat') || lowerName.includes('мат')) icon = <Calculator className="w-5 h-5 text-white" />;
    if (lowerName.includes('phy') || lowerName.includes('физ')) icon = <Atom className="w-5 h-5 text-white" />;
    if (lowerName.includes('inf') || lowerName.includes('ит') || lowerName.includes('it')) icon = <Terminal className="w-5 h-5 text-white" />;
    if (lowerName.includes('eng') || lowerName.includes('анг') || lowerName.includes('яз')) icon = <Globe className="w-5 h-5 text-white" />;
    
    return { icon, color };
  };

  return (
    <div className="bg-white dark:bg-dark-surface min-h-[calc(100vh-2rem)] rounded-[2rem] p-6 sm:p-10 border border-slate-100 dark:border-dark-border overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 rounded-2xl flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-dark-text-main">
              История активности
            </h1>
            <p className="text-slate-500 dark:text-dark-text-muted mt-1">Ваши завершенные тесты и карточки повторения</p>
          </div>
        </div>

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
            <Activity className="w-4 h-4" /> Тесты
          </button>
          <button 
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 py-2.5 px-4 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'reviews' 
                ? 'bg-white dark:bg-dark-surface shadow-sm text-slate-900 dark:text-dark-text-main' 
                : 'text-slate-500 dark:text-dark-text-muted hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <BrainCircuit className="w-4 h-4" /> Карточки
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Clock className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'tests' && (
              <>
                {results.length > 0 ? results.map((result, idx) => {
                  const { icon, color } = getSubjectIconAndColor(result.subject?.name || '', idx);
                  return (
                    <div key={result.id} className="bg-slate-50 dark:bg-dark-bg rounded-2xl p-5 border border-slate-100 dark:border-dark-border flex items-center gap-5 hover:border-violet-200 dark:hover:border-violet-900 transition-colors">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0 shadow-sm`}>
                        {icon}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-slate-800 dark:text-dark-text-main truncate">
                            {result.subject?.name || 'Предмет'}
                          </h4>
                          <div className="font-extrabold text-emerald-500 shrink-0">
                            {result.accuracy_percent}%
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs font-bold text-slate-400 dark:text-dark-text-muted">
                          <span>{result.correct_count} / {result.total_questions} верно</span>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{new Date(result.created_at).toLocaleDateString()} {new Date(result.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-16 text-slate-400 dark:text-dark-text-muted bg-slate-50 dark:bg-dark-bg rounded-3xl border-2 border-dashed border-slate-200 dark:border-dark-border">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">Вы еще не завершили ни одного теста.</p>
                  </div>
                )}
              </>
            )}

            {activeTab === 'reviews' && (
              <>
                {reviews.length > 0 ? reviews.map(card => {
                  const isToday = new Date(card.next_review_date).toDateString() === new Date().toDateString();
                  const isPast = new Date(card.next_review_date) < new Date();
                  const urgencyClass = isPast ? 'text-rose-500 bg-rose-50 dark:bg-rose-900/20' : isToday ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' : 'text-slate-500 bg-slate-100 dark:bg-dark-surface';

                  return (
                    <div key={card.id} className="bg-slate-50 dark:bg-dark-bg rounded-2xl p-5 border border-slate-100 dark:border-dark-border hover:border-violet-200 dark:hover:border-violet-900 transition-colors">
                      <p className="text-sm font-medium text-slate-800 dark:text-dark-text-main mb-4 line-clamp-2">
                        {card.question_text}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${urgencyClass}`}>
                          <CalendarDays className="w-3.5 h-3.5" />
                          {isPast || isToday ? 'Повторить сегодня' : `Повтор: ${new Date(card.next_review_date).toLocaleDateString()}`}
                        </div>
                        <div className="text-xs font-bold text-slate-400">
                          Интервал: {card.interval_days} дн.
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-16 text-slate-400 dark:text-dark-text-muted bg-slate-50 dark:bg-dark-bg rounded-3xl border-2 border-dashed border-slate-200 dark:border-dark-border">
                    <BrainCircuit className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">У вас пока нет карточек для повторения.</p>
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
