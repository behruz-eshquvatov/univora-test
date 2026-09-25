import { useEffect, useState } from 'react';
import { catalogApi, type Subject } from '../lib/api/catalog';
import { testengineApi } from '../lib/api/testengine';
import { Calculator, Atom, Terminal, Globe, BookOpen, Play, FolderX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { GradeTopicModal } from '../components/GradeTopicModal';



export default function ThematicTests() {
  const { t, i18n } = useTranslation();
  const [apiSubjects, setApiSubjects] = useState<Subject[]>([]);
  const [selectedSubjectForModal, setSelectedSubjectForModal] = useState<Subject | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [isLoadingModal, setIsLoadingModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setLoadingSubjects(true);
    catalogApi.getSubjects()
      .then(data => {
        const subjectList = Array.isArray(data) ? data : (data as any).results || [];
        setApiSubjects(subjectList.filter((s: Subject) => s.has_test !== false));
      })
      .catch(err => console.log('Failed to fetch catalog subjects', err))
      .finally(() => setLoadingSubjects(false));
  }, [i18n.language]);

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

  const displaySubjects = apiSubjects.map((s, i) => {
    const { icon, color } = getSubjectIconAndColor(s.name, i);
    return { id: s.id, name: s.name, icon, color, originalSubject: s };
  });

  const handleOpenSubjectModal = (subject: Subject) => {
    setSelectedSubjectForModal(subject);
    setIsModalOpen(true);
  };

  const { isGuest } = useAuthStore();

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

  return (
    <div className="md:bg-slate-50/95 dark:bg-dark-surface/90 md:backdrop-blur-xl md:rounded-2xl md:shadow-2xl md:border md:border-white/60 dark:md:border-dark-border/60 min-h-[calc(100vh-2rem)] md:p-8 flex flex-col gap-6 md:gap-8 relative overflow-hidden">
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2 mb-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-dark-text-main tracking-tight">{t('thematic_tests.title')}</h1>
          <p className="text-slate-500 dark:text-dark-text-muted mt-2 font-medium text-lg">{t('thematic_tests.subtitle')}</p>
        </div>
      </div>

      {/* DTM Blok Imtihoni Banner */}
      <section className="relative z-10 bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-xl overflow-hidden border border-white/10">
        <div className="mb-4 sm:mb-0">
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
          to="/mock-exam"
          className="px-6 py-3.5 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-extrabold rounded-2xl transition-all shadow-lg hover:scale-105 active:scale-95 text-sm shrink-0"
        >
          Blok imtihonini boshlash
        </Link>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 relative z-10">
        {loadingSubjects ? (
          [1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="bg-white dark:bg-dark-surface rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border border-slate-100 dark:border-dark-border animate-pulse flex items-center gap-3 sm:flex-col sm:items-start sm:justify-between min-h-0 sm:h-[150px] relative overflow-hidden">
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-200 dark:bg-slate-700/60 shrink-0" />
              <div className="flex-1 space-y-2 w-full">
                <div className="h-4 sm:h-5 bg-slate-200 dark:bg-slate-700/60 rounded w-2/3" />
                <div className="h-3 sm:h-4 bg-slate-200 dark:bg-slate-700/60 rounded w-1/2" />
              </div>
            </div>
          ))
        ) : displaySubjects.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-dark-surface rounded-3xl p-12 border border-slate-100 dark:border-dark-border text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
              <FolderX className="w-7 h-7" />
            </div>
            <h4 className="font-extrabold text-slate-700 dark:text-dark-text-main text-lg">
              {t('leaderboard.no_data')}
            </h4>
          </div>
        ) : (
          displaySubjects.map((subject) => (
            <div
              key={subject.id}
              onClick={() => handleOpenSubjectModal(subject.originalSubject || { id: subject.id, name: subject.name })}
              className="block group cursor-pointer"
            >
              <div className="bg-white dark:bg-dark-surface rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-sm border border-slate-100 dark:border-dark-border hover:shadow-lg hover:border-violet-100 dark:hover:border-violet-950 transition-all relative overflow-hidden flex items-center justify-between sm:flex-col sm:items-start sm:justify-between min-h-0 sm:h-[150px] gap-3 group">
                <div className="flex items-center gap-3 sm:gap-4 flex-1 sm:flex-initial min-w-0 w-full z-10">
                  <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${subject.color} flex items-center justify-center shadow-sm transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shrink-0 text-lg sm:text-2xl`}>
                    {subject.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-slate-800 dark:text-dark-text-main text-sm sm:text-lg leading-tight truncate">{subject.name}</h4>
                    <p className="text-slate-500 dark:text-dark-text-muted text-xs sm:text-sm font-medium mt-0.5 truncate">
                      {t('thematic_tests.check_knowledge')}
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
          ))
        )}
      </div>

      <GradeTopicModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        subject={selectedSubjectForModal}
        onStartTest={handleConfirmStartTest}
        isLoading={isLoadingModal}
      />
    </div>
  );
}
