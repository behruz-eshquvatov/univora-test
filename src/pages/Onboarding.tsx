import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizStore } from '../store/useQuizStore';
import { ChevronLeft, Plus, Check, AlertCircle, Clock, X, BookOpen } from 'lucide-react';
import { catalogApi } from '../lib/api/catalog';
import { testengineApi } from '../lib/api/testengine';

const FACULTY_SUBJECTS: Record<string, string[]> = {
  'IT и Инженерия': ['Математика', 'Физика', 'Информатика', 'Английский', 'Логика'],
  'Медицина': ['Биология', 'Химия', 'Русский язык', 'Математика', 'Анатомия'],
  'Юриспруденция': ['Всемирная история', 'Основы права', 'Английский', 'Человек и общество', 'Математика'],
  'Экономика': ['Математика', 'География', 'История', 'Английский', 'Логика'],
  'Педагогика': ['История', 'География', 'Биология', 'Литература', 'Математика'],
  'Международные отношения': ['Английский', 'Всемирная история', 'География', 'История', 'Литература'],
  'Филология': ['Русский язык', 'Литература', 'Английский', 'История', 'География'],
  'Архитектура': ['Математика', 'Физика', 'Черчение', 'История', 'География'],
  'Бизнес управление': ['Математика', 'География', 'Английский', 'История', 'Основы права']
};

const DIRECTIONS = Object.keys(FACULTY_SUBJECTS);

export default function Onboarding() {
  const navigate = useNavigate();
  const { direction, setDirection, selectedSubjects, toggleSubject } = useQuizStore();
  const [step, setStep] = useState(1);
  const [showReadyModal, setShowReadyModal] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const handleNext = () => {
    if (step === 1 && direction) {
      setStep(2);
    } else if (step === 2 && selectedSubjects.length > 0) {
      setShowReadyModal(true);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/');
    }
  };

  const handleStartTest = async () => {
    setIsStarting(true);
    const subjectsToUse = selectedSubjects.length > 0 ? selectedSubjects : ['Математика', 'Физика'];
    const chosenSubjectName = subjectsToUse[0];

    try {
      const dbSubjects = await catalogApi.getSubjects();
      const list = Array.isArray(dbSubjects) ? dbSubjects : (dbSubjects as any).results ?? [];
      const match = list.find((s: any) => s.name.toLowerCase().trim() === chosenSubjectName.toLowerCase().trim());
      const targetSubjectId = match ? match.id : (list[0]?.id || 1);
      
      const session = await testengineApi.startSession(targetSubjectId);
      navigate(`/quiz/${session.id}`);
    } catch (err) {
      console.error('Failed to start real session, falling back to first available:', err);
      try {
        const session = await testengineApi.startSession(1);
        navigate(`/quiz/${session.id}`);
      } catch {
        navigate('/dashboard');
      }
    } finally {
      setIsStarting(false);
    }
  };

  const availableSubjects = direction ? FACULTY_SUBJECTS[direction] || [] : [];

  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4 py-12 relative z-10">
      <div className="w-full max-w-3xl bg-surface p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/20 text-slate-800">
        
        {/* Header: Back Btn & Progress Dots */}
        <div className="flex justify-between items-center pb-6 mb-8 border-b border-slate-200 -mx-6 sm:-mx-8 px-6 sm:px-8">
          <div className="w-10">
            <button 
              onClick={handleBack} 
              className="text-slate-400 hover:text-slate-600 transition-colors p-2 -ml-2 rounded-full hover:bg-slate-100 flex items-center justify-center"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex items-center gap-1.5">
            <div className={`h-2 rounded-full transition-all ${step === 1 ? 'w-6 bg-primary' : step > 1 ? 'w-2 bg-primary' : 'w-2 bg-slate-200'}`}></div>
            <div className={`h-2 rounded-full transition-all ${step === 2 ? 'w-6 bg-primary' : step > 2 ? 'w-2 bg-primary' : 'w-2 bg-slate-200'}`}></div>
          </div>
        </div>

        {/* Step 1: Faculty */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8">Какое направление вы выбрали?</h2>
            
            <div className="flex flex-wrap gap-3 mb-12">
              {DIRECTIONS.map(dir => (
                <button 
                  key={dir} 
                  onClick={() => setDirection(dir)}
                  className={`px-5 py-2.5 rounded-full border-2 transition-all font-medium ${
                    direction === dir 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {dir}
                </button>
              ))}
            </div>
            
            <button 
              onClick={handleNext}
              disabled={!direction}
              className={`w-full py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center ${
                direction
                  ? 'bg-primary text-white hover:bg-violet-600 shadow-[0_0_30px_rgba(139,92,246,0.3)]'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              Продолжить
            </button>
          </div>
        )}

        {/* Step 2: Subjects */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl sm:text-4xl font-bold mb-2">Какие предметы вам даются сложнее?</h2>
            <p className="text-slate-500 mb-8">Можно выбрать несколько (до 5)</p>

            <div className="flex flex-wrap gap-3 mb-12">
              {availableSubjects.map(subject => {
                const isSelected = selectedSubjects.includes(subject);
                const isDisabled = !isSelected && selectedSubjects.length >= 5;
                
                return (
                  <button 
                    key={subject}
                    disabled={isDisabled} 
                    onClick={() => toggleSubject(subject)}
                    className={`px-5 py-2.5 rounded-full border-2 transition-all flex items-center gap-2 font-medium ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary' 
                        : isDisabled
                          ? 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected ? (
                      <Check className="w-4 h-4 text-primary" />
                    ) : (
                      <Plus className="w-4 h-4 text-slate-400" />
                    )}
                    {subject}
                  </button>
                )
              })}
            </div>

            <button 
              onClick={handleNext}
              disabled={selectedSubjects.length === 0}
              className={`w-full py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center ${
                selectedSubjects.length > 0
                  ? 'bg-primary text-white hover:bg-violet-600 shadow-[0_0_30px_rgba(139,92,246,0.3)]'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              Начать
            </button>
          </div>
        )}
      </div>

      {/* Ready Modal */}
      {showReadyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-md p-8 rounded-3xl shadow-2xl relative text-slate-800 animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowReadyModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-bold mb-4">Вы готовы?</h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <p className="text-slate-600 text-sm">
                  <strong className="text-slate-800 font-medium block mb-1">Без читерства</strong>
                  Не списывайте и не используйте сторонние ресурсы. Тест покажет ваши реальные знания.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <p className="text-slate-600 text-sm">
                  <strong className="text-slate-800 font-medium block mb-1">Ограничение времени</strong>
                  На прохождение теста будет выделено ограниченное время. Не отвлекайтесь.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <p className="text-slate-600 text-sm">
                  <strong className="text-slate-800 font-medium block mb-1">Количество вопросов</strong>
                  Вас ждет {Math.max(4, selectedSubjects.length * 2)} вопросов по выбранным предметам.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowReadyModal(false)}
                className="flex-1 py-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Отмена
              </button>
              <button 
                onClick={handleStartTest}
                disabled={isStarting}
                className="flex-1 py-4 rounded-xl font-bold text-white bg-primary hover:bg-violet-600 disabled:opacity-50 transition-colors shadow-[0_0_20px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2"
              >
                {isStarting ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span> : 'Я готов!'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
