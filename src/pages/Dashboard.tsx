import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Trophy, Flame, Calculator, Atom, Terminal, Globe, Brain, ArrowUpRight, BookOpen, Play } from 'lucide-react';
import { catalogApi, type Subject } from '../lib/api/catalog';
import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';


const MOCK_SUBJECTS = [
  { id: 1, name: 'Математика', icon: <Calculator className="w-7 h-7 text-white" />, progress: 65, totalTests: 24, color: 'from-blue-500 to-cyan-400' },
  { id: 2, name: 'Физика', icon: <Atom className="w-7 h-7 text-white" />, progress: 40, totalTests: 12, color: 'from-purple-500 to-indigo-500' },
  { id: 3, name: 'Информатика', icon: <Terminal className="w-7 h-7 text-white" />, progress: 85, totalTests: 40, color: 'from-emerald-500 to-teal-400' },
  { id: 4, name: 'Английский', icon: <Globe className="w-7 h-7 text-white" />, progress: 20, totalTests: 5, color: 'from-rose-500 to-pink-500' },
];

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Алина K.', xp: 2450, avatar: 'A' },
  { rank: 2, name: 'Behruz Eshquvatov', xp: 2100, avatar: 'B' }, // Current user simulated
  { rank: 3, name: 'Тимур В.', xp: 1950, avatar: 'T' },
  { rank: 4, name: 'Сардор', xp: 1800, avatar: 'S' },
  { rank: 5, name: 'Лена', xp: 1650, avatar: 'L' },
];



