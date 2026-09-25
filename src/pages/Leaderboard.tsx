import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Shield, ArrowUpRight, ArrowDownRight, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ratingApi, type LeagueGroup, type LeagueParticipant } from '../lib/api/rating';

export default function Leaderboard() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'league' | 'global'>('league');
  const [globalPeriod, setGlobalPeriod] = useState<'weekly' | 'monthly' | 'all_time'>('weekly');
  
  const [leagueGroup, setLeagueGroup] = useState<LeagueGroup | null>(null);
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeagueParticipant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    if (activeTab === 'league') {
      ratingApi.getLeague()
        .then(data => setLeagueGroup(data))
        .catch(err => console.error('Failed to load league data:', err))
        .finally(() => setLoading(false));
    } else {
      ratingApi.getLeaderboard(globalPeriod)
        .then(data => {
          setGlobalLeaderboard(data.results || []);
        })
        .catch(err => console.error('Failed to load global leaderboard:', err))
        .finally(() => setLoading(false));
    }
  }, [activeTab, globalPeriod]);

  const getTierGradient = (tierName?: string) => {
    const lower = (tierName || '').toLowerCase();
    if (lower.includes('diamond') || lower.includes('almos')) return 'from-cyan-600 to-blue-700';
    if (lower.includes('platinum') || lower.includes('platina')) return 'from-teal-600 to-emerald-700';
    if (lower.includes('gold') || lower.includes('oltin')) return 'from-amber-500 to-yellow-600';
    if (lower.includes('silver') || lower.includes('kumush')) return 'from-slate-600 to-slate-800';
    return 'from-amber-700 to-orange-800'; // Bronze
  };

  const renderZoneBadge = (rank: number, total: number = 30) => {
    if (rank <= 7) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
          <ArrowUpRight className="w-3.5 h-3.5" />
          {t('leaderboard.promotion_zone', 'O\'tish zonasi')}
        </span>
      );
    }
    if (rank > total - 5) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
          <ArrowDownRight className="w-3.5 h-3.5" />
          {t('leaderboard.demotion_zone', 'Tushish zonasi')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-dark-bg text-slate-500 dark:text-dark-text-muted">
        {t('leaderboard.safe_zone', 'Xavfsiz zona')}
      </span>
    );
  };

  const standingsList = activeTab === 'league' ? (leagueGroup?.standings || []) : globalLeaderboard;

  return (
    <div className="min-h-screen bg-transparent p-4 sm:p-8 flex justify-center items-start">
      <div className="w-full max-w-3xl bg-white dark:bg-dark-surface p-6 sm:p-10 rounded-3xl shadow-xl border border-slate-100 dark:border-dark-border">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 -ml-2 text-slate-400 dark:text-dark-text-muted hover:text-slate-700 dark:hover:text-dark-text-main hover:bg-slate-50 dark:hover:bg-dark-bg rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-dark-text-main flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-50 dark:bg-yellow-950/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-500" />
              </div>
              {t('leaderboard.title', 'Reyting va Ligalar')}
            </h1>
          </div>
        </header>

        {/* Tab Selection */}
        <div className="flex bg-slate-100 dark:bg-dark-bg p-1.5 rounded-2xl mb-6">
          <button
            onClick={() => setActiveTab('league')}
            className={`flex-1 py-3 text-sm font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'league'
                ? 'bg-white dark:bg-dark-surface text-violet-600 dark:text-violet-400 shadow-sm'
                : 'text-slate-500 dark:text-dark-text-muted hover:text-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            {t('leaderboard.tab_league', 'Haftalik Liga (30 kishi)')}
          </button>
          <button
            onClick={() => setActiveTab('global')}
            className={`flex-1 py-3 text-sm font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'global'
                ? 'bg-white dark:bg-dark-surface text-violet-600 dark:text-violet-400 shadow-sm'
                : 'text-slate-500 dark:text-dark-text-muted hover:text-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            {t('leaderboard.tab_global', 'Umumiy Reyting')}
          </button>
        </div>

        {/* League Info Banner */}
        {activeTab === 'league' && leagueGroup && (
          <div className={`bg-gradient-to-r ${getTierGradient(leagueGroup.tier_name)} rounded-2xl p-6 text-white mb-6 shadow-md relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4`}>
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shrink-0">
                <Shield className="w-8 h-8 text-yellow-300" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-violet-200">
                  {t('leaderboard.current_tier', 'Joriy Ligangiz')}
                </span>
                <h2 className="text-2xl font-black">{leagueGroup.tier_name || 'Kumush Liga'}</h2>
                <p className="text-xs text-violet-100 mt-1">
                  30 kishilik guruhingizda haftalik XP bo'yicha kurashing
                </p>
              </div>
            </div>

            {leagueGroup.my_rank && (
              <div className="bg-white/10 backdrop-blur-sm px-5 py-3 rounded-xl border border-white/20 text-center shrink-0">
                <p className="text-xs text-violet-200 font-bold">{t('leaderboard.your_rank', 'Sizning o\'rningiz')}</p>
                <p className="text-2xl font-black">{leagueGroup.my_rank} / 30</p>
              </div>
            )}
          </div>
        )}

        {/* Global Period Filters */}
        {activeTab === 'global' && (
          <div className="flex gap-2 mb-6 justify-center">
            {(['weekly', 'monthly', 'all_time'] as const).map(period => (
              <button
                key={period}
                onClick={() => setGlobalPeriod(period)}
                className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all capitalize ${
                  globalPeriod === period
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-dark-bg text-slate-600 dark:text-dark-text-muted hover:bg-slate-200'
                }`}
              >
                {period === 'weekly' ? t('leaderboard.weekly', 'Haftalik') : period === 'monthly' ? t('leaderboard.monthly', 'Oylik') : t('leaderboard.all_time', 'Barchasi')}
              </button>
            ))}
          </div>
        )}

        {/* Leaderboard List */}
        <div className="bg-slate-50 dark:bg-dark-bg rounded-2xl shadow-sm border border-slate-100 dark:border-dark-border overflow-hidden flex flex-col">
          {loading ? (
            <div className="divide-y divide-slate-100 dark:divide-dark-border">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="flex items-center gap-4 p-4 animate-pulse">
                  <div className="w-8 h-6 bg-slate-200 dark:bg-slate-800 rounded shrink-0" />
                  <div className="w-11 h-11 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                    <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-1/5" />
                  </div>
                  <div className="w-16 h-5 bg-slate-200 dark:bg-slate-800 rounded shrink-0" />
                </div>
              ))}
            </div>
          ) : standingsList.length > 0 ? (
            standingsList.map((usr) => {
              const isCurrentUser = usr.is_current_user;
              const isFirst = usr.rank === 1;
              const name = usr.nickname || t('leaderboard.anonymous', 'Foydalanuvchi');
              const xp = usr.xp || usr.xp_this_week || 0;
              const avatar = name?.charAt(0).toUpperCase() || '?';

              return (
                <div 
                  key={usr.user_id || usr.rank} 
                  className={`flex items-center gap-4 p-4 border-b border-slate-100 dark:border-dark-border last:border-0 transition-all ${
                    isCurrentUser ? 'bg-violet-50 dark:bg-violet-950/30 ring-1 ring-violet-200 dark:ring-violet-900/50' : 'hover:bg-white dark:hover:bg-dark-surface'
                  }`}
                >
                  <div className={`w-8 text-center font-extrabold text-lg shrink-0 ${
                    usr.rank === 1 ? 'text-yellow-500' : 
                    usr.rank === 2 ? 'text-slate-400' : 
                    usr.rank === 3 ? 'text-amber-600' : 
                    'text-slate-400 dark:text-dark-text-muted'
                  }`}>
                    {usr.rank}
                  </div>

                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white shrink-0 relative overflow-hidden ${
                    isFirst ? 'bg-gradient-to-br from-yellow-400 to-orange-500 ring-2 ring-yellow-400/30' : 
                    usr.rank === 2 ? 'bg-slate-300 dark:bg-slate-700' : 
                    usr.rank === 3 ? 'bg-orange-300 dark:bg-orange-950/60' : 
                    'bg-slate-200 dark:bg-slate-800'
                  }`}>
                    {usr.avatar_url ? (
                      <img src={usr.avatar_url} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      avatar
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className={`font-bold text-base truncate flex items-center gap-2 ${
                      isFirst ? 'text-yellow-900 dark:text-yellow-200' : 
                      isCurrentUser ? 'text-violet-700 dark:text-violet-400 font-extrabold' : 
                      'text-slate-800 dark:text-dark-text-main'
                    }`}>
                      {name}
                      {isCurrentUser && (
                        <span className="px-2 py-0.5 bg-violet-600 text-white text-[10px] rounded-md font-bold uppercase">
                          {t('leaderboard.you', 'Siz')}
                        </span>
                      )}
                    </h4>
                    {activeTab === 'league' && (
                      <div className="mt-1">
                        {renderZoneBadge(usr.rank, leagueGroup?.league_size || 30)}
                      </div>
                    )}
                  </div>

                  <div className={`font-extrabold text-base whitespace-nowrap ${
                    isFirst ? 'text-yellow-600' : 
                    isCurrentUser ? 'text-violet-600 dark:text-violet-400' : 
                    'text-slate-600 dark:text-dark-text-main'
                  }`}>
                    {xp.toLocaleString()} XP
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-500 dark:text-dark-text-muted font-medium">
              {t('leaderboard.no_data', 'Ma\'lumotlar topilmadi')}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
