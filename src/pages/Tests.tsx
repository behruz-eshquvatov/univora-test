import { useState, useEffect } from 'react';
import { Clock, FileText, Play, Loader2, BookOpen, Calculator, Atom, Terminal, Globe } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { testengineApi, type TestSession, type TestResult } from '../lib/api/testengine';
import { catalogApi, type Subject } from '../lib/api/catalog';
import { useAuthStore } from '../store/useAuthStore';
import { GradeTopicModal } from '../components/GradeTopicModal';

const Tests = () => {
  const { t, i18n } = useTranslation();
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [myResults, setMyResults] = useState<TestResult[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingNewTest, setLoadingNewTest] = useState<number | null>(null);
  const [selectedSubjectForModal, setSelectedSubjectForModal] = useState<Subject | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const { isGuest } = useAuthStore();

  useEffect(() => {
    setLoading(true);
    const promises: Promise<any>[] = [
      catalogApi.getSubjects().then(data => {
        const subjectList = Array.isArray(data) ? data : (data as any)?.results || [];
        setSubjects(subjectList.filter((s: Subject) => s.has_test !== false));
      })
    ];

    if (!isGuest) {
      promises.push(
        testengineApi.getSessions().then(data => {
          const list = Array.isArray(data) ? data : (data as any).results ?? [];
          setSessions(list);
        }),
        testengineApi.getMyResults().then(res => setMyResults(res || []))
      );
    }

    Promise.allSettled(promises).finally(() => setLoading(false));
  }, [i18n.language, isGuest]);

  const getSubjectIconAndColor = (name: string, index: number) => {
    const defaultColors = ['from-blue-500 to-cyan-400', 'from-purple-500 to-indigo-500', 'from-emerald-500 to-teal-400', 'from-rose-500 to-pink-500', 'from-amber-400 to-orange-500'];
    const color = defaultColors[index % defaultColors.length];
    const lower = (name || '').toLowerCase();
    
    let icon = <BookOpen className="w-7 h-7 text-white" />;
    if (lower.includes('mat') || lower.includes('мат') || lower.includes('math') || lower.includes('alg') || lower.includes('geom')) {
      icon = <Calculator className="w-7 h-7 text-white" />;
    } else if (lower.includes('fiz') || lower.includes('физ') || lower.includes('phys')) {
      icon = <Atom className="w-7 h-7 text-white" />;
    } else if (lower.includes('inf') || lower.includes('инф') || lower.includes('it') || lower.includes('comp') || lower.includes('dastur')) {
      icon = <Terminal className="w-7 h-7 text-white" />;
    } else if (lower.includes('ing') || lower.includes('eng') || lower.includes('англ') || lower.includes('яз') || lower.includes('til')) {
      icon = <Globe className="w-7 h-7 text-white" />;
    }
    
    return { icon, color };
  };

  const handleOpenSubjectModal = (subject: Subject) => {
    setSelectedSubjectForModal(subject);
    setIsModalOpen(true);
  };

  const handleConfirmStartTest = async (params: { subjectId: number; gradeId?: number; topicId?: number; count?: number }) => {
    if (isGuest) {
      setIsModalOpen(false);
      navigate(`/guest-quiz${params.topicId ? `?topic=${params.topicId}` : ''}`);
      return;
    }

    try {
      setLoadingNewTest(params.subjectId);
      let session;
      if (params.topicId) {
        session = await testengineApi.startTopicTest(params.topicId, { count: params.count });
      } else {
        session = await testengineApi.startSession(params.subjectId, { question_count: params.count });
      }
      setIsModalOpen(false);
      navigate(`/quiz/${session.id}`);
    } catch (error) {
      console.error('Failed to start test session:', error);
    } finally {
      setLoadingNewTest(null);
    }
  };

  const activeSession = sessions.find(s => !s.is_finished);
  return (
    <div className="md:bg-slate-50/95 dark:md:bg-dark-surface/90 md:backdrop-blur-xl md:rounded-2xl md:shadow-2xl md:border md:border-white/60 dark:md:border-dark-border/60 min-h-[calc(100vh-2rem)] md:p-8 flex flex-col gap-6 md:gap-8 relative overflow-hidden">
      
      {/* Decorative top-left glare inside the card */}
      <div className="hidden md:block absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/80 to-transparent dark:from-white/5 rounded-t-2xl pointer-events-none"></div>

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-dark-text-main tracking-tight">{t('tests.title')}</h1>
          <p className="text-slate-500 dark:text-dark-text-muted mt-2 font-medium text-lg">{t('tests.subtitle')}</p>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 xl:grid-cols-3 gap-8 mt-2">
        
        {/* Left Column (2/3) - Start New Test & Active Test */}
        <div className="xl:col-span-2 flex flex-col gap-8">
          
          {/* DTM Blok Imtihoni Banner */}
          <section className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-xl relative overflow-hidden border border-white/10">
            <div className="relative z-10 mb-4 sm:mb-0">
              <div className="flex items-center gap-2 text-violet-300 font-bold text-xs uppercase tracking-wider mb-1">
                <Calculator className="w-4 h-4" />
                <span>2-5 ta fan birgalikda</span>
              </div>
              <h3 className="font-extrabold text-2xl text-white">DTM Blok Imtihoni</h3>
              <p className="text-slate-300 text-sm mt-1 max-w-md">
                Haqiqiy DTM formatida va taymer ostida blok imtihon topshirib o'z balingizni aniqlang.
              </p>
            </div>
            <Link
              to="/mock-exam/new"
              className="relative z-10 px-6 py-3.5 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-extrabold rounded-2xl transition-all shadow-lg hover:scale-105 active:scale-95 text-sm shrink-0"
            >
              Imtihonni boshlash
            </Link>
          </section>

          {/* Тематические тесты */}
          <section>
            <h3 className="font-extrabold text-slate-800 dark:text-dark-text-main text-xl mb-5">{t('tests.thematic_tests')}</h3>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="bg-white dark:bg-dark-surface rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-sm border border-slate-100 dark:border-dark-border animate-pulse flex items-center gap-3 sm:flex-col sm:items-start sm:justify-between min-h-0 sm:h-[150px]">
                    <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                    <div className="flex-1 space-y-2 w-full">
                      <div className="h-4 sm:h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4" />
                      <div className="h-3 sm:h-4 bg-slate-100 dark:bg-slate-800/60 rounded-lg w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : subjects.length === 0 ? (
              <div className="bg-white dark:bg-dark-surface rounded-3xl p-8 border border-slate-100 dark:border-dark-border text-center">
                <p className="text-slate-500 dark:text-dark-text-muted font-medium">{t('leaderboard.no_data')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {subjects.map((subject, index) => {
                  const { icon, color } = getSubjectIconAndColor(subject.name, index);
                  const isCurrentlyLoading = loadingNewTest === subject.id;
                  return (
                    <div
                      key={subject.id}
                      onClick={() => !isCurrentlyLoading && handleOpenSubjectModal(subject)}
                      className={`bg-white dark:bg-dark-surface rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-sm border border-slate-100 dark:border-dark-border hover:shadow-lg hover:border-violet-100 dark:hover:border-violet-950 transition-all cursor-pointer relative overflow-hidden flex items-center justify-between sm:flex-col sm:items-start sm:justify-between min-h-0 sm:h-[150px] gap-3 group ${isCurrentlyLoading ? 'opacity-70 pointer-events-none' : ''}`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 sm:flex-initial min-w-0 w-full z-10">
                        <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-lg sm:text-2xl shadow-sm transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shrink-0`}>
                          {isCurrentlyLoading ? <Loader2 className="w-5 h-5 sm:w-7 sm:h-7 text-white animate-spin" /> : icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-800 dark:text-dark-text-main text-sm sm:text-lg leading-tight truncate">{subject.name}</h4>
                          <p className="text-slate-500 dark:text-dark-text-muted text-xs sm:text-sm font-medium mt-0.5 truncate">
                            {t('tests.check_knowledge')}
                          </p>
                        </div>
                      </div>

                      {/* Mobile Inline Play Button */}
                      <div className={`sm:hidden w-9 h-9 rounded-full bg-gradient-to-br ${color} flex items-center justify-center shadow-md shrink-0 z-10 group-hover:scale-110 transition-transform`}>
                        <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                      </div>

                      {/* Desktop Corner Play Button & Glow */}
                      <div className={`hidden sm:block absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br ${color} opacity-10 transition-transform duration-500 group-hover:scale-[1.4] z-0`}></div>
                      <div className={`hidden sm:flex absolute -bottom-5 -right-5 w-[80px] h-[80px] rounded-full bg-gradient-to-br ${color} items-start justify-start pt-[18px] pl-[18px] shadow-lg transform transition-transform duration-500 group-hover:scale-[1.15] z-10`}>
                        <Play className="w-5 h-5 text-white fill-current" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

        </div>

        {/* Right Column (1/3) - Recent Results */}
        <div className="xl:col-span-1">
          <section className="bg-white dark:bg-dark-surface rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-dark-border h-fit sticky top-0 flex flex-col relative overflow-hidden">
            
            {/* Guest Lock Overlay for Recent Results */}
            {isGuest && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-white/80 dark:bg-dark-surface/90 backdrop-blur-sm">
                <p className="text-slate-800 dark:text-dark-text-main font-extrabold text-sm mb-3 max-w-[220px] leading-relaxed">
                  {t('tests.guest_results_lock', 'Natijalarni saqlash va ko\'rish uchun ro\'yxatdan o\'ting')}
                </p>
                <Link
                  to="/login"
                  className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md hover:scale-105 active:scale-95"
                >
                  {t('dashboard.guest_banner_btn', 'Ro\'yxatdan o\'tish')}
                </Link>
              </div>
            )}

            <div className={`flex items-center justify-between mb-6 ${isGuest ? 'filter blur-sm opacity-30 select-none pointer-events-none' : ''}`}>
              <h3 className="font-extrabold text-slate-800 dark:text-dark-text-main text-xl">{t('tests.recent_results')}</h3>
              <button className="w-10 h-10 rounded-full bg-white dark:bg-dark-surface border-2 border-slate-100 dark:border-dark-border hover:border-violet-200 dark:hover:border-violet-900 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors flex items-center justify-center group cursor-pointer shadow-sm">
                <FileText className="w-5 h-5 text-slate-400 dark:text-dark-text-muted group-hover:text-violet-500 transition-colors" />
              </button>
            </div>
            
            <div className={`flex-1 flex flex-col gap-2 mt-2 ${isGuest ? 'filter blur-sm opacity-30 select-none pointer-events-none' : ''}`}>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="p-3 rounded-xl bg-slate-50/50 dark:bg-dark-bg/50 animate-pulse flex flex-col gap-2">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                      <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-1/3" />
                    </div>
                  ))}
                </div>
              ) : (isGuest ? [] : myResults).slice(0, 5).map((result) => (
                <div key={result.id} className="p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-bg border border-transparent hover:border-slate-100 dark:hover:border-dark-border transition-all cursor-pointer group relative">
                  
                  <div className="flex justify-between items-center mb-1.5">
                    <h4 className="font-bold text-slate-800 dark:text-dark-text-main text-sm">
                      {result.subject?.name || t('tests.default_subject')}
                    </h4>
                    <div className="font-extrabold text-sm text-emerald-500">
                      {result.accuracy_percent}%
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400 dark:text-dark-text-muted">
                    <span>{t('tests.correct_answers', { correct: result.correct_count, total: result.total_questions })}</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(result.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                </div>
              ))}
              {!loading && !isGuest && myResults.length === 0 && (
                <div className="text-center text-slate-400 dark:text-dark-text-muted text-sm py-4">
                  {t('tests.no_tests_yet')}
                </div>
              )}
            </div>

            <Link to="/history" className={`block w-full mt-4 py-3.5 rounded-xl font-bold text-slate-600 dark:text-dark-text-main bg-slate-50 dark:bg-dark-bg hover:bg-slate-100 dark:hover:bg-dark-surface/60 transition-colors text-sm text-center ${isGuest ? 'filter blur-sm opacity-30 select-none pointer-events-none' : ''}`}>
              {t('tests.view_full_history')}
            </Link>
          </section>
        </div>

      </div>

      {/* Grade and Topic Selection Modal */}
      <GradeTopicModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        subject={selectedSubjectForModal}
        onStartTest={handleConfirmStartTest}
        isLoading={loadingNewTest !== null}
      />
    </div>
  );
}

export default Tests;
