import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Medal } from 'lucide-react';
import { progressApi, type LeaderboardEntry } from '../lib/api/progress';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    progressApi.getWeeklyLeaderboard().then(setLeaderboard).catch(console.error);
  }, []);
  return (
    <div className="min-h-screen bg-transparent p-4 sm:p-8 flex justify-center items-start">
      <div className="w-full max-w-2xl bg-surface p-8 sm:p-12 rounded-3xl shadow-2xl border border-white/20">
        
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <Link to="/dashboard" className="p-2 -ml-2 text-slate-400 hover:text-slate-700 bg-surface rounded-full shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-accent-amber" />
            Weekly Leaderboard
          </h1>
        </header>

        {/* Podium Area (Top 3) */}
        <div className="flex items-end justify-center gap-2 sm:gap-6 mb-12 h-48">
          {/* Rank 2 */}
          {leaderboard[1] && (
            <div className="flex flex-col items-center flex-1 max-w-[100px]">
              <div className="w-12 h-12 bg-slate-200 rounded-full mb-2 flex items-center justify-center font-bold text-slate-500 shadow-inner">
                {leaderboard[1].full_name.charAt(0)}
              </div>
              <span className="text-sm font-semibold truncate w-full text-center">{leaderboard[1].full_name}</span>
              <span className="text-xs text-primary font-bold mb-2">{leaderboard[1].xp} XP</span>
              <div className="w-full h-24 bg-slate-300 rounded-t-xl flex justify-center pt-2 shadow-inner">
                <Medal className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          )}

          {/* Rank 1 */}
          {leaderboard[0] && (
            <div className="flex flex-col items-center flex-1 max-w-[120px]">
              <div className="w-16 h-16 bg-amber-100 border-2 border-accent-amber rounded-full mb-2 flex items-center justify-center font-bold text-amber-700 shadow-sm relative">
                {leaderboard[0].full_name.charAt(0)}
                <div className="absolute -top-3 w-6 h-6 bg-accent-amber rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">1</div>
              </div>
              <span className="text-sm font-bold truncate w-full text-center">{leaderboard[0].full_name}</span>
              <span className="text-xs text-primary font-bold mb-2">{leaderboard[0].xp} XP</span>
              <div className="w-full h-32 bg-accent-amber rounded-t-xl flex justify-center pt-2 shadow-inner">
                <Trophy className="w-6 h-6 text-yellow-100" />
              </div>
            </div>
          )}

          {/* Rank 3 */}
          {leaderboard[2] && (
            <div className="flex flex-col items-center flex-1 max-w-[100px]">
              <div className="w-12 h-12 bg-orange-100 rounded-full mb-2 flex items-center justify-center font-bold text-orange-700 shadow-inner">
                {leaderboard[2].full_name.charAt(0)}
              </div>
              <span className="text-sm font-semibold truncate w-full text-center">{leaderboard[2].full_name}</span>
              <span className="text-xs text-primary font-bold mb-2">{leaderboard[2].xp} XP</span>
              <div className="w-full h-20 bg-orange-300 rounded-t-xl flex justify-center pt-2 shadow-inner">
                <Medal className="w-5 h-5 text-orange-100" />
              </div>
            </div>
          )}
        </div>

        {/* Remaining List */}
        <div className="bg-surface rounded-2xl shadow-soft border border-border overflow-hidden">
          {leaderboard.slice(3).map((user) => (
            <div 
              key={user.user_id} 
              className={`flex items-center justify-between p-4 border-b border-border last:border-0 ${user.is_current_user ? 'bg-primary-soft/50' : 'hover:bg-slate-50 transition-colors'}`}
            >
              <div className="flex items-center gap-4">
                <span className={`w-6 font-bold text-center ${user.is_current_user ? 'text-primary' : 'text-slate-400'}`}>
                  {user.rank}
                </span>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${user.is_current_user ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {user.full_name.charAt(0)}
                </div>
                <span className={`font-medium ${user.is_current_user ? 'text-primary' : 'text-slate-700'}`}>
                  {user.full_name} {user.is_current_user && '(Вы)'}
                </span>
              </div>
              <span className="font-bold text-primary">{user.xp.toLocaleString()} XP</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
