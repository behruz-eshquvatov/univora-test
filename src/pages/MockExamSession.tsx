import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { catalogApi, type Subject } from '../lib/api/catalog';
import {
  testengineApi,
  type MockExam,
  type MockExamSubjectItem,
  type SessionQuestion,
} from '../lib/api/testengine';
import { motion } from 'framer-motion';
import {
  Clock,
  Sparkles,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Trophy,
  Download,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLimitStore } from '../store/useLimitStore';

export default function MockExamSession() {
  const { t } = useTranslation();
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  // Setup / Selection state (if creating new mock exam)
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(30);
  const [creating, setCreating] = useState(false);

  // Active Mock Exam State
  const [mockExam, setMockExam] = useState<MockExam | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active Subject Tab & Questions
  const [activeSubjectIdx, setActiveSubjectIdx] = useState<number>(0);
  const [activeQuestions, setActiveQuestions] = useState<SessionQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [currentQuestionOrder, setCurrentQuestionOrder] = useState<number>(1);

  // Answers Map: { [sessionId_order]: selectedOption }
  const [answersMap, setAnswersMap] = useState<Record<string, string>>({});
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  // Seconds Left Timer
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [finishing, setFinishing] = useState(false);
  const [exportingType, setExportingType] = useState<'xlsx' | 'pdf' | null>(null);

  // Load catalog subjects for creation form
  useEffect(() => {
    if (!id || id === 'new') {
      setLoadingSubjects(true);
      catalogApi.getSubjects()
        .then((data) => {
          const list = Array.isArray(data) ? data : (data as any)?.results || [];
          setSubjects(list);
        })
        .catch((err) => console.error('Failed to load subjects for mock exam:', err))
        .finally(() => setLoadingSubjects(false));
    }
  }, [id]);

  // Load active mock exam if ID provided
  useEffect(() => {
    if (id && id !== 'new') {
      fetchMockExam(id);
    }
  }, [id]);

  // Countdown timer
  useEffect(() => {
    if (!mockExam || mockExam.is_finished || secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mockExam?.id, mockExam?.is_finished, secondsLeft]);

  const fetchMockExam = async (examId: string) => {
    setLoading(true);
    setError(null);
    try {
      const exam = await testengineApi.getMockExam(examId);
      setMockExam(exam);
      setSecondsLeft(exam.seconds_left || 0);

      if (exam.subjects.length > 0 && !exam.is_finished) {
        loadSubjectQuestions(exam.subjects[0].session_id);
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Blok imtihoni ma\'lumotlarini yuklab bo\'lmadi');
    } finally {
      setLoading(false);
    }
  };

  const loadSubjectQuestions = async (sessionId: number) => {
    setLoadingQuestions(true);
    try {
      const qList = await testengineApi.getSessionQuestions(sessionId);
      setActiveQuestions(qList);
      setCurrentQuestionOrder(1);

      // Hydrate local answer state
      const initialAnswers: Record<string, string> = {};
      qList.forEach((q) => {
        if (q.my_answer?.selected_option) {
          initialAnswers[`${sessionId}_${q.order}`] = q.my_answer.selected_option;
        }
      });
      setAnswersMap((prev) => ({ ...prev, ...initialAnswers }));
    } catch (err) {
      console.error('Failed to load session questions:', err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleToggleSubject = (subId: number) => {
    if (selectedSubjectIds.includes(subId)) {
      setSelectedSubjectIds(selectedSubjectIds.filter((s) => s !== subId));
    } else {
      if (selectedSubjectIds.length >= 5) {
        useLimitStore.getState().showLimitModal({
          title: t('pro.modal_title', 'Fanlar chegarasi'),
          reason: 'Maksimal 5 ta fan tanlash mumkin.',
        });
        return;
      }
      setSelectedSubjectIds([...selectedSubjectIds, subId]);
    }
  };

  const handleStartNewMockExam = async () => {
    if (selectedSubjectIds.length < 2) {
      useLimitStore.getState().showLimitModal({
        title: t('pro.modal_title', 'Fanlarni tanlang'),
        reason: 'Imtihon topshirish uchun kamida 2 ta fan tanlang.',
      });
      return;
    }
    setCreating(true);
    try {
      const newExam = await testengineApi.createMockExam(selectedSubjectIds, questionCount);
      navigate(`/mock-exam/${newExam.id}`);
    } catch (err: any) {
      const reasonMsg = err?.response?.data?.detail || 'DTM blok imtihoni sizning tarifingizda mavjud emas.';
      useLimitStore.getState().showLimitModal({
        title: t('pro.modal_title', 'Pro tarifiga o\'ting'),
        reason: reasonMsg,
      });
    } finally {
      setCreating(false);
    }
  };

  const handleSwitchSubjectTab = (idx: number, subjectItem: MockExamSubjectItem) => {
    setActiveSubjectIdx(idx);
    loadSubjectQuestions(subjectItem.session_id);
  };

  const handleSelectOption = async (optionKey: string) => {
    if (!mockExam || mockExam.is_finished || !activeSubjectItem) return;

    const sessionId = activeSubjectItem.session_id;
    const orderKey = `${sessionId}_${currentQuestionOrder}`;
    setAnswersMap((prev) => ({ ...prev, [orderKey]: optionKey }));

    setSubmittingAnswer(true);
    try {
      await testengineApi.answerQuestion(sessionId, currentQuestionOrder, optionKey);
    } catch (err) {
      console.error('Failed to answer question:', err);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleFinishExam = async () => {
    if (!mockExam || mockExam.is_finished || finishing) return;
    setFinishing(true);
    try {
      const updatedExam = await testengineApi.finishMockExam(mockExam.id);
      setMockExam(updatedExam);
    } catch (err: any) {
      useLimitStore.getState().showLimitModal({
        title: t('pro.modal_title', 'Imtihon yakunlanmadi'),
        reason: err?.response?.data?.detail || 'Imtihonni yakunlashda xatolik yuz berdi.',
      });
    } finally {
      setFinishing(false);
    }
  };

  const handleExport = async (type: 'xlsx' | 'pdf') => {
    setExportingType(type);
    try {
      const blob = await testengineApi.exportResults(type);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dtm_result_${mockExam?.id || 'export'}.${type}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      useLimitStore.getState().showLimitModal({
        title: t('pro.modal_title', 'Eksport xatosi'),
        reason: err?.response?.data?.detail || 'Faylni yuklab olishda xatolik yuz berdi.',
      });
    } finally {
      setExportingType(null);
    }
  };

  const formatTimer = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const activeSubjectItem = mockExam?.subjects[activeSubjectIdx];
  const activeQuestion = activeQuestions[currentQuestionOrder - 1];
  const activeAnswerKey = activeSubjectItem
    ? answersMap[`${activeSubjectItem.session_id}_${currentQuestionOrder}`] || ''
    : '';

  // 1. Creation Mode (no active exam / creating)
  if (!id || id === 'new') {
    return (
      <div className="min-h-screen bg-transparent text-slate-800 dark:text-dark-text-main p-4 py-8 flex flex-col items-center justify-center relative z-10">
        <div className="w-full max-w-2xl bg-surface backdrop-blur-md p-6 sm:p-8 rounded-[2rem] shadow-2xl border border-white/20 dark:border-dark-border">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/tests')}
              className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-dark-text-main transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Orqaga</span>
            </button>
            <div className="px-3.5 py-1.5 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 text-xs font-bold flex items-center">
              <span>DTM Blok Imtihoni</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-dark-text-main mb-2">
            Blok imtihonini boshlash
          </h1>
          <p className="text-slate-500 dark:text-dark-text-muted text-sm mb-6">
            Imtihon topshirish uchun 2 ta fandan 5 tagacha fan tanlang va savollar sonini belgilang.
          </p>

          {/* Subjects Selection */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 dark:text-dark-text-main mb-3">
              Fanlarni tanlang (kamida 2 ta):
            </label>
            {loadingSubjects ? (
              <div className="py-8 text-center bg-slate-50 dark:bg-dark-bg rounded-2xl border border-slate-200 dark:border-dark-border">
                <Loader2 className="w-6 h-6 animate-spin text-violet-600 mx-auto mb-2" />
                <span className="text-xs text-slate-500 font-bold">Fanlar yuklanmoqda...</span>
              </div>
            ) : subjects.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-sm bg-slate-50 dark:bg-dark-bg rounded-2xl border border-slate-200 dark:border-dark-border font-bold">
                Mavjud fanlar topilmadi
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {subjects.map((sub) => {
                  const isSelected = selectedSubjectIds.includes(sub.id);
                  return (
                    <button
                      key={sub.id}
                      onClick={() => handleToggleSubject(sub.id)}
                      className={`p-3 rounded-2xl border text-left font-bold text-sm transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 shadow-sm'
                          : 'border-slate-200 dark:border-dark-border text-slate-700 dark:text-dark-text-main hover:bg-slate-50 dark:hover:bg-dark-bg'
                      }`}
                    >
                      <span>{sub.name}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-violet-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Question Count Choice */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-slate-700 dark:text-dark-text-main mb-3">
              Savollar soni (har bir fan uchun):
            </label>
            <div className="flex gap-3">
              {[20, 30, 40, 60].map((cnt) => (
                <button
                  key={cnt}
                  onClick={() => setQuestionCount(cnt)}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${
                    questionCount === cnt
                      ? 'border-violet-600 bg-violet-600 text-white shadow-md'
                      : 'border-slate-200 dark:border-dark-border text-slate-700 dark:text-dark-text-main hover:bg-slate-50 dark:hover:bg-dark-bg'
                  }`}
                >
                  {cnt} ta
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStartNewMockExam}
            disabled={selectedSubjectIds.length < 2 || creating}
            className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 shadow-lg shadow-violet-500/25 transition-all text-base flex items-center justify-center gap-2"
          >
            {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Imtihonni boshlash</span>}
          </button>
        </div>
      </div>
    );
  }

  // 2. Loading / Error state
  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-4 relative z-10">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-violet-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-dark-text-muted font-bold">Imtihon yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error || !mockExam) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-4 relative z-10">
        <div className="bg-surface backdrop-blur-md p-8 rounded-[2rem] max-w-md w-full border border-white/20 dark:border-dark-border text-center shadow-2xl">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 dark:text-dark-text-main mb-2">
            Imtihon topilmadi
          </h3>
          <p className="text-slate-500 dark:text-dark-text-muted text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate('/tests')}
            className="w-full py-3 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-colors"
          >
            Testlar sahifasiga qaytish
          </button>
        </div>
      </div>
    );
  }

  // 3. Finished Summary Screen
  if (mockExam.is_finished) {
    return (
      <div className="min-h-screen bg-transparent text-slate-800 dark:text-dark-text-main p-4 py-8 flex items-center justify-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-surface backdrop-blur-md rounded-[2rem] p-6 sm:p-8 shadow-2xl border border-white/20 dark:border-dark-border max-w-2xl w-full text-center"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-dark-text-main mb-2">
            Blok Imtihon Natijasi
          </h2>
          <p className="text-slate-500 dark:text-dark-text-muted text-sm mb-6">
            Imtihon muvaffaqiyatli yakunlandi! Natijalaringiz bilan tanishing:
          </p>

          {/* Overall summary stats */}
          <div className="bg-slate-50 dark:bg-dark-bg rounded-2xl p-5 mb-6 flex items-center justify-around border border-slate-100 dark:border-dark-border">
            <div>
              <span className="text-3xl font-black text-violet-600 dark:text-violet-400">
                {mockExam.summary.total_score} ball
              </span>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                Umumiy ball
              </p>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-dark-border"></div>
            <div>
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {mockExam.summary.accuracy_percent}%
              </span>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Aniqlik</p>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-dark-border"></div>
            <div>
              <span className="text-3xl font-black text-slate-700 dark:text-dark-text-main">
                {mockExam.summary.correct_count} / {mockExam.summary.total_questions}
              </span>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                To'g'ri javoblar
              </p>
            </div>
          </div>

          {/* Breakdown per subject */}
          <div className="space-y-3 mb-8 text-left">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Fanlar bo'yicha ajratma:
            </h4>
            {mockExam.subjects.map((sub, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border flex items-center justify-between"
              >
                <div>
                  <h5 className="font-bold text-sm text-slate-800 dark:text-dark-text-main">
                    {sub.subject.name}
                  </h5>
                  <p className="text-xs text-slate-500 dark:text-dark-text-muted mt-0.5">
                    {sub.correct_count} ta to'g'ri, {sub.incorrect_count} ta xato, {sub.unanswered_count} ta belgilanmagan
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-base text-violet-600 dark:text-violet-400">
                    {sub.total_score} ball
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Download & Navigation Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleExport('xlsx')}
              disabled={exportingType !== null}
              className="flex-1 py-3.5 px-4 rounded-2xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
            >
              {exportingType === 'xlsx' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Excel yuklab olish</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleExport('pdf')}
              disabled={exportingType !== null}
              className="flex-1 py-3.5 px-4 rounded-2xl font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all text-sm flex items-center justify-center gap-2 shadow-md shadow-rose-500/20"
            >
              {exportingType === 'pdf' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>PDF yuklab olish</span>
                </>
              )}
            </button>

            <button
              onClick={() => navigate('/tests')}
              className="py-3.5 px-6 rounded-2xl font-bold text-slate-700 dark:text-dark-text-main bg-slate-100 dark:bg-dark-bg hover:bg-slate-200 dark:hover:bg-dark-border transition-colors text-sm"
            >
              Testlarga qaytish
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // 4. Live Exam Screen
  return (
    <div className="min-h-screen bg-transparent text-slate-800 dark:text-dark-text-main p-4 py-6 flex flex-col items-center relative z-10">
      <div className="w-full max-w-4xl flex flex-col gap-4">
        {/* Top Bar: Timer, Subject Tabs, Finish Button */}
        <div className="bg-surface backdrop-blur-md p-4 sm:p-5 rounded-[2rem] shadow-xl border border-white/20 dark:border-dark-border flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Live Timer */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900 text-violet-700 dark:text-violet-300 font-black text-lg">
            <Clock className="w-5 h-5 text-violet-600 animate-pulse" />
            <span>{formatTimer(secondsLeft)}</span>
          </div>

          {/* Subject Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {mockExam.subjects.map((sub, idx) => {
              const isActive = activeSubjectIdx === idx;
              return (
                <button
                  key={sub.session_id}
                  onClick={() => handleSwitchSubjectTab(idx, sub)}
                  className={`px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm transition-all ${
                    isActive
                      ? 'bg-violet-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-dark-bg text-slate-600 dark:text-dark-text-muted hover:bg-slate-200'
                  }`}
                >
                  {sub.subject.name}
                </button>
              );
            })}
          </div>

          {/* Finish Exam Button */}
          <button
            onClick={handleFinishExam}
            disabled={finishing}
            className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-rose-500/20"
          >
            {finishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Yakunlash</span>}
          </button>
        </div>

        {/* Question Area */}
        <div className="bg-surface backdrop-blur-md rounded-[2rem] p-6 sm:p-8 shadow-2xl border border-white/20 dark:border-dark-border">
          {loadingQuestions ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 text-violet-600 animate-spin mx-auto mb-2" />
              <p className="text-slate-500 font-bold text-sm">Savollar yuklanmoqda...</p>
            </div>
          ) : activeQuestion ? (
            <>
              {/* Question Header & Order Navigator */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-400">
                  <span>
                    Savol {currentQuestionOrder} / {activeQuestions.length} ({activeSubjectItem?.subject.name})
                  </span>
                  <span>DTM Standart</span>
                </div>

                {/* Order Quick Selector Dots */}
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pb-2">
                  {activeQuestions.map((q) => {
                    const isCurrent = q.order === currentQuestionOrder;
                    const isAns = !!answersMap[`${activeSubjectItem?.session_id}_${q.order}`];
                    return (
                      <button
                        key={q.order}
                        onClick={() => setCurrentQuestionOrder(q.order)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                          isCurrent
                            ? 'bg-violet-600 text-white ring-2 ring-violet-400'
                            : isAns
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-100 dark:bg-dark-bg text-slate-500'
                        }`}
                      >
                        {q.order}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question Image if present */}
              {activeQuestion.question.has_image && activeQuestion.question.image && (
                <div className="mb-5 rounded-2xl overflow-hidden max-h-60 bg-slate-100 dark:bg-dark-bg flex items-center justify-center">
                  <img
                    src={activeQuestion.question.image}
                    alt="Question visual"
                    className="max-h-60 object-contain"
                  />
                </div>
              )}

              {/* Question Text */}
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-dark-text-main mb-6 leading-relaxed">
                {activeQuestion.question.text}
              </h2>

              {/* Options List */}
              <div className="space-y-3 mb-8">
                {Object.entries(activeQuestion.question.options || {}).map(([key, val]) => {
                  const isSelected = activeAnswerKey === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleSelectOption(key)}
                      disabled={submittingAnswer}
                      className={`w-full p-4 rounded-2xl border text-left font-semibold text-sm transition-all flex items-center gap-3 ${
                        isSelected
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 shadow-sm'
                          : 'border-slate-200 dark:border-dark-border text-slate-700 dark:text-dark-text-main hover:bg-slate-50 dark:hover:bg-dark-bg'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                          isSelected
                            ? 'bg-violet-600 text-white'
                            : 'bg-slate-100 dark:bg-dark-bg text-slate-500'
                        }`}
                      >
                        {key}
                      </div>
                      <span className="flex-1">{val}</span>
                    </button>
                  );
                })}
              </div>

              {/* Next / Prev Navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-dark-border">
                <button
                  onClick={() => setCurrentQuestionOrder((p) => Math.max(1, p - 1))}
                  disabled={currentQuestionOrder === 1}
                  className="py-2.5 px-5 rounded-xl font-bold text-slate-500 disabled:opacity-40 text-sm"
                >
                  Orqaga
                </button>

                <button
                  onClick={() =>
                    setCurrentQuestionOrder((p) => Math.min(activeQuestions.length, p + 1))
                  }
                  disabled={currentQuestionOrder === activeQuestions.length}
                  className="py-2.5 px-6 rounded-xl font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-sm"
                >
                  Keyingisi
                </button>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-400">Savollar mavjud emas</div>
          )}
        </div>
      </div>
    </div>
  );
}
