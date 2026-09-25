import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Trophy, Flame, Calculator, Atom, Terminal, Globe, Brain, BookOpen, Play, FolderX, MessageSquarePlus } from 'lucide-react';
import { catalogApi, type Subject } from '../lib/api/catalog';
import { testengineApi } from '../lib/api/testengine';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { GradeTopicModal } from '../components/GradeTopicModal';
import ProjectReviewModal from '../components/ProjectReviewModal';

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, streak, xpSummary, isGuest } = useAuthStore();
  const [apiSubjects, setApiSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const [selectedSubjectForModal, setSelectedSubjectForModal] = useState<Subject | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingModal, setIsLoadingModal] = useState(false);

  useEffect(() => {
    setLoadingSubjects(true);
    catalogApi.getSubjects()
      .then(data => {
        const subjectList = Array.isArray(data) ? data : (data as any)?.results || [];
        const validSubjects = subjectList.filter((s: Subject) => s.has_test !== false);
        setApiSubjects(validSubjects);
      })
      .catch(err => {
        console.log('Failed to fetch catalog subjects', err);
        setApiSubjects([]);
      })
      .finally(() => setLoadingSubjects(false));

    if (!isGuest) {
      setLoadingStats(true);
      const authStore = useAuthStore.getState();
      Promise.allSettled([
        authStore.fetchStreak(),
        authStore.fetchXpSummary(),
        import('../lib/api/progress').then(({ progressApi }) => 
          progressApi.getTodayReviews().then(data => setReviewsCount(data.length))
        )
      ]).finally(() => setLoadingStats(false));
    } else {
      setLoadingStats(false);
    }
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
      setIsLoadingModal(true);
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
      setIsLoadingModal(false);
    }
  };

  const displaySubjects = apiSubjects.map((s, i) => {
    const { icon, color } = getSubjectIconAndColor(s.name, i);
    return { id: s.id, name: s.name, icon, color, originalSubject: s };
  });

  const firstName = user?.full_name?.split(' ')[0] || user?.name || 'Гость';
  const xp = xpSummary?.xp_total || user?.xp_total || 0;

  return (
    <div className="md:bg-slate-50/95 dark:md:bg-dark-surface/90 md:backdrop-blur-xl md:rounded-2xl md:shadow-2xl md:border md:border-white/60 dark:md:border-dark-border/60 min-h-[calc(100vh-2rem)] md:p-8 flex flex-col gap-6 md:gap-8 relative">
      
      {/* Decorative top-left glare inside the card */}
      <div className="hidden md:block absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/80 to-transparent dark:from-white/5 rounded-t-2xl pointer-events-none"></div>

      {/* Welcome Banner (Hidden in guest mode) */}
      {!isGuest && (
        <section className="bg-gradient-to-r from-violet-600 to-purple-700 rounded-3xl p-8 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between shadow-xl shadow-purple-500/20 relative overflow-hidden shrink-0 mt-2">
          {/* Decorative background shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-10 w-32 h-32 bg-purple-900/40 rounded-full blur-2xl translate-y-1/2"></div>
          
          <div className="relative z-10 flex-1 mb-6 md:mb-0 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight text-white">
              {t('dashboard.welcome', { name: firstName })}
            </h1>
            <p className="text-purple-100 text-base md:text-lg max-w-lg leading-relaxed">
              {t('dashboard.welcome_desc')}
            </p>
          </div>
          
          <div className="relative z-10 flex gap-4 w-full md:w-auto justify-center">
            <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center w-28 sm:w-32 aspect-square shadow-sm text-center shrink-0">
              <Flame className="w-7 h-7 sm:w-8 sm:h-8 text-orange-400 mb-1 shrink-0" />
              {loadingStats ? (
                <div className="w-10 h-7 bg-white/30 animate-pulse rounded-md my-0.5" />
              ) : (
                <span className="font-bold text-xl sm:text-2xl text-white leading-none">{streak}</span>
              )}
              <span className="text-[10px] text-purple-100 uppercase tracking-wider font-bold mt-1.5 text-center leading-tight line-clamp-2 px-0.5">{t('dashboard.streak_days')}</span>
            </div>
            <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center w-28 sm:w-32 aspect-square shadow-sm text-center shrink-0">
              <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-400 mb-1 shrink-0" />
              {loadingStats ? (
                <div className="w-12 h-7 bg-white/30 animate-pulse rounded-md my-0.5" />
              ) : (
                <span className="font-bold text-xl sm:text-2xl text-white leading-none">{xp}</span>
              )}
              <span className="text-[10px] text-purple-100 uppercase tracking-wider font-bold mt-1.5 text-center leading-tight line-clamp-2 px-0.5">{t('dashboard.total_xp')}</span>
            </div>
          </div>
        </section>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col gap-8 relative z-10">
          
          {/* Mobile Feedback / Review Button Card */}
          <div className="md:hidden bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 text-white shadow-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                <MessageSquarePlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-sm leading-tight">{t('reviews.modal_title', 'Отзывы и предложения')}</h4>
                <p className="text-xs text-amber-100 mt-0.5">{t('reviews.modal_subtitle', 'Поделитесь впечатлением или ошибкой')}</p>
              </div>
            </div>
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="px-3.5 py-2 bg-white text-amber-600 font-extrabold text-xs rounded-xl shadow-sm shrink-0 active:scale-95 transition-transform"
            >
              {t('reviews.btn_label', 'Отзывы')}
            </button>
          </div>

          {/* Daily Tasks */}
          <section className="bg-white dark:bg-dark-surface rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-dark-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-5">
              <div className="hidden sm:flex w-16 h-16 bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 rounded-2xl items-center justify-center shrink-0">
                <Brain className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-dark-text-main text-xl mb-1">{t('dashboard.daily_tasks')}</h3>
                <p className="text-slate-500 dark:text-dark-text-muted font-medium">
                  {reviewsCount > 0 ? (
                    <Trans i18nKey="dashboard.reviews_waiting" values={{ count: reviewsCount }}>
                      Вас ждут <strong className="text-rose-500">{reviewsCount} карточек</strong> для интервального повторения.
                    </Trans>
                  ) : (
                    <>{t('dashboard.reviews_done')}</>
                  )}
                </p>
              </div>
            </div>
            <Link to="/progress" className="w-full sm:w-auto px-6 py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-colors shrink-0 text-center shadow-md shadow-rose-500/20">
              {reviewsCount > 0 ? t('dashboard.start_review') : t('dashboard.go_to_progress')}
            </Link>
          </section>

          {/* Available Subjects */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-extrabold text-slate-800 dark:text-dark-text-main text-xl">{t('dashboard.available_subjects')}</h3>
              <Link to="/tests/thematic" className="text-sm font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors">{t('dashboard.all_subjects')}</Link>
            </div>

            {loadingSubjects ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="bg-white dark:bg-dark-surface rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-sm border border-slate-100 dark:border-dark-border animate-pulse flex items-center gap-3 sm:flex-col sm:items-start sm:justify-between min-h-0 sm:h-[150px]">
                    <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                    <div className="flex-1 space-y-2 w-full">
                      <div className="h-4 sm:h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4" />
                      <div className="h-3 sm:h-4 bg-slate-100 dark:bg-slate-800/60 rounded-lg w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : displaySubjects.length === 0 ? (
              <div className="bg-white dark:bg-dark-surface rounded-3xl p-8 border border-slate-100 dark:border-dark-border text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                  <FolderX className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-700 dark:text-dark-text-main text-base">
                  {t('leaderboard.no_data')}
                </h4>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {displaySubjects.map((subject) => (
                  <div
                    key={subject.id}
                    onClick={() => handleOpenSubjectModal(subject.originalSubject || { id: subject.id, name: subject.name })}
                    className="block group cursor-pointer"
                  >
                    <div className="bg-white dark:bg-dark-surface rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-sm border border-slate-100 dark:border-dark-border hover:shadow-lg hover:border-violet-100 dark:hover:border-violet-950 transition-all cursor-pointer relative overflow-hidden flex items-center justify-between sm:flex-col sm:items-start sm:justify-between min-h-0 sm:h-[150px] gap-3 group">
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 sm:flex-initial min-w-0 w-full z-10">
                        <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${subject.color} flex items-center justify-center text-lg sm:text-2xl shadow-sm transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shrink-0`}>
                          {subject.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-800 dark:text-dark-text-main text-sm sm:text-lg leading-tight truncate">{subject.name}</h4>
                          <p className="text-slate-500 dark:text-dark-text-muted text-xs sm:text-sm font-medium mt-0.5 truncate">
                            {t('dashboard.check_knowledge')}
                          </p>
                        </div>
                      </div>

                      {/* Mobile Inline Play Button */}
                      <div className={`sm:hidden w-9 h-9 rounded-full bg-gradient-to-br ${subject.color} flex items-center justify-center shadow-md shrink-0 z-10 group-hover:scale-110 transition-transform`}>
                        <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                      </div>

                      {/* Desktop Corner Play Button & Glow */}
                      <div className={`hidden sm:block absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br ${subject.color} opacity-10 transition-transform duration-500 group-hover:scale-[1.4] z-0`}></div>
                      <div className={`hidden sm:flex absolute -bottom-5 -right-5 w-[80px] h-[80px] rounded-full bg-gradient-to-br ${subject.color} items-start justify-start pt-[18px] pl-[18px] shadow-lg transform transition-transform duration-500 group-hover:scale-[1.15] z-10`}>
                        <Play className="w-5 h-5 text-white fill-current" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

      </div>

      <GradeTopicModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        subject={selectedSubjectForModal}
        onStartTest={handleConfirmStartTest}
        isLoading={isLoadingModal}
      />

      <ProjectReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
      />
    </div>
  )
}

export default Dashboard;