const Dashboard = () => {
  const { t } = useTranslation();
  const [apiSubjects, setApiSubjects] = useState<Subject[]>([]);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    catalogApi.getSubjects()
      .then(data => {
        if (data && data.length > 0) {
          setApiSubjects(data);
        }
      })
      .catch(err => console.log('Failed to fetch catalog subjects', err));

    import('../lib/api/progress').then(({ progressApi }) => {
      progressApi.getTodayReviews()
        .then(data => setReviewsCount(data.length))
        .catch(err => console.log('Failed to fetch reviews', err));
        
      progressApi.getWeeklyLeaderboard()
        .then(data => setLeaderboard(data.slice(0, 5)))
        .catch(err => console.log('Failed to fetch leaderboard', err));
    });
  }, []);

  const getSubjectIconAndColor = (name: string, index: number) => {
    const defaultColors = ['from-blue-500 to-cyan-400', 'from-purple-500 to-indigo-500', 'from-emerald-500 to-teal-400', 'from-rose-500 to-pink-500', 'from-amber-400 to-orange-500'];
    const color = defaultColors[index % defaultColors.length];
    
    let icon = <BookOpen className="w-7 h-7 text-white" />;
    if (name.toLowerCase().includes('мат')) icon = <Calculator className="w-7 h-7 text-white" />;
    if (name.toLowerCase().includes('физ')) icon = <Atom className="w-7 h-7 text-white" />;
    if (name.toLowerCase().includes('инф') || name.toLowerCase().includes('it')) icon = <Terminal className="w-7 h-7 text-white" />;
    if (name.toLowerCase().includes('англ') || name.toLowerCase().includes('яз')) icon = <Globe className="w-7 h-7 text-white" />;
    
    return { icon, color };
  };

  const displaySubjects = apiSubjects.length > 0 
    ? apiSubjects.map((s, i) => {
        const { icon, color } = getSubjectIconAndColor(s.name, i);
        return { id: s.id, name: s.name, icon, color, progress: 0, total_solved_tests: s.total_solved_tests || 0 };
      })
    : MOCK_SUBJECTS.map(s => ({ ...s, total_solved_tests: 0 }));

  const { user, streak, xpSummary } = useAuthStore();
  const firstName = user?.full_name?.split(' ')[0] || user?.name || 'Гость';
  const xp = xpSummary?.xp_total || user?.xp_total || 0;

  return (
    <div className="md:bg-slate-50/95 dark:md:bg-dark-surface/90 md:backdrop-blur-xl md:rounded-2xl md:shadow-2xl md:border md:border-white/60 dark:md:border-dark-border/60 min-h-[calc(100vh-2rem)] md:p-8 flex flex-col gap-6 md:gap-8 relative">
      
      {/* Decorative top-left glare inside the card */}
      <div className="hidden md:block absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/80 to-transparent dark:from-white/5 rounded-t-2xl pointer-events-none"></div>

      {/* Welcome Banner */}
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
          <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col items-center justify-center min-w-[110px] shadow-sm">
            <Flame className="w-8 h-8 text-orange-400 mb-1" />
            <span className="font-bold text-2xl text-white">{streak}</span>
            <span className="text-[10px] text-purple-100 uppercase tracking-wider font-bold mt-1">{t('dashboard.streak_days')}</span>
          </div>
          <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col items-center justify-center min-w-[110px] shadow-sm">
            <Trophy className="w-8 h-8 text-yellow-400 mb-1" />
            <span className="font-bold text-2xl text-white">{xp}</span>
            <span className="text-[10px] text-purple-100 uppercase tracking-wider font-bold mt-1">{t('dashboard.total_xp')}</span>
          </div>
        </div>
      </section>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 relative z-10">
        
        {/* Left Column (2/3 width) */}
        <div className="xl:col-span-2 flex flex-col gap-8">
          
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {displaySubjects.map((subject) => (
                <Link to="/tests" key={subject.id} className="block group">
                  <div className="bg-white dark:bg-dark-surface rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-dark-border hover:shadow-lg hover:border-violet-100 dark:hover:border-violet-950 transition-all cursor-pointer relative overflow-hidden min-h-[160px] flex flex-col justify-between">
                    <div className="flex items-start justify-between relative z-10">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${subject.color} flex items-center justify-center text-2xl shadow-sm transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300`}>
                          {subject.icon}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-dark-text-main text-lg leading-tight">{subject.name}</h4>
                          <p className="text-slate-500 dark:text-dark-text-muted text-sm font-medium mt-1">
                            {t('dashboard.check_knowledge')}
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* Top Right Hover Icon */}
                    <div className="absolute top-6 right-6 text-slate-300 opacity-0 transform translate-x-2 -translate-y-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:text-violet-500 transition-all duration-300 z-10">
                      <ArrowUpRight className="w-7 h-7 stroke-[3]" />
                    </div>

                    {/* Bottom Right Circle Background */}
                    <div className={`absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br ${subject.color} opacity-10 transition-transform duration-500 group-hover:scale-[1.4] z-0`}></div>
                    
                    {/* Bottom Right Percent Circle (Half visible) */}
                    <div className={`absolute -bottom-5 -right-5 w-[88px] h-[88px] rounded-full bg-gradient-to-br ${subject.color} flex items-start justify-start pt-[20px] pl-[20px] shadow-lg transform transition-transform duration-500 group-hover:scale-[1.15] z-10`}>
                      <Play className="w-6 h-6 text-white fill-current" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>



        </div>

        {/* Right Column (1/3 width) - Leaderboard */}
        <div className="xl:col-span-1">
          <section className="bg-white dark:bg-dark-surface rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-dark-border h-fit sticky top-0 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-extrabold text-slate-800 dark:text-dark-text-main text-xl">{t('dashboard.weekly_top')}</h3>
              <div className="w-10 h-10 rounded-full bg-yellow-50 dark:bg-yellow-950/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-500" />
              </div>
            </div>
            
            <div className="flex-1 space-y-3">
              {(leaderboard.length > 0 ? leaderboard : MOCK_LEADERBOARD).map((usr, idx) => {
                const isCurrentUser = usr.is_current_user;
                const isFirst = usr.rank === 1;
                const name = usr.nickname || usr.name;
                const xp = usr.xp_this_week ?? usr.xp;
                const avatar = name?.charAt(0).toUpperCase() || '?';
                
                return (
                  <div key={idx} className={`flex items-center gap-3 p-3 rounded-2xl transition-all relative ${isCurrentUser ? 'bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30' : 'hover:bg-slate-50 dark:hover:bg-dark-bg border border-transparent'}`}>
                    
                    <div className={`w-8 text-center font-extrabold text-lg relative z-10 ${
                      usr.rank === 1 ? 'text-yellow-500' : 
                      usr.rank === 2 ? 'text-slate-400' : 
                      usr.rank === 3 ? 'text-amber-600' : 
                      'text-slate-400'
                    }`}>
                      {usr.rank}
                    </div>
                    
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white shrink-0 relative z-10 overflow-hidden ${isFirst ? 'bg-gradient-to-br from-yellow-400 to-orange-500 ring-2 ring-yellow-400/30' : usr.rank === 2 ? 'bg-slate-300 dark:bg-slate-700' : usr.rank === 3 ? 'bg-orange-300 dark:bg-orange-950/60' : 'bg-slate-200 dark:bg-slate-850'}`}>
                      {usr.avatar_url ? (
                        <img src={usr.avatar_url} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        avatar
                      )}
                      {/* Glass Shimmer Effect for Top 1 */}
                      {isFirst && (
                        <div className="absolute inset-0 z-20 pointer-events-none animate-shimmer">
                          <div className="w-8 h-[200%] bg-white/40 blur-[2px] absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2"></div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 relative z-10">
                      <h4 className={`font-bold text-sm truncate ${isFirst ? 'text-yellow-900 dark:text-yellow-200' : isCurrentUser ? 'text-violet-700 dark:text-violet-400' : 'text-slate-800 dark:text-dark-text-main'}`}>
                        {name}
                      </h4>
                      <p className={`text-xs font-bold mt-0.5 ${isFirst ? 'text-yellow-600' : isCurrentUser ? 'text-violet-500 dark:text-violet-400' : 'text-slate-500 dark:text-dark-text-muted'}`}>
                        {xp} XP
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            <button className="w-full mt-6 py-3.5 rounded-xl font-bold text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/20 hover:bg-violet-100 dark:hover:bg-violet-950/40 transition-colors text-sm text-center">
              {t('dashboard.view_full_rating')}
            </button>
          </section>
        </div>

      </div>
    </div>
  )
}

export default Dashboard;