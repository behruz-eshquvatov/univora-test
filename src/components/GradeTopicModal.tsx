import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, BookOpen, Layers, Play, Loader2, ChevronRight, ArrowLeft, Zap, Sparkles, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { catalogApi, type Subject, type Grade, type Topic } from '../lib/api/catalog';
import { testengineApi, type AvailableCountsResponse } from '../lib/api/testengine';
import { ProUpgradeModal } from './ProUpgradeModal';
import { useAuthStore } from '../store/useAuthStore';
import { AuthRequiredModal } from './AuthRequiredModal';

interface GradeTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject | null;
  onStartTest: (params: { subjectId: number; gradeId?: number; topicId?: number; count?: number }) => void;
  isLoading?: boolean;
}

export const GradeTopicModal: React.FC<GradeTopicModalProps> = ({
  isOpen,
  onClose,
  subject,
  onStartTest,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const { isGuest } = useAuthStore();
  const [step, setStep] = useState<'grade' | 'topic' | 'count'>('grade');
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const [availableCountsInfo, setAvailableCountsInfo] = useState<AvailableCountsResponse | null>(null);
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [selectedCount, setSelectedCount] = useState<number>(20);

  const [showProModal, setShowProModal] = useState(false);
  const [proModalResetAt, setProModalResetAt] = useState<string | null>(null);
  const [showAuthRequiredModal, setShowAuthRequiredModal] = useState(false);

  useEffect(() => {
    if (isOpen && subject) {
      setStep('grade');
      setSelectedGrade(null);
      setSelectedTopic(null);
      setAvailableCountsInfo(null);
      setLoadingGrades(true);

      catalogApi.getGrades({ subject: subject.id })
        .then((res) => {
          const list = Array.isArray(res) ? res : (res as any).results || [];
          setGrades(list);
          if (list.length === 0) {
            loadTopicsForSubject(subject.id);
          }
        })
        .catch((err) => {
          console.error('Failed to load grades:', err);
          setGrades([]);
          loadTopicsForSubject(subject.id);
        })
        .finally(() => setLoadingGrades(false));
    }
  }, [isOpen, subject]);

  const loadTopicsForSubject = (subjectId: number) => {
    setStep('topic');
    setLoadingTopics(true);
    catalogApi.getTopics({ subject: subjectId, has_test: true })
      .then((res) => {
        const list = Array.isArray(res) ? res : (res as any).results || [];
        setTopics(list);
      })
      .catch(console.error)
      .finally(() => setLoadingTopics(false));
  };

  const handleSelectGrade = (grade: Grade | null) => {
    setSelectedGrade(grade);
    setSelectedTopic(null);
    setStep('topic');
    setLoadingTopics(true);

    const params = grade ? { grade: grade.id, has_test: true } : { subject: subject!.id, has_test: true };
    catalogApi.getTopics(params)
      .then((res) => {
        const list = Array.isArray(res) ? res : (res as any).results || [];
        setTopics(list);
      })
      .catch(console.error)
      .finally(() => setLoadingTopics(false));
  };

  const handleSelectTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    setLoadingCounts(true);
    setStep('count');

    testengineApi.getAvailableCounts(topic.id)
      .then((info) => {
        setAvailableCountsInfo(info);
        if (isGuest) {
          setSelectedCount(20);
        } else if (info.tiers && info.tiers.length > 0) {
          setSelectedCount(info.tiers[0]);
        }
        if (info.access && !info.access.can_start) {
          setProModalResetAt(info.access.reset_at);
          setShowProModal(true);
        }
      })
      .catch((err) => {
        if (err.response?.status === 403) {
          setProModalResetAt(err.response?.data?.reset_at || null);
          setShowProModal(true);
        }
      })
      .finally(() => setLoadingCounts(false));
  };

  const handleStart = () => {
    if (!subject) return;
    onStartTest({
      subjectId: subject.id,
      gradeId: selectedGrade?.id,
      topicId: selectedTopic?.id,
      count: selectedCount,
    });
  };

  if (!isOpen || !subject) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-dark-surface rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-dark-border relative overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-dark-border">
          <div className="flex items-center gap-3">
            {step === 'topic' && grades.length > 0 && (
              <button
                onClick={() => setStep('grade')}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-dark-bg text-slate-600 dark:text-dark-text-muted hover:bg-slate-200 dark:hover:bg-dark-border transition-colors flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            {step === 'count' && (
              <button
                onClick={() => setStep('topic')}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-dark-bg text-slate-600 dark:text-dark-text-muted hover:bg-slate-200 dark:hover:bg-dark-border transition-colors flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-dark-text-main">
                {subject.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-dark-text-muted font-medium mt-0.5">
                {step === 'grade'
                  ? t('tests.select_grade', 'Sinf / Kategoriyani tanlang')
                  : step === 'topic'
                  ? t('tests.select_topic', 'Test uchun mavzuni tanlang')
                  : t('tests.select_count', 'Savollar sonini tanlang')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-dark-bg text-slate-400 hover:text-slate-600 dark:hover:text-dark-text-main transition-colors flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
          {/* STEP 1: GRADE SELECTION */}
          {step === 'grade' && (
            <>
              {loadingGrades ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-violet-500 mb-2" />
                  <p className="text-sm font-medium">{t('tests.loading_categories', 'Kategoriyalar yuklanmoqda...')}</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* Option: All Grades */}
                  <div
                    onClick={() => handleSelectGrade(null)}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-dark-border hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-dark-text-main">
                          {t('tests.all_topics', 'Barcha mavzular')}
                        </h4>
                        <p className="text-xs text-slate-400 dark:text-dark-text-muted">
                          {t('tests.all_topics_desc', 'Butun fan bo\'yicha umumiy test')}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-violet-500 transition-colors" />
                  </div>

                  {/* Specific Grades */}
                  {grades.map((grade) => (
                    <div
                      key={grade.id}
                      onClick={() => handleSelectGrade(grade)}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-dark-border hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-dark-text-main">
                            {grade.name}
                          </h4>
                          {grade.topic_count !== undefined && (
                            <p className="text-xs text-slate-400 dark:text-dark-text-muted">
                              {grade.topic_count} {t('tests.topics_suffix', 'ta mavzu')}
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-violet-500 transition-colors" />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* STEP 2: TOPIC SELECTION */}
          {step === 'topic' && (
            <>
              {loadingTopics ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-violet-500 mb-2" />
                  <p className="text-sm font-medium">{t('tests.loading_topics', 'Mavzular yuklanmoqda...')}</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* Topics List */}
                  {topics.map((topic) => {
                    const isSelected = selectedTopic?.id === topic.id;
                    return (
                      <div
                        key={topic.id}
                        onClick={() => handleSelectTopic(topic)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-violet-500 bg-violet-50/70 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 shadow-sm'
                            : 'border-slate-200 dark:border-dark-border hover:border-slate-300 dark:hover:border-dark-border'
                        }`}
                      >
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-dark-text-main text-sm sm:text-base">
                            {topic.name || topic.title}
                          </h4>
                          {topic.question_count && (
                            <p className="text-xs text-slate-400 dark:text-dark-text-muted mt-0.5">
                              {topic.question_count} {t('tests.questions_suffix', 'ta savol')}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-violet-500 shrink-0" />
                      </div>
                    );
                  })}

                  {topics.length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-sm">
                      {t('tests.no_topics', 'Mavzular topilmadi')}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* STEP 3: QUESTION COUNT SELECTION */}
          {step === 'count' && (
            <>
              {loadingCounts ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-violet-500 mb-2" />
                  <p className="text-sm font-medium">{t('tests.checking_options', 'Mavjud variantlar tekshirilmoqda...')}</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Selected topic info */}
                  {selectedTopic && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-bg border border-slate-100 dark:border-dark-border">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-dark-text-main">
                        {t('tests.selected_topic', 'Mavzu')}: {selectedTopic.name || selectedTopic.title}
                      </h4>
                    </div>
                  )}

                  {/* Daily Topic Limits Indicator */}
                  {availableCountsInfo?.access && (
                    <div className="p-3.5 rounded-2xl bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 flex items-center justify-between text-xs font-bold text-violet-900 dark:text-violet-200">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-violet-600 fill-violet-600" />
                        <span>
                          {availableCountsInfo.access.daily_topic_limit === null
                            ? t('tests.unlimited_pro', 'Mavzularga cheksiz kirish (Pro)')
                            : t('tests.topics_remaining', `Bugun uchun ${availableCountsInfo.access.topics_remaining_today ?? 0} / ${availableCountsInfo.access.daily_topic_limit} ta mavzu qoldi`, { remaining: availableCountsInfo.access.topics_remaining_today ?? 0, total: availableCountsInfo.access.daily_topic_limit })}
                        </span>
                      </div>
                      {availableCountsInfo.access.upgrade_required && (
                        <span className="px-2 py-0.5 bg-amber-400 text-amber-950 rounded-md text-[10px] uppercase font-extrabold flex items-center gap-1">
                          <Sparkles className="w-3 h-3 fill-current" /> Pro
                        </span>
                      )}
                    </div>
                  )}

                  {/* Question count pills */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      {t('tests.questions_count_label', 'Savollar soni')}
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                      {(availableCountsInfo?.tiers || [20, 25, 30, 35, 40, 45, 50, 55, 60]).map((num) => {
                        const isSelected = selectedCount === num;
                        const isLockedForGuest = isGuest && num !== 20;
                        return (
                          <button
                            key={num}
                            onClick={() => {
                              if (isLockedForGuest) {
                                setShowAuthRequiredModal(true);
                                return;
                              }
                              setSelectedCount(num);
                            }}
                            className={`py-3 px-4 rounded-xl border font-extrabold text-sm sm:text-base transition-all flex items-center justify-center gap-1.5 ${
                              isLockedForGuest
                                ? 'border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg/60 text-slate-400 dark:text-dark-text-muted hover:border-violet-300 cursor-pointer'
                                : isSelected
                                  ? 'border-violet-600 bg-violet-600 text-white shadow-md shadow-violet-500/20 scale-[1.02]'
                                  : 'border-slate-200 dark:border-dark-border text-slate-700 dark:text-dark-text-main hover:border-violet-300'
                            }`}
                          >
                            <span>{num}</span>
                            {isLockedForGuest && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-dark-border flex items-center justify-end gap-3 mt-auto">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-dark-text-muted transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleStart}
            disabled={isLoading || (step === 'count' && availableCountsInfo?.access?.can_start === false)}
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-violet-500/25 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 font-medium"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            <span>{t('tests.start_test_btn', t('btn_start', 'Testni boshlash'))} ({selectedCount})</span>
          </button>
        </div>

      </div>

      {/* Pro Upgrade Modal Trigger */}
      <ProUpgradeModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        resetAt={proModalResetAt}
      />

      {/* Auth Required Modal */}
      <AuthRequiredModal
        isOpen={showAuthRequiredModal}
        onClose={() => setShowAuthRequiredModal(false)}
      />
    </div>,
    document.body
  );
};
