// @ts-nocheck
import { useState, useEffect } from 'react';
import { Clock, Target, ArrowRight, FileText, GraduationCap, Play, Loader2, ArrowUpRight, BookOpen, Calculator, Atom, Terminal, Globe } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { testengineApi, type TestSession } from '../lib/api/testengine';
import { catalogApi, type Subject } from '../lib/api/catalog';

const Tests = () => {
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingNewTest, setLoadingNewTest] = useState<number | null>(null);
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

    catalogApi.getSubjects()
      .then(data => {
        setSubjects(data || []);
      })
      .catch(console.error);
  }, []);

  const getSubjectIconAndColor = (name: string, index: number) => {
    const defaultColors = ['from-blue-500 to-cyan-400', 'from-purple-500 to-indigo-500', 'from-emerald-500 to-teal-400', 'from-rose-500 to-pink-500', 'from-amber-400 to-orange-500'];
    const color = defaultColors[index % defaultColors.length];
    
    let icon = <BookOpen className="w-7 h-7 text-white" />;
    if (name.toLowerCase().includes('mat') || name.toLowerCase().includes('мат')) icon = <Calculator className="w-7 h-7 text-white" />;
    if (name.toLowerCase().includes('phy') || name.toLowerCase().includes('физ')) icon = <Atom className="w-7 h-7 text-white" />;
    if (name.toLowerCase().includes('inf') || name.toLowerCase().includes('ит') || name.toLowerCase().includes('it')) icon = <Terminal className="w-7 h-7 text-white" />;
    if (name.toLowerCase().includes('eng') || name.toLowerCase().includes('анг') || name.toLowerCase().includes('яз')) icon = <Globe className="w-7 h-7 text-white" />;
    
    return { icon, color };
  };

  const handleStartTest = async (subjectId: number) => {
    try {
      setLoadingNewTest(subjectId);
      const session = await testengineApi.startSession(subjectId);
      navigate(`/quiz/${session.id}`);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingNewTest(null);
    }
  };

  const activeSession = sessions.find(s => !s.finished_at);
  const completedSessions = sessions.filter(s => s.finished_at);
  return (
    <div className="md:bg-slate-50/95 dark:md:bg-dark-surface/90 md:backdrop-blur-xl md:rounded-2xl md:shadow-2xl md:border md:border-white/60 dark:md:border-dark-border/60 min-h-[calc(100vh-2rem)] md:p-8 flex flex-col gap-6 md:gap-8 relative overflow-hidden">
      
      {/* Decorative top-left glare inside the card */}
      <div className="hidden md:block absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/80 to-transparent dark:from-white/5 rounded-t-2xl pointer-events-none"></div>

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
                <p className="text-purple-100 font-medium">{activeSession.subject?.name || 'Предмет'} ({activeSession.total_questions} вопросов)</p>
              </div>
            </div>
            
            <Link to={`/quiz/${activeSession.id}`} className="relative z-10 w-full md:w-auto px-6 py-3.5 bg-white text-purple-700 hover:bg-slate-50 hover:scale-[1.02] active:scale-95 font-bold rounded-xl transition-all text-center shadow-lg flex items-center justify-center gap-2">
              <Play className="w-5 h-5 fill-current" />
              Продолжить
            </Link>
          </section>
          )}

          {/* Тематические тесты */}
          {subjects.length > 0 && (
            <section>
              <h3 className="font-extrabold text-slate-800 dark:text-dark-text-main text-xl mb-5">Тематические тесты</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {subjects.map((subject, index) => {
                  const { icon, color } = getSubjectIconAndColor(subject.name, index);
                  const isCurrentlyLoading = loadingNewTest === subject.id;
                  return (
                    <div
                      key={subject.id}
                      onClick={() => !isCurrentlyLoading && handleStartTest(subject.id)}
                      className={`bg-white dark:bg-dark-surface rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-dark-border hover:shadow-lg hover:border-violet-100 dark:hover:border-violet-950 transition-all cursor-pointer relative overflow-hidden min-h-[160px] flex flex-col justify-between group ${isCurrentlyLoading ? 'opacity-70 pointer-events-none' : ''}`}
                    >
                      <div className="flex items-start justify-between relative z-10">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-2xl shadow-sm transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300`}>
                            {isCurrentlyLoading ? <Loader2 className="w-7 h-7 text-white animate-spin" /> : icon}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 dark:text-dark-text-main text-lg leading-tight">{subject.name}</h4>
                            <p className="text-slate-500 dark:text-dark-text-muted text-sm font-medium mt-1">
                              Проверить знания
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Top Right Hover Icon */}
                      <div className="absolute top-6 right-6 text-slate-300 opacity-0 transform translate-x-2 -translate-y-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:text-violet-500 transition-all duration-300 z-10">
                        <ArrowUpRight className="w-7 h-7 stroke-[3]" />
                      </div>

                      {/* Bottom Right Circle Background */}
                      <div className={`absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br ${color} opacity-10 transition-transform duration-500 group-hover:scale-[1.4] z-0`}></div>
                      
                      {/* Bottom Right Percent Circle (Half visible) */}
                      <div className={`absolute -bottom-5 -right-5 w-[88px] h-[88px] rounded-full bg-gradient-to-br ${color} flex items-start justify-start pt-[20px] pl-[20px] shadow-lg transform transition-transform duration-500 group-hover:scale-[1.15] z-10`}>
                        <Play className="w-6 h-6 text-white fill-current" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Start New Test Categories */}
          <section>
            <h3 className="font-extrabold text-slate-800 dark:text-dark-text-main text-xl mb-5">Начать новый тест</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* DTM Exam Card */}
              <div className="bg-white dark:bg-dark-surface rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-dark-border hover:shadow-lg hover:border-violet-100 dark:hover:border-violet-950 transition-all cursor-pointer group relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between md:col-span-2">
                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-fuchsia-50 dark:bg-fuchsia-950/20 text-fuchsia-500 dark:text-fuchsia-400 flex items-center justify-center transform group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 shrink-0">
                    <GraduationCap className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-dark-text-main text-lg leading-tight">Пробный экзамен (ДТМ)</h4>
                    <p className="text-slate-500 dark:text-dark-text-muted text-sm font-medium mt-1">Полная симуляция экзамена из 5 предметов на время.</p>
                  </div>
                </div>
                <div className="mt-4 md:mt-0 self-start md:self-auto text-slate-300 transform translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-fuchsia-500 transition-all duration-300">
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
            
            <div className="flex-1 flex flex-col gap-2 mt-2">
              {completedSessions.slice(0, 5).map((test) => (
                <div key={test.id} className="p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-bg border border-transparent hover:border-slate-100 dark:hover:border-dark-border transition-all cursor-pointer group relative">
                  
                  <div className="flex justify-between items-center mb-1.5">
                    <h4 className="font-bold text-slate-800 dark:text-dark-text-main text-sm">
                      {test.subject?.name || `Предмет`}
                    </h4>
                    
                    <div className="font-extrabold text-sm flex items-baseline gap-1 text-slate-500">
                      {test.total_questions} воп.
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400 dark:text-dark-text-muted">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Завершен
                    </div>
                    <div>{new Date(test.started_at).toLocaleDateString()}</div>
                  </div>

                </div>
              ))}
              {completedSessions.length === 0 && (
                <div className="text-center text-slate-400 dark:text-dark-text-muted text-sm py-4">
                  Вы еще не завершили ни одного теста.
                </div>
              )}
            </div>

            <Link to="/history" className="block w-full mt-4 py-3.5 rounded-xl font-bold text-slate-600 dark:text-dark-text-main bg-slate-50 dark:bg-dark-bg hover:bg-slate-100 dark:hover:bg-dark-surface/60 transition-colors text-sm text-center">
              Смотреть всю историю
            </Link>
          </section>
        </div>

      </div>
    </div>
  );
}

export default Tests;
