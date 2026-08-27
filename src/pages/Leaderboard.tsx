import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { progressApi, type LeaderboardEntry } from '../lib/api/progress';

export default function Leaderboard() {
  const { t } = useTranslation();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    progressApi.getWeeklyLeaderboard().then(setLeaderboard).catch(console.error);
  }, []);
  return (
    <div className="min-h-screen bg-transparent p-4 sm:p-8 flex justify-center items-start">
      <div className="w-full max-w-2xl bg-white dark:bg-dark-surface p-6 sm:p-10 rounded-3xl shadow-xl border border-slate-100 dark:border-dark-border">
        
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <Link to="/dashboard" className="p-2 -ml-2 text-slate-400 dark:text-dark-text-muted hover:text-slate-700 dark:hover:text-dark-text-main hover:bg-slate-50 dark:hover:bg-dark-bg rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-dark-text-main flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-50 dark:bg-yellow-950/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-yellow-500" />
            </div>
            {t('leaderboard.title')}
          </h1>
        </header>

        {/* Leaderboard List */}
        <div className="bg-slate-50 dark:bg-dark-bg rounded-2xl shadow-sm border border-slate-100 dark:border-dark-border overflow-hidden flex flex-col">
          {leaderboard.map((usr) => {
            const isCurrentUser = usr.is_current_user;
            const isFirst = usr.rank === 1;
            const name = usr.nickname || t('leaderboard.anonymous');
            const xp = usr.xp_this_week;
            const avatar = name?.charAt(0).toUpperCase() || '?';

            return (
              <div 
                key={usr.user_id} 
                className={`flex items-center gap-4 p-4 border-b border-slate-100 dark:border-dark-border last:border-0 transition-all ${isCurrentUser ? 'bg-violet-50 dark:bg-violet-950/20' : 'hover:bg-white dark:hover:bg-dark-surface'}`}
              >
                <div className={`w-8 text-center font-extrabold text-lg ${
                  usr.rank === 1 ? 'text-yellow-500' : 
                  usr.rank === 2 ? 'text-slate-400' : 
                  usr.rank === 3 ? 'text-amber-600' : 
                  'text-slate-400 dark:text-dark-text-muted'
                }`}>
                  {usr.rank}
                </div>

                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shrink-0 relative overflow-hidden ${isFirst ? 'bg-gradient-to-br from-yellow-400 to-orange-500 ring-2 ring-yellow-400/30' : usr.rank === 2 ? 'bg-slate-300 dark:bg-slate-700' : usr.rank === 3 ? 'bg-orange-300 dark:bg-orange-950/60' : 'bg-slate-200 dark:bg-slate-800'}`}>
                  {usr.avatar_url ? (
                    <img src={usr.avatar_url} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    avatar
                  )}
                  {isFirst && (
                    <div className="absolute inset-0 pointer-events-none animate-shimmer">
                      <div className="w-8 h-[200%] bg-white/40 blur-[2px] absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2"></div>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className={`font-bold text-base truncate ${isFirst ? 'text-yellow-900 dark:text-yellow-200' : isCurrentUser ? 'text-violet-700 dark:text-violet-400' : 'text-slate-800 dark:text-dark-text-main'}`}>
                    {name} {isCurrentUser && t('leaderboard.you')}
                  </h4>
                </div>

                <div className={`font-extrabold text-base whitespace-nowrap ${isFirst ? 'text-yellow-600' : isCurrentUser ? 'text-violet-600 dark:text-violet-400' : 'text-slate-600 dark:text-dark-text-main'}`}>
                  {xp.toLocaleString()} XP
                </div>
              </div>
            );
          })}
          
          {leaderboard.length === 0 && (
            <div className="p-8 text-center text-slate-500 dark:text-dark-text-muted font-medium">
              {t('leaderboard.no_data')}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
