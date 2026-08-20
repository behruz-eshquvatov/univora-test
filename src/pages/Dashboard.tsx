import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Trophy, Flame, Calculator, Atom, Terminal, Globe, Brain, ArrowUpRight, BookOpen } from 'lucide-react';
import { catalogApi, type Subject } from '../lib/api/catalog';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

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

// Mock data for the chart
const XP_DATA = [
  { name: 'Пн', xp: 200 },
  { name: 'Вт', xp: 350 },
  { name: 'Ср', xp: 450 },
  { name: 'Чт', xp: 600 },
  { name: 'Пт', xp: 550 },
  { name: 'Сб', xp: 850 },
  { name: 'Вс', xp: 1250 },
];

// Custom tooltip for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 text-white px-3 py-2 rounded-xl shadow-lg text-sm font-bold border border-slate-700">
        <p className="mb-1 text-slate-300 font-medium">{label}</p>
        <p className="text-violet-400">{payload[0].value} XP</p>
      </div>
    );
  }
  return null;
};

// Recharts component for XP History
const XPGraph = () => {
  return (
    <div className="w-full h-[180px] mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={XP_DATA}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
            tickFormatter={(value) => `${value} XP`}
            domain={[0, 'dataMax']}
            tickCount={4}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '3 3' }} />
          <Area 
            type="monotone" 
            dataKey="xp" 
            stroke="#8b5cf6" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorXp)" 
            activeDot={{ r: 6, fill: '#fff', stroke: '#8b5cf6', strokeWidth: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const Dashboard = () => {
  const [apiSubjects, setApiSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    catalogApi.getSubjects()
      .then(data => {
        if (data && data.length > 0) {
          setApiSubjects(data);
        }
      })
      .catch(err => console.log('Failed to fetch catalog subjects', err));
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
        return { id: s.id, name: s.name, icon, color, progress: 0, totalTests: 0 };
      })
    : MOCK_SUBJECTS;

  const { user } = useAuthStore();
  const firstName = user?.full_name?.split(' ')[0] || user?.name || 'Гость';
  const xp = user?.xp_total || 0;
  const streak = 5; // To be fetched from /progress/streak

  return (
    <div className="bg-slate-50/95 dark:bg-dark-surface/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 dark:border-dark-border/60 min-h-[calc(100vh-2rem)] p-6 sm:p-8 flex flex-col gap-8 relative">
      
      {/* Decorative top-left glare inside the card */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/80 to-transparent dark:from-white/5 rounded-t-2xl pointer-events-none"></div>

      {/* Welcome Banner */}
      <section className="bg-gradient-to-r from-violet-600 to-purple-700 rounded-3xl p-8 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between shadow-xl shadow-purple-500/20 relative overflow-hidden shrink-0 mt-2">
        {/* Decorative background shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-10 w-32 h-32 bg-purple-900/40 rounded-full blur-2xl translate-y-1/2"></div>
        
        <div className="relative z-10 flex-1 mb-6 md:mb-0 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight text-white">
            С возвращением, {firstName}! 🚀
          </h1>
          <p className="text-purple-100 text-base md:text-lg max-w-lg leading-relaxed">
            Вы отлично справляетесь. Продолжайте тренировки, чтобы побить свой личный рекорд!
          </p>
        </div>
        
        <div className="relative z-10 flex gap-4 w-full md:w-auto justify-center">
          <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col items-center justify-center min-w-[110px] shadow-sm">
            <Flame className="w-8 h-8 text-orange-400 mb-1" />
            <span className="font-bold text-2xl text-white">{streak}</span>
            <span className="text-[10px] text-purple-100 uppercase tracking-wider font-bold mt-1">Дней подряд</span>
          </div>
          <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col items-center justify-center min-w-[110px] shadow-sm">
            <Trophy className="w-8 h-8 text-yellow-400 mb-1" />
            <span className="font-bold text-2xl text-white">{xp}</span>
            <span className="text-[10px] text-purple-100 uppercase tracking-wider font-bold mt-1">Всего XP</span>
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
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 rounded-2xl flex items-center justify-center shrink-0">
                <Brain className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-dark-text-main text-xl mb-1">Задачи на сегодня</h3>
                <p className="text-slate-500 dark:text-dark-text-muted font-medium">Вас ждут <strong className="text-rose-500">10 карточек</strong> для интервального повторения.</p>
              </div>
            </div>
            <Link to="/history" className="w-full sm:w-auto px-6 py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-colors shrink-0 text-center shadow-md shadow-rose-500/20">
              Начать повторение
            </Link>
          </section>

          {/* Available Subjects */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-extrabold text-slate-800 dark:text-dark-text-main text-xl">Доступные предметы</h3>
              <Link to="/history" className="text-sm font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors">Все предметы</Link>
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
                          <p className="text-slate-500 dark:text-dark-text-muted text-sm font-medium mt-1">{subject.totalTests} тестов</p>
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
                    <div className={`absolute -bottom-5 -right-5 w-[88px] h-[88px] rounded-full bg-gradient-to-br ${subject.color} flex items-start justify-start pt-[18px] pl-[18px] shadow-lg transform transition-transform duration-500 group-hover:scale-[1.15] z-10`}>
                      <span className="text-white font-extrabold text-[17px]">{subject.progress}%</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Mini Stats (XP Chart) */}
          <section className="bg-white dark:bg-dark-surface rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-dark-border">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-extrabold text-slate-800 dark:text-dark-text-main text-xl">Ваш прогресс за неделю</h3>
              <div className="text-sm font-bold text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 px-3 py-1.5 rounded-lg border border-violet-100 dark:border-violet-950/40">
                +350 XP
              </div>
            </div>
            <XPGraph />
          </section>

        </div>

        {/* Right Column (1/3 width) - Leaderboard */}
        <div className="xl:col-span-1">
          <section className="bg-white dark:bg-dark-surface rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-dark-border h-fit sticky top-0 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-extrabold text-slate-800 dark:text-dark-text-main text-xl">Топ недели</h3>
              <div className="w-10 h-10 rounded-full bg-yellow-50 dark:bg-yellow-950/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-500" />
              </div>
            </div>
            
            <div className="flex-1 space-y-3">
              {MOCK_LEADERBOARD.map((usr, idx) => {
                const isCurrentUser = usr.name === 'Behruz Eshquvatov';
                const isFirst = usr.rank === 1;
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
                      {usr.avatar}
                      {/* Glass Shimmer Effect for Top 1 */}
                      {isFirst && (
                        <div className="absolute inset-0 z-20 pointer-events-none animate-shimmer">
                          <div className="w-8 h-[200%] bg-white/40 blur-[2px] absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2"></div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 relative z-10">
                      <h4 className={`font-bold text-sm truncate ${isFirst ? 'text-yellow-900 dark:text-yellow-200' : isCurrentUser ? 'text-violet-700 dark:text-violet-400' : 'text-slate-800 dark:text-dark-text-main'}`}>
                        {usr.name}
                      </h4>
                      <p className={`text-xs font-bold mt-0.5 ${isFirst ? 'text-yellow-600' : isCurrentUser ? 'text-violet-500 dark:text-violet-400' : 'text-slate-500 dark:text-dark-text-muted'}`}>
                        {usr.xp} XP
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            <button className="w-full mt-6 py-3.5 rounded-xl font-bold text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/20 hover:bg-violet-100 dark:hover:bg-violet-950/40 transition-colors text-sm text-center">
              Смотреть весь рейтинг
            </button>
          </section>
        </div>

      </div>
    </div>
  )
}

export default Dashboard;