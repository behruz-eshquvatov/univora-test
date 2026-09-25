import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizStore } from '../store/useQuizStore';
import { useAuthStore } from '../store/useAuthStore';
import { ChevronLeft, Plus, Check, AlertCircle, Clock, X, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const FACULTY_SUBJECTS: Record<string, string[]> = {
  'IT и Инженерия': ['Математика', 'Физика', 'Информатика', 'Английский', 'Логика'],
  'Медицина': ['Биология', 'Химия', 'Русский язык', 'Математика', 'Физика'],
  'Юриспруденция': ['История', 'Обществознание', 'Русский язык', 'Иностранный язык', 'Математика'],
  'Экономика': ['Математика', 'Обществознание', 'Русский язык', 'Иностранный язык', 'Информатика'],
  'Педагогика': ['Русский язык', 'Обществознание', 'Биология', 'Литература', 'Математика'],
  'Международные отношения': ['Иностранный язык', 'История', 'Обществознание', 'Русский язык', 'География'],
  'Филология': ['Русский язык', 'Литература', 'Иностранный язык', 'История', 'Обществознание'],
  'Архитектура': ['Математика', 'Физика', 'Черчение', 'Русский язык', 'Обществознание'],
  'Бизнес управление': ['Математика', 'Обществознание', 'Иностранный язык', 'Русский язык', 'История']
};

const DIRECTIONS = Object.keys(FACULTY_SUBJECTS);

export default function Onboarding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { direction, setDirection, selectedSubjects, toggleSubject } = useQuizStore();
  const { loginAsGuest } = useAuthStore();
  const [step, setStep] = useState(1);
  const [showReadyModal, setShowReadyModal] = useState(false);

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

  const handleStartTest = () => {
    navigate('/onboarding-quiz');
  };

  const availableSubjects = direction ? FACULTY_SUBJECTS[direction] || [] : [];

  const handleSkip = () => {
    if (step === 1) {
      // First skip: Select first direction if none selected, then move to step 2
      if (!direction) {
        setDirection(DIRECTIONS[0]);
      }
      setStep(2);
    } else if (step === 2) {
      // Second skip: Select default subjects if none selected, then open ready popup modal
      if (selectedSubjects.length === 0) {
        const subs = (direction ? FACULTY_SUBJECTS[direction] : null) || FACULTY_SUBJECTS[DIRECTIONS[0]];
        subs.forEach(s => toggleSubject(s));
      }
      setShowReadyModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4 py-8 sm:py-12 relative z-10">
      
      {/* Skip Button (Outside white container in top right side) */}
      <div className="w-full max-w-3xl flex justify-end mb-3">
        <button
          onClick={handleSkip}
          className="text-xs sm:text-sm font-extrabold uppercase text-slate-700 hover:text-slate-900 bg-white/80 hover:bg-white backdrop-blur-md px-5 py-2.5 rounded-2xl transition-all shadow-md border border-white/60 active:scale-95 tracking-wider"
        >
          {t('common.skip', 'O\'tkazib yuborish')}
        </button>
      </div>

      <div className="w-full max-w-3xl bg-surface p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/20 text-slate-800">
        
        {/* Header: Back Btn & Progress Dots */}
        <div className="flex justify-between items-center pb-6 mb-8 border-b border-slate-200 -mx-6 sm:-mx-8 px-6 sm:px-8">
          <button 
            onClick={handleBack} 
            className="text-slate-400 hover:text-slate-600 transition-colors p-2 -ml-2 rounded-full hover:bg-slate-100 flex items-center justify-center"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-1.5">
            <div className={`h-2 rounded-full transition-all ${step === 1 ? 'w-6 bg-primary' : step > 1 ? 'w-2 bg-primary' : 'w-2 bg-slate-200'}`}></div>
            <div className={`h-2 rounded-full transition-all ${step === 2 ? 'w-6 bg-primary' : step > 2 ? 'w-2 bg-primary' : 'w-2 bg-slate-200'}`}></div>
          </div>
        </div>

        {/* Step 1: Faculty */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-slate-800">{t('onboarding.step1_title')}</h2>
            
            <div className="flex flex-wrap gap-2 sm:gap-2.5 mb-10">
              {DIRECTIONS.map(dir => {
                const isSelected = direction === dir;
                return (
                  <button
                    key={dir}
                    onClick={() => setDirection(dir)}
                    className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full border transition-all text-xs sm:text-sm font-semibold ${
                      isSelected 
                      ? 'border-primary bg-primary/10 text-primary shadow-sm' 
                      : 'border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {dir}
                  </button>
                )
              })}
            </div>
            
            <button 
              onClick={handleNext}
              disabled={!direction}
              className={`w-full py-3.5 rounded-xl font-bold text-base transition-all flex items-center justify-center ${
                direction
                  ? 'bg-primary text-white hover:bg-violet-600 shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {t('onboarding.btn_continue')}
            </button>
          </div>
        )}

        {/* Step 2: Subjects */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl sm:text-4xl font-bold mb-2 text-slate-800">{t('onboarding.step2_title')}</h2>
            <p className="text-slate-500 mb-8">{t('onboarding.step2_subtitle')}</p>

            <div className="flex flex-wrap gap-2 sm:gap-2.5 mb-10">
              {availableSubjects.map(sub => {
                const isSelected = selectedSubjects.includes(sub);
                
                return (
                  <button 
                    key={sub}
                    onClick={() => toggleSubject(sub)}
                    className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full border transition-all flex items-center gap-1.5 text-xs sm:text-sm font-semibold ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary shadow-sm' 
                        : 'border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <Plus className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    {sub}
                  </button>
                )
              })}
            </div>

            <button 
              onClick={handleNext}
              disabled={selectedSubjects.length === 0}
              className={`w-full py-3.5 rounded-xl font-bold text-base transition-all flex items-center justify-center ${
                selectedSubjects.length > 0
                  ? 'bg-primary text-white hover:bg-violet-600 shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {t('onboarding.btn_finish')}
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

            <h3 className="text-2xl font-bold mb-4 text-slate-800">{t('onboarding.modal_title')}</h3>
            <p className="text-slate-500 mb-6 leading-relaxed">
              {t('onboarding.modal_desc')}
              <span className="font-bold text-slate-700 block mt-2">
                {selectedSubjects.join(', ')}
              </span>
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <p className="text-slate-600 text-sm">
                  <strong className="text-slate-800 font-medium block mb-1">{t('onboarding.modal_no_reg_title')}</strong>
                  {t('onboarding.modal_no_reg_desc')}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <p className="text-slate-600 text-sm">
                  <strong className="text-slate-800 font-medium block mb-1">{t('onboarding.modal_time_title')}</strong>
                  {t('onboarding.modal_time_desc')}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <p className="text-slate-600 text-sm">
                  <strong className="text-slate-800 font-medium block mb-1">{t('onboarding.modal_real_title')}</strong>
                  {t('onboarding.modal_real_desc')}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  loginAsGuest();
                  setShowReadyModal(false);
                  navigate('/dashboard');
                }}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                {t('common.skip', 'O\'tkazib yuborish')}
              </button>
              <button 
                onClick={handleStartTest}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-primary hover:bg-violet-600 transition-colors shadow-[0_0_15px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2"
              >
                {t('onboarding.btn_ready')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
