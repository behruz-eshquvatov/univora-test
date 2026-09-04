import { useEffect, useState } from 'react';
import { catalogApi, type Subject } from '../lib/api/catalog';
import { Link } from 'react-router-dom';
import { Calculator, Atom, Terminal, Globe, BookOpen, Play, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MOCK_SUBJECTS_FN = (t: any) => [
  { id: 1, name: t('thematic_tests.math'), icon: <Calculator className="w-7 h-7 text-white" />, color: 'from-blue-500 to-cyan-400' },
  { id: 2, name: t('thematic_tests.physics'), icon: <Atom className="w-7 h-7 text-white" />, color: 'from-purple-500 to-indigo-500' },
  { id: 3, name: t('thematic_tests.informatics'), icon: <Terminal className="w-7 h-7 text-white" />, color: 'from-emerald-500 to-teal-400' },
  { id: 4, name: t('thematic_tests.english'), icon: <Globe className="w-7 h-7 text-white" />, color: 'from-rose-500 to-pink-500' },
];

export default function ThematicTests() {
  const { t, i18n } = useTranslation();
  const [apiSubjects, setApiSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    catalogApi.getSubjects()
      .then(data => {
        if (data && data.length > 0) {
          setApiSubjects(data);
        }
      })
      .catch(err => console.log('Failed to fetch catalog subjects', err));
  }, [i18n.language]);

  const getSubjectIconAndColor = (name: string, index: number) => {
    const defaultColors = ['from-blue-500 to-cyan-400', 'from-purple-500 to-indigo-500', 'from-emerald-500 to-teal-400', 'from-rose-500 to-pink-500', 'from-amber-400 to-orange-500'];
    const color = defaultColors[index % defaultColors.length];
    
    let icon = <BookOpen className="w-7 h-7 text-white" />;
    if (name.toLowerCase().includes('мат') || name.toLowerCase().includes('math')) icon = <Calculator className="w-7 h-7 text-white" />;
    if (name.toLowerCase().includes('физ') || name.toLowerCase().includes('phys')) icon = <Atom className="w-7 h-7 text-white" />;
    if (name.toLowerCase().includes('инф') || name.toLowerCase().includes('it')) icon = <Terminal className="w-7 h-7 text-white" />;
    if (name.toLowerCase().includes('англ') || name.toLowerCase().includes('eng')) icon = <Globe className="w-7 h-7 text-white" />;
    
    return { icon, color };
  };

  const displaySubjects = apiSubjects.length > 0 
    ? apiSubjects.map((s, i) => {
        const { icon, color } = getSubjectIconAndColor(s.name, i);
        return { id: s.id, name: s.name, icon, color };
      })
    : MOCK_SUBJECTS_FN(t);

  return (
    <div className="md:bg-slate-50/95 dark:bg-dark-surface/90 md:backdrop-blur-xl md:rounded-2xl md:shadow-2xl md:border md:border-white/60 dark:md:border-dark-border/60 min-h-[calc(100vh-2rem)] md:p-8 flex flex-col gap-6 md:gap-8 relative overflow-hidden">
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2 mb-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-dark-text-main tracking-tight">{t('thematic_tests.title')}</h1>
          <p className="text-slate-500 dark:text-dark-text-muted mt-2 font-medium text-lg">{t('thematic_tests.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
        {displaySubjects.map((subject) => (
          <Link to="/tests" key={subject.id} className="block group">
            <div className="bg-white dark:bg-dark-surface rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-dark-border hover:shadow-lg hover:border-violet-100 dark:hover:border-violet-950 transition-all cursor-pointer relative overflow-hidden h-[180px] sm:h-[200px] flex flex-col justify-between">
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${subject.color} flex items-center justify-center shadow-sm transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300`}>
                    {subject.icon}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 dark:text-dark-text-main text-lg sm:text-xl leading-tight">{subject.name}</h4>
                    <p className="text-slate-500 dark:text-dark-text-muted text-sm font-medium mt-1">
                      {t('thematic_tests.check_knowledge')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="absolute top-6 right-6 text-slate-300 opacity-0 transform translate-x-2 -translate-y-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:text-violet-500 transition-all duration-300 z-10">
                <ArrowUpRight className="w-7 h-7 stroke-[3]" />
              </div>

              <div className={`absolute -bottom-10 -right-10 w-36 h-36 rounded-full bg-gradient-to-br ${subject.color} opacity-10 transition-transform duration-500 group-hover:scale-[1.4] z-0`}></div>
              
              <div className={`absolute -bottom-5 -right-5 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br ${subject.color} flex items-start justify-start pt-[22px] pl-[22px] sm:pt-[26px] sm:pl-[26px] shadow-lg transform transition-transform duration-500 group-hover:scale-[1.15] z-10`}>
                <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white fill-current" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
