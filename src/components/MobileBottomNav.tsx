import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Bot, BarChart2 } from 'lucide-react';

export default function MobileBottomNav() {
  const location = useLocation();

  const navLinks = [
    { name: 'Главная', path: '/dashboard', icon: Home },
    { name: 'Тесты', path: '/tests', icon: FileText },
    { name: 'Наставник', path: '/mentor', icon: Bot },
    { name: 'Прогресс', path: '/progress', icon: BarChart2 },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-surface border-t border-slate-100 dark:border-dark-border z-50 pb-safe shadow-[0_-4px_25px_rgba(0,0,0,0.05)] dark:shadow-black/60">
      <div className="flex items-center justify-around p-2">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex flex-col items-center p-1.5 rounded-xl min-w-[64px] transition-all duration-200 ${isActive ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 hover:text-slate-600 dark:text-dark-text-muted dark:hover:text-dark-text-main'}`}
            >
              <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-1 transition-all duration-300 ${
                isActive 
                  ? 'bg-gradient-to-tr from-violet-600 to-fuchsia-500 shadow-lg shadow-violet-500/30 -translate-y-1' 
                  : 'bg-transparent'
              }`}>
                <link.icon 
                  className={`transition-all duration-300 ${
                    isActive 
                      ? 'w-5 h-5 stroke-[2.5px] text-white' 
                      : 'w-6 h-6 stroke-2 text-slate-400 dark:text-dark-text-muted'
                  }`} 
                />
              </div>
              <span className={`text-[10px] font-bold transition-all duration-300 ${
                isActive ? 'text-violet-700 dark:text-violet-400' : 'text-slate-500 dark:text-dark-text-muted'
              }`}>
                {link.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
