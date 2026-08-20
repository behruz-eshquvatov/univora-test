// @ts-nocheck
import { useState, useEffect } from 'react';
import { Clock, Target, ArrowRight, FileText, GraduationCap, RefreshCw, Play, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { testengineApi, type TestSession } from '../lib/api/testengine';

const Tests = () => {
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [loadingNewTest, setLoadingNewTest] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoadingSessions(true);
    testengineApi.getSessions()
      .then(data => {
        // Handle both paginated { results: [] } and plain array
        const list = Array.isArray(data) ? data : (data as any).results ?? [];
        setSessions(list);
      })
      .catch(console.error)
      .finally(() => setLoadingSessions(false));
  }, []);

  const handleStartTest = async () => {
    try {
      setLoadingNewTest(true);
      // Hardcode subject 1 for now (could be dynamic later)
      const session = await testengineApi.startSession(1);
      navigate(`/quiz/${session.id}`);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingNewTest(false);
    }
  };

  const activeSession = sessions.find(s => s.status === 'in_progress');
  const completedSessions = sessions.filter(s => s.status === 'completed');
  return (
    <div className="bg-slate-50/95 dark:bg-dark-surface/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 dark:border-dark-border/60 min-h-[calc(100vh-2rem)] p-6 sm:p-8 flex flex-col gap-8 relative overflow-hidden">
      
      {/* Decorative top-left glare inside the card */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/80 to-transparent dark:from-white/5 rounded-t-2xl pointer-events-none"></div>

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-dark-text-main tracking-tight">Центр тестирования</h1>
          <p className="text-slate-500 dark:text-dark-text-muted mt-2 font-medium text-lg">Выбирайте формат подготовки и бейте собственные рекорды</p>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 xl:grid-cols-3 gap-8 mt-2">
        
        {/* Left Column (2/3) - Start New Test & Active Test */}
        <div className="xl:col-span-2 flex flex-col gap-8">
          
          {/* Active Test (If any) */}
          {activeSession && (
          <section className="bg-gradient-to-r from-violet-600 to-purple-700 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between shadow-xl shadow-purple-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
            
            <div className="relative z-10 flex items-center gap-5 mb-6 md:mb-0">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0 border border-white/20">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-xl mb-1 text-white">Тест в процессе</h3>
                <p className="text-purple-100 font-medium">{activeSession.subject_name || 'Предмет'} ({activeSession.current_question_index}/{activeSession.total_questions} вопросов)</p>
              </div>
            </div>
            
            <Link to={`/quiz/${activeSession.id}`} className="relative z-10 w-full md:w-auto px-6 py-3.5 bg-white text-purple-700 hover:bg-slate-50 hover:scale-[1.02] active:scale-95 font-bold rounded-xl transition-all text-center shadow-lg flex items-center justify-center gap-2">
              <Play className="w-5 h-5 fill-current" />
              Продолжить
            </Link>
          </section>
          )}

          {/* Start New Test Categories */}
          <section>
            <h3 className="font-extrabold text-slate-800 dark:text-dark-text-main text-xl mb-5">Начать новый тест</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Card 1 */}
              <div onClick={handleStartTest} className={`bg-white dark:bg-dark-surface rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-dark-border transition-all group relative overflow-hidden flex flex-col justify-between h-[200px] ${loadingNewTest ? 'opacity-70 pointer-events-none' : 'hover:shadow-lg hover:border-violet-100 dark:hover:border-violet-950 cursor-pointer'}`}>
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/20 text-blue-500 dark:text-blue-400 flex items-center justify-center mb-4 transform group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                    {loadingNewTest ? <Loader2 className="w-7 h-7 animate-spin" /> : <Target className="w-7 h-7" />}
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-dark-text-main text-lg leading-tight">Тематический тест</h4>
                  <p className="text-slate-500 dark:text-dark-text-muted text-sm font-medium mt-2">Выбор предмета и конкретной темы для точечной тренировки.</p>
                </div>
                <div className="absolute bottom-4 right-4 text-slate-300 opacity-0 transform translate-x-2 translate-y-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:text-blue-500 transition-all duration-300 z-10">
                  <ArrowRight className="w-7 h-7 stroke-[3]" />
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white dark:bg-dark-surface rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-dark-border hover:shadow-lg hover:border-violet-100 dark:hover:border-violet-950 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between h-[200px]">
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-fuchsia-50 dark:bg-fuchsia-950/20 text-fuchsia-500 dark:text-fuchsia-400 flex items-center justify-center mb-4 transform group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                    <GraduationCap className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-dark-text-main text-lg leading-tight">Пробный экзамен (ДТМ)</h4>
                  <p className="text-slate-500 dark:text-dark-text-muted text-sm font-medium mt-2">Полная симуляция экзамена из 5 предметов на время.</p>
                </div>
                <div className="absolute bottom-4 right-4 text-slate-300 opacity-0 transform translate-x-2 translate-y-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:text-fuchsia-500 transition-all duration-300 z-10">
                  <ArrowRight className="w-7 h-7 stroke-[3]" />
                </div>
              </div>

              {/* Card 3 (Full width) */}
              <div className="bg-white dark:bg-dark-surface rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-dark-border hover:shadow-lg hover:border-violet-100 dark:hover:border-violet-950 transition-all cursor-pointer group relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between md:col-span-2">
                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-180 transition-transform duration-500 shrink-0">
                    <RefreshCw className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-dark-text-main text-lg leading-tight">Работа над ошибками</h4>
                    <p className="text-slate-500 dark:text-dark-text-muted text-sm font-medium mt-1">Умный тест, собранный только из вопросов, в которых вы ошибались.</p>
                  </div>
                </div>
                <div className="mt-4 md:mt-0 self-start md:self-auto text-slate-300 transform translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-emerald-500 transition-all duration-300">
                  <ArrowRight className="w-7 h-7 stroke-[3]" />
                </div>
              </div>

            </div>
          </section>

        </div>

        {/* Right Column (1/3) - Recent Results */}
        <div className="xl:col-span-1">
          <section className="bg-white dark:bg-dark-surface rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-dark-border h-fit sticky top-0 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-extrabold text-slate-800 dark:text-dark-text-main text-xl">Последние тесты</h3>
              <button className="w-10 h-10 rounded-full bg-white dark:bg-dark-surface border-2 border-slate-100 dark:border-dark-border hover:border-violet-200 dark:hover:border-violet-900 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors flex items-center justify-center group cursor-pointer shadow-sm">
                <FileText className="w-5 h-5 text-slate-400 dark:text-dark-text-muted group-hover:text-violet-500 transition-colors" />
              </button>
            </div>
            
            <div className="flex-1 flex flex-col gap-4">
              {completedSessions.map((test) => (
                <div key={test.id} className="p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-dark-bg border border-transparent hover:border-slate-100 dark:hover:border-dark-border transition-all cursor-pointer group relative">
                  
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-violet-500 mb-1 block">
                        Тест
                      </span>
                      <h4 className="font-bold text-slate-800 dark:text-dark-text-main leading-tight">
                        {test.subject_name || `Предмет ID: ${test.subject_id}`}
                      </h4>
                    </div>
                    
                    <div className={`font-extrabold text-lg flex items-baseline gap-1 ${(test.score / test.total_questions) >= 0.5 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {test.score}
                      <span className="text-xs text-slate-400 dark:text-dark-text-muted font-bold">/ {test.total_questions}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-400 dark:text-dark-text-muted">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Завершен
                    </div>
                    <div>{new Date(test.start_time).toLocaleDateString()}</div>
                  </div>

                  {/* Hover indicator */}
                  <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-violet-500" />
                  </div>

                </div>
              ))}
              {completedSessions.length === 0 && (
                <div className="text-center text-slate-400 dark:text-dark-text-muted text-sm py-4">
                  Вы еще не завершили ни одного теста.
                </div>
              )}
            </div>

            <button className="w-full mt-4 py-3.5 rounded-xl font-bold text-slate-600 dark:text-dark-text-main bg-slate-50 dark:bg-dark-bg hover:bg-slate-100 dark:hover:bg-dark-surface/60 transition-colors text-sm text-center">
              Смотреть всю историю
            </button>
          </section>
        </div>

      </div>
    </div>
  );
}

export default Tests;
