import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, XCircle, Plus, Edit2, Trash2,
  ChevronRight, Home, FolderOpen, ArrowLeft, Loader2
} from 'lucide-react';
import { catalogApi } from '../../lib/api/catalog';
import type { Subject, Grade, Topic, Question } from '../../lib/api/catalog';
import ConfirmDialog from './ConfirmDialog';
import { INPUT, BTN_PRIMARY } from './constants';

/** Flattens DRF error response into a readable string.
 *  Handles: string, string[], { field: string[] }, { field: string } */
function parseApiError(err: any): string {
  const data = err?.response?.data;
  if (!data) return 'Неизвестная ошибка';
  if (typeof data === 'string') return data;
  const messages: string[] = [];
  for (const [field, value] of Object.entries(data)) {
    const label = field === 'detail' || field === 'non_field_errors' ? '' : `${field}: `;
    if (Array.isArray(value)) messages.push(label + value.join(', '));
    else if (typeof value === 'string') messages.push(label + value);
    else messages.push(label + JSON.stringify(value));
  }
  return messages.join(' | ') || 'Ошибка';
}

type CatalogView = 'subjects' | 'grades' | 'topics' | 'questions';

interface DeleteTarget {
  type: 'subject' | 'grade' | 'topic' | 'question';
  id: number;
  name: string;
  warning?: string;
}

interface QuestionFormData {
  text: string;
  text_ru: string;
  text_en: string;
  difficulty: number;
  options: { A: string; B: string; C: string; D: string };
  options_ru: { A: string; B: string; C: string; D: string };
  options_en: { A: string; B: string; C: string; D: string };
  correct_option: string;
  explanation: string;
  image: File | null;
  existing_image_url?: string | null;
  image_caption: string;
}

export default function CatalogSection() {
  const [view, setView] = useState<CatalogView>('subjects');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  // Subject form
  const [subjectModal, setSubjectModal] = useState(false);
  const [subjectForm, setSubjectForm] = useState({ name: '', name_ru: '', name_en: '', description: '' });
  const [editSubjectId, setEditSubjectId] = useState<number | null>(null);
  const [subjectFormError, setSubjectFormError] = useState<string | null>(null);

  // Grade form
  const [gradeModal, setGradeModal] = useState(false);
  const [gradeForm, setGradeForm] = useState({ name: '', name_ru: '', name_en: '', order: 0 });
  const [editGradeId, setEditGradeId] = useState<number | null>(null);
  const [gradeFormError, setGradeFormError] = useState<string | null>(null);

  // Topic form
  const [topicModal, setTopicModal] = useState(false);
  const [topicForm, setTopicForm] = useState<{ name: string; name_ru: string; name_en: string; grade: number | '' }>({ name: '', name_ru: '', name_en: '', grade: '' });
  const [editTopicId, setEditTopicId] = useState<number | null>(null);
  const [topicFormError, setTopicFormError] = useState<string | null>(null);

  // Question form
  const [questionModal, setQuestionModal] = useState(false);
  const [questionLangTab, setQuestionLangTab] = useState<'uz' | 'ru' | 'en'>('uz');
  const [questionForm, setQuestionForm] = useState<QuestionFormData>({
    text: '', text_ru: '', text_en: '', difficulty: 1,
    options: { A: '', B: '', C: '', D: '' },
    options_ru: { A: '', B: '', C: '', D: '' },
    options_en: { A: '', B: '', C: '', D: '' },
    correct_option: 'A',
    explanation: '',
    image: null,
    existing_image_url: null,
    image_caption: '',
  });
  const [editQuestionId, setEditQuestionId] = useState<number | null>(null);
  const [questionFormError, setQuestionFormError] = useState<string | null>(null);

  const loadSubjects = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await catalogApi.getSubjects();
      setSubjects(Array.isArray(data) ? data : (data as any).results ?? []);
    } catch { setError('Не удалось загрузить предметы'); }
    finally { setLoading(false); }
  }, []);

  const loadGrades = useCallback(async (subjectId: number) => {
    setLoading(true); setError(null);
    try {
      const data = await catalogApi.getGrades({ subject: subjectId });
      setGrades(Array.isArray(data) ? data : (data as any).results ?? []);
    } catch { setError('Не удалось загрузить классы/разделы'); }
    finally { setLoading(false); }
  }, []);

  const loadTopics = useCallback(async (gradeId: number) => {
    setLoading(true); setError(null);
    try {
      const data = await catalogApi.getTopics({ grade: gradeId });
      setTopics(Array.isArray(data) ? data : (data as any).results ?? []);
    } catch { setError('Не удалось загрузить темы'); }
    finally { setLoading(false); }
  }, []);

  const loadQuestions = useCallback(async (topicId: number) => {
    setLoading(true); setError(null);
    try {
      const data = await catalogApi.getQuestions(topicId);
      setQuestions(Array.isArray(data) ? data : (data as any).results ?? []);
    } catch { setError('Не удалось загрузить вопросы'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadSubjects(); }, [loadSubjects]);

  const openSubject = (subject: Subject) => { setSelectedSubject(subject); setSelectedGrade(null); setSelectedTopic(null); setView('grades'); loadGrades(subject.id); };
  const openGrade = (grade: Grade) => { setSelectedGrade(grade); setSelectedTopic(null); setView('topics'); loadTopics(grade.id); };
  const openTopic = (topic: Topic) => { setSelectedTopic(topic); setView('questions'); loadQuestions(topic.id); };

  const goBack = () => {
    if (view === 'questions') { setView('topics'); setSelectedTopic(null); setQuestions([]); }
    else if (view === 'topics') { setView('grades'); setSelectedGrade(null); setTopics([]); }
    else if (view === 'grades') { setView('subjects'); setSelectedSubject(null); setGrades([]); }
  };

  // Subject CRUD
  const openCreateSubject = () => { setSubjectForm({ name: '', name_ru: '', name_en: '', description: '' }); setEditSubjectId(null); setSubjectFormError(null); setSubjectModal(true); };
  const openEditSubject = (s: Subject, e: React.MouseEvent) => {
    e.stopPropagation();
    setSubjectForm({ name: s.name, name_ru: s.translations?.ru || '', name_en: s.translations?.en || '', description: (s as any).description || '' });
    setEditSubjectId(s.id); setSubjectFormError(null); setSubjectModal(true);
  };
  const saveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubjectFormError(null);
    setIsSaving(true);
    try {
      if (editSubjectId) {
        const updated = await catalogApi.updateSubject(editSubjectId, subjectForm);
        setSubjects(prev => prev.map(s => s.id === editSubjectId ? updated : s));
      } else {
        const created = await catalogApi.createSubject(subjectForm);
        setSubjects(prev => [...prev, created]);
      }
      setSubjectModal(false);
    } catch (err: any) {
      setSubjectFormError(parseApiError(err));
    } finally {
      setIsSaving(false);
    }
  };

  // Grade CRUD
  const openCreateGrade = () => {
    setGradeForm({ name: '', name_ru: '', name_en: '', order: (grades.length + 1) * 10 });
    setEditGradeId(null);
    setGradeFormError(null);
    setGradeModal(true);
  };
  const openEditGrade = (g: Grade, e: React.MouseEvent) => {
    e.stopPropagation();
    setGradeForm({
      name: g.name,
      name_ru: g.translations?.ru || g.name_ru || '',
      name_en: g.translations?.en || g.name_en || '',
      order: g.order || 0
    });
    setEditGradeId(g.id);
    setGradeFormError(null);
    setGradeModal(true);
  };
  const saveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;
    setGradeFormError(null);
    setIsSaving(true);
    try {
      if (editGradeId) {
        const updated = await catalogApi.updateGrade(editGradeId, gradeForm);
        setGrades(prev => prev.map(g => g.id === editGradeId ? updated : g));
      } else {
        const created = await catalogApi.createGrade({ ...gradeForm, subject: selectedSubject.id });
        setGrades(prev => [...prev, created]);
      }
      setGradeModal(false);
    } catch (err: any) {
      setGradeFormError(parseApiError(err));
    } finally {
      setIsSaving(false);
    }
  };

  // Topic CRUD
  const openCreateTopic = () => { 
    setTopicForm({ name: '', name_ru: '', name_en: '', grade: selectedGrade?.id || grades[0]?.id || '' }); 
    setEditTopicId(null); 
    setTopicFormError(null); 
    setTopicModal(true); 
  };
  const openEditTopic = (t: Topic, e: React.MouseEvent) => {
    e.stopPropagation();
    setTopicForm({ 
      name: (t as any).name || (t as any).title || '', 
      name_ru: t.translations?.ru || '', 
      name_en: t.translations?.en || '',
      grade: t.grade || selectedGrade?.id || grades[0]?.id || ''
    });
    setEditTopicId(t.id); setTopicFormError(null); setTopicModal(true);
  };
  const saveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;
    const gradeId = topicForm.grade || selectedGrade?.id;
    if (!gradeId) {
      setTopicFormError('Выберите класс/классность (Grade)');
      return;
    }
    setTopicFormError(null);
    setIsSaving(true);
    try {
      if (editTopicId) {
        const updated = await catalogApi.updateTopic(editTopicId, { ...topicForm, grade: gradeId as number });
        setTopics(prev => prev.map(t => t.id === editTopicId ? updated : t));
      } else {
        const created = await catalogApi.createTopic({ ...topicForm, grade: gradeId as number, subject: selectedSubject.id });
        setTopics(prev => [...prev, created]);
      }
      setTopicModal(false);
    } catch (err: any) {
      setTopicFormError(parseApiError(err));
    } finally {
      setIsSaving(false);
    }
  };

  // Question CRUD
  const openCreateQuestion = () => {
    setQuestionLangTab('uz');
    setQuestionForm({ 
      text: '', text_ru: '', text_en: '', difficulty: 1, 
      options: { A: '', B: '', C: '', D: '' }, 
      options_ru: { A: '', B: '', C: '', D: '' }, 
      options_en: { A: '', B: '', C: '', D: '' }, 
      correct_option: 'A', explanation: '',
      image: null, existing_image_url: null, image_caption: ''
    });
    setEditQuestionId(null); setQuestionFormError(null); setQuestionModal(true);
  };
  const openEditQuestion = (q: Question, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuestionLangTab('uz');
    setQuestionForm({
      text: q.text, text_ru: (q as any).text_ru || '', text_en: (q as any).text_en || '',
      difficulty: q.difficulty || 1,
      options: q.options as any || { A: '', B: '', C: '', D: '' },
      options_ru: (q as any).options_ru as any || { A: '', B: '', C: '', D: '' },
      options_en: (q as any).options_en as any || { A: '', B: '', C: '', D: '' },
      correct_option: (q as any).correct_option || 'A',
      explanation: q.explanation || '',
      image: null,
      existing_image_url: (q as any).image_url || (q as any).image || null,
      image_caption: (q as any).image_caption || '',
    });
    setEditQuestionId(q.id); setQuestionFormError(null); setQuestionModal(true);
  };
  const saveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopic) return;
    setQuestionFormError(null);
    setIsSaving(true);
    const payload: any = {
      text: questionForm.text, text_ru: questionForm.text_ru, text_en: questionForm.text_en,
      difficulty: questionForm.difficulty,
      options: Object.fromEntries(Object.entries(questionForm.options).filter(([, v]) => v.trim())),
      options_ru: Object.fromEntries(Object.entries(questionForm.options_ru).filter(([, v]) => v.trim())),
      options_en: Object.fromEntries(Object.entries(questionForm.options_en).filter(([, v]) => v.trim())),
      correct_option: questionForm.correct_option,
      explanation: questionForm.explanation,
      image_caption: questionForm.image_caption,
      topic: selectedTopic.id,
    };

    let dataToSend: any = payload;
    if (questionForm.image) {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value && typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
      formData.append('image', questionForm.image);
      dataToSend = formData;
    }

    try {
      if (editQuestionId) {
        const updated = await catalogApi.updateQuestion(editQuestionId, dataToSend);
        setQuestions(prev => prev.map(q => q.id === editQuestionId ? updated : q));
      } else {
        const created = await catalogApi.createQuestion(payload);
        setQuestions(prev => [...prev, created]);
      }
      setQuestionModal(false);
    } catch (err: any) {
      setQuestionFormError(parseApiError(err));
    } finally {
      setIsSaving(false);
    }
  };

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Clear selections when switching views or loading
  useEffect(() => {
    setSelectedIds([]);
  }, [view, selectedSubject, selectedTopic]);

  const toggleSelectAll = () => {
    let currentItems: number[] = [];
    if (view === 'subjects') currentItems = subjects.map(s => s.id);
    else if (view === 'topics') currentItems = topics.map(t => t.id);
    else if (view === 'questions') currentItems = questions.map(q => q.id);

    if (selectedIds.length === currentItems.length && currentItems.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentItems);
    }
  };

  const toggleSelectItem = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    const typeName = view === 'subjects' ? 'предметов' : view === 'topics' ? 'тем' : 'вопросов';
    setDeleteTarget({
      type: 'bulk' as any,
      id: 0,
      name: `${selectedIds.length} ${typeName}`,
      warning: `Вы уверены, что хотите удалить выбранные элементы (${selectedIds.length} шт.)?`
    });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setError(null);
    try {
      if ((deleteTarget.type as string) === 'bulk') {
        setIsBulkDeleting(true);
        const idsToDelete = [...selectedIds];
        if (view === 'subjects') {
          for (const id of idsToDelete) {
            await catalogApi.deleteSubject(id);
          }
          setSubjects(prev => prev.filter(s => !idsToDelete.includes(s.id)));
        } else if (view === 'grades') {
          for (const id of idsToDelete) {
            await catalogApi.deleteGrade(id);
          }
          setGrades(prev => prev.filter(g => !idsToDelete.includes(g.id)));
        } else if (view === 'topics') {
          for (const id of idsToDelete) {
            await catalogApi.deleteTopic(id);
          }
          setTopics(prev => prev.filter(t => !idsToDelete.includes(t.id)));
        } else if (view === 'questions') {
          for (const id of idsToDelete) {
            await catalogApi.deleteQuestion(id);
          }
          setQuestions(prev => prev.filter(q => !idsToDelete.includes(q.id)));
        }
        setSelectedIds([]);
      } else if (deleteTarget.type === 'subject') {
        await catalogApi.deleteSubject(deleteTarget.id);
        setSubjects(prev => prev.filter(s => s.id !== deleteTarget.id));
      } else if (deleteTarget.type === 'grade') {
        await catalogApi.deleteGrade(deleteTarget.id);
        setGrades(prev => prev.filter(g => g.id !== deleteTarget.id));
      } else if (deleteTarget.type === 'topic') {
        await catalogApi.deleteTopic(deleteTarget.id);
        setTopics(prev => prev.filter(t => t.id !== deleteTarget.id));
      } else {
        await catalogApi.deleteQuestion(deleteTarget.id);
        setQuestions(prev => prev.filter(q => q.id !== deleteTarget.id));
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Не удалось удалить');
    } finally {
      setIsBulkDeleting(false);
      setDeleteTarget(null);
    }
  };

  const topicName = (t: Topic) => (t as any).name || (t as any).title || '—';

  const Breadcrumb = () => (
    <nav className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 flex-wrap">
      <button onClick={() => { setView('subjects'); setSelectedSubject(null); setSelectedGrade(null); setSelectedTopic(null); }} className="hover:text-violet-600 transition-colors flex items-center gap-1 text-slate-500 hover:bg-slate-100 px-2 py-1 rounded-lg">
        <Home className="w-4 h-4 text-violet-500" /> <span>Предметы</span>
      </button>
      {selectedSubject && (
        <>
          <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
          <button onClick={() => { setView('grades'); setSelectedGrade(null); setSelectedTopic(null); loadGrades(selectedSubject.id); }} className="hover:text-violet-600 transition-colors text-slate-700 hover:bg-slate-100 px-2 py-1 rounded-lg truncate max-w-[160px] sm:max-w-none">{selectedSubject.name}</button>
        </>
      )}
      {selectedGrade && (
        <>
          <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
          <button onClick={() => { setView('topics'); setSelectedTopic(null); loadTopics(selectedGrade.id); }} className="hover:text-violet-600 transition-colors text-slate-700 hover:bg-slate-100 px-2 py-1 rounded-lg truncate max-w-[160px] sm:max-w-none">{selectedGrade.name}</button>
        </>
      )}
      {selectedTopic && (
        <>
          <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
          <span className="text-slate-900 font-bold bg-violet-50 text-violet-700 px-2.5 py-1 rounded-lg truncate max-w-[180px] sm:max-w-none border border-violet-100">{topicName(selectedTopic)}</span>
        </>
      )}
    </nav>
  );

  const getCurrentItemsCount = () => {
    if (view === 'subjects') return subjects.length;
    if (view === 'grades') return grades.length;
    if (view === 'topics') return topics.length;
    return questions.length;
  };

  const isAllSelected = getCurrentItemsCount() > 0 && selectedIds.length === getCurrentItemsCount();

  return (
    <div className="space-y-6">
      {/* Top Toolbar & Breadcrumb Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
        <div className="flex items-center gap-2 min-w-0">
          {view !== 'subjects' && (
            <button 
              onClick={goBack} 
              className="p-2 rounded-xl bg-slate-100 hover:bg-violet-50 text-slate-600 hover:text-violet-600 transition-all border border-slate-200 shrink-0 shadow-xs"
              title="Назад"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <Breadcrumb />
        </div>

        {/* Action controls right side */}
        <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 flex-wrap">
          {getCurrentItemsCount() > 0 && (
            <button
              onClick={toggleSelectAll}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all select-none shadow-xs ${
                isAllSelected
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={() => {}} // Controlled via parent button onClick
                className="w-4 h-4 rounded text-violet-600 focus:ring-0 border-slate-300 pointer-events-none"
              />
              <span>Выбрать все ({getCurrentItemsCount()})</span>
            </button>
          )}

          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white rounded-xl font-bold text-xs shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Удалить выбранные ({selectedIds.length})</span>
            </button>
          )}

          {view === 'questions' && (
            <button
              onClick={openCreateQuestion}
              className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white rounded-xl font-bold text-xs shadow-sm hover:shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить вопрос</span>
            </button>
          )}
        </div>
      </div>

      {error && <div className="px-4 py-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm font-medium rounded-xl">{error}</div>}

      {loading && (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <div className="w-8 h-8 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin mr-3" />
          <span className="font-semibold text-slate-500">Загрузка данных...</span>
        </div>
      )}

      {/* SUBJECTS GRID */}
      {!loading && view === 'subjects' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map(s => {
            const isSelected = selectedIds.includes(s.id);
            return (
              <div
                key={s.id}
                onClick={() => openSubject(s)}
                className={`group relative bg-white border rounded-2xl p-5 cursor-pointer hover:shadow-md transition-all flex items-start gap-4 ${
                  isSelected 
                    ? 'border-violet-500 bg-violet-50/20 ring-2 ring-violet-500/20 shadow-sm' 
                    : 'border-slate-200/90 hover:border-violet-300 hover:bg-slate-50/50'
                }`}
              >
                {/* Select Checkbox */}
                <div onClick={e => e.stopPropagation()} className="pt-0.5">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectItem(s.id)}
                    className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 border-slate-300 cursor-pointer accent-violet-600"
                  />
                </div>
                
                {/* Subject Icon */}
                <div className="w-11 h-11 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0 group-hover:bg-violet-600 group-hover:text-white transition-all text-violet-600 shadow-xs">
                  <FolderOpen className="w-5 h-5 transition-colors" />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 group-hover:text-violet-900 transition-colors truncate">{s.name}</p>
                  <p className="text-xs font-semibold text-slate-400 mt-1">
                    {(s as any).grade_count != null ? `${(s as any).grade_count} классов/разделов` : 'Разделы не указаны'}
                  </p>
                </div>

                {/* Edit & Delete hover actions */}
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={e => openEditSubject(s, e)} 
                    className="p-1.5 hover:bg-violet-100 rounded-lg text-slate-400 hover:text-violet-700 transition-colors"
                    title="Редактировать"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={e => { e.stopPropagation(); setDeleteTarget({ type: 'subject', id: s.id, name: s.name, warning: 'Все классы, темы и вопросы внутри будут удалены.' }); }} 
                    className="p-1.5 hover:bg-rose-100 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Create Subject Card Button */}
          <button
            onClick={openCreateSubject}
            className="flex w-[85.66px] h-[85.66px] items-center justify-center justify-self-start bg-white border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-violet-400 hover:text-violet-500 hover:bg-violet-50/20 transition-all"
            aria-label="Добавить предмет"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* GRADES GRID */}
      {!loading && view === 'grades' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {grades.map(g => {
            const isSelected = selectedIds.includes(g.id);
            return (
              <div
                key={g.id}
                onClick={() => openGrade(g)}
                className={`group relative bg-white border rounded-2xl p-5 cursor-pointer hover:shadow-md transition-all flex items-start gap-4 ${
                  isSelected 
                    ? 'border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/20 shadow-sm' 
                    : 'border-slate-200/90 hover:border-emerald-300 hover:bg-slate-50/50'
                }`}
              >
                <div onClick={e => e.stopPropagation()} className="pt-0.5">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectItem(g.id)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer accent-emerald-600"
                  />
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all text-emerald-600 shadow-xs">
                  <BookOpen className="w-5 h-5 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 group-hover:text-emerald-900 transition-colors truncate">{g.name}</p>
                  <p className="text-xs font-semibold text-slate-400 mt-1">
                    {(g as any).topic_count != null ? `${(g as any).topic_count} тем` : 'Темы не указаны'}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={e => openEditGrade(g, e)} 
                    className="p-1.5 hover:bg-emerald-100 rounded-lg text-slate-400 hover:text-emerald-700 transition-colors"
                    title="Редактировать"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={e => { e.stopPropagation(); setDeleteTarget({ type: 'grade', id: g.id, name: g.name, warning: 'Все темы и вопросы внутри этого класса будут удалены.' }); }} 
                    className="p-1.5 hover:bg-rose-100 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {/* Create Grade Card Button */}
          <button
            onClick={openCreateGrade}
            className="flex w-[85.66px] h-[85.66px] items-center justify-center justify-self-start bg-white border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-emerald-400 hover:text-emerald-500 hover:bg-emerald-50/20 transition-all"
            aria-label="Добавить класс / раздел"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* TOPICS GRID */}
      {!loading && view === 'topics' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {topics.map(t => {
            const isSelected = selectedIds.includes(t.id);
            return (
              <div
                key={t.id}
                onClick={() => openTopic(t)}
                className={`group relative bg-white border rounded-2xl p-5 cursor-pointer hover:shadow-md transition-all flex items-start gap-4 ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50/20 ring-2 ring-blue-500/20 shadow-sm' 
                    : 'border-slate-200/90 hover:border-blue-300 hover:bg-slate-50/50'
                }`}
              >
                <div onClick={e => e.stopPropagation()} className="pt-0.5">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectItem(t.id)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer accent-blue-600"
                  />
                </div>
                <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all text-blue-600 shadow-xs">
                  <BookOpen className="w-5 h-5 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 group-hover:text-blue-900 transition-colors truncate">{topicName(t)}</p>
                  <p className="text-xs font-semibold text-slate-400 mt-1">
                    {(t as any).questions_count != null ? `${(t as any).questions_count} вопросов` : 'Вопросы не указаны'}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={e => openEditTopic(t, e)} 
                    className="p-1.5 hover:bg-blue-100 rounded-lg text-slate-400 hover:text-blue-700 transition-colors"
                    title="Редактировать"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={e => { e.stopPropagation(); setDeleteTarget({ type: 'topic', id: t.id, name: topicName(t), warning: 'Все вопросы внутри темы будут удалены.' }); }} 
                    className="p-1.5 hover:bg-rose-100 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {/* Create Topic Card Button */}
          <button
            onClick={openCreateTopic}
            className="flex w-[85.66px] h-[85.66px] items-center justify-center justify-self-start bg-white border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/20 transition-all"
            aria-label="Добавить тему"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* QUESTIONS LIST TABLE */}
      {!loading && view === 'questions' && (
        <div className="space-y-3">
          <div className="hidden md:grid grid-cols-[40px_56px_1fr_140px_90px] gap-4 px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-100/70 border border-slate-200/80 rounded-2xl items-center">
            <div>
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded text-violet-600 focus:ring-0 border-slate-300 cursor-pointer accent-violet-600"
              />
            </div>
            <div>#</div>
            <div>Вопрос</div>
            <div>Сложность</div>
            <div className="text-right">Действия</div>
          </div>
          {questions.map((q, idx) => {
            const isSelected = selectedIds.includes(q.id);
            return (
              <div
                key={q.id}
                className={`group bg-white border rounded-2xl px-6 py-4 hover:shadow-md hover:border-violet-200 transition-all ${
                  isSelected ? 'border-violet-500 bg-violet-50/30 ring-2 ring-violet-500/20 shadow-xs' : 'border-slate-200/90'
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-[40px_56px_1fr_140px_90px] gap-4 items-center">
                  <div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectItem(q.id)}
                      className="w-4 h-4 rounded text-violet-600 focus:ring-0 border-slate-300 cursor-pointer accent-violet-600"
                    />
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0 border border-slate-200/60">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm leading-relaxed truncate md:whitespace-normal">
                      {q.text}
                    </p>
                  </div>
                  <div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 tracking-wider">
                      {'★'.repeat(q.difficulty || 1)}{'☆'.repeat(5 - (q.difficulty || 1))}
                    </span>
                  </div>
                  <div className="flex justify-start md:justify-end gap-1 shrink-0 opacity-100 transition-opacity">
                    <button onClick={e => openEditQuestion(q, e)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-violet-600 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteTarget({ type: 'question', id: q.id, name: q.text.slice(0, 40) + '…' })} className="p-2 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <ConfirmDialog
          title={`Удалить «${deleteTarget.name}»?`}
          body={deleteTarget.warning ? `${deleteTarget.warning} Это действие необратимо.` : 'Это действие необратимо.'}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Subject Modal */}
      {subjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md relative">
            <button onClick={() => setSubjectModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"><XCircle className="w-5 h-5" /></button>
            <h2 className="text-xl font-bold text-slate-900 mb-5">{editSubjectId ? 'Изменить предмет' : 'Новый предмет'}</h2>
            <form onSubmit={saveSubject} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Название (UZ) *</label>
                <input type="text" required value={subjectForm.name} onChange={e => setSubjectForm(p => ({ ...p, name: e.target.value }))} className={INPUT} placeholder="Matematika" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Название (RU)</label>
                <input type="text" value={subjectForm.name_ru} onChange={e => setSubjectForm(p => ({ ...p, name_ru: e.target.value }))} className={INPUT} placeholder="Математика" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Название (EN)</label>
                <input type="text" value={subjectForm.name_en} onChange={e => setSubjectForm(p => ({ ...p, name_en: e.target.value }))} className={INPUT} placeholder="Mathematics" />
              </div>
              {subjectFormError && (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                  <span className="mt-0.5 shrink-0">⚠</span>
                  <span>{subjectFormError}</span>
                </div>
              )}
              <button type="submit" disabled={isSaving} className={BTN_PRIMARY + " flex items-center justify-center gap-2"}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                    <span>{editSubjectId ? 'Сохранение...' : 'Создание...'}</span>
                  </>
                ) : (
                  <span>{editSubjectId ? 'Сохранить' : 'Создать предмет'}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Grade Modal */}
      {gradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md relative">
            <button onClick={() => setGradeModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"><XCircle className="w-5 h-5" /></button>
            <h2 className="text-xl font-bold text-slate-900 mb-5">{editGradeId ? 'Изменить класс/раздел' : 'Новый класс / раздел'}</h2>
            <form onSubmit={saveGrade} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Название (UZ) *</label>
                <input type="text" required value={gradeForm.name} onChange={e => setGradeForm(p => ({ ...p, name: e.target.value }))} className={INPUT} placeholder="5-sinf yoki Umumiy" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Название (RU)</label>
                <input type="text" value={gradeForm.name_ru} onChange={e => setGradeForm(p => ({ ...p, name_ru: e.target.value }))} className={INPUT} placeholder="5 класс или Общий" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Название (EN)</label>
                <input type="text" value={gradeForm.name_en} onChange={e => setGradeForm(p => ({ ...p, name_en: e.target.value }))} className={INPUT} placeholder="Grade 5 or General" />
              </div>
              {gradeFormError && (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                  <span className="mt-0.5 shrink-0">⚠</span>
                  <span>{gradeFormError}</span>
                </div>
              )}
              <button type="submit" disabled={isSaving} className={BTN_PRIMARY + " flex items-center justify-center gap-2"}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                    <span>{editGradeId ? 'Сохранение...' : 'Создание...'}</span>
                  </>
                ) : (
                  <span>{editGradeId ? 'Сохранить' : 'Создать класс'}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Topic Modal */}
      {topicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md relative">
            <button onClick={() => setTopicModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"><XCircle className="w-5 h-5" /></button>
            <h2 className="text-xl font-bold text-slate-900 mb-5">{editTopicId ? 'Изменить тему' : 'Новая тема'}</h2>
            <form onSubmit={saveTopic} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Класс / Раздел (Grade) *</label>
                <select
                  required
                  value={topicForm.grade}
                  onChange={e => setTopicForm(p => ({ ...p, grade: Number(e.target.value) }))}
                  className={INPUT}
                >
                  {grades.length === 0 ? (
                    <option value="">(Загрузка или по умолчанию "Umumiy")</option>
                  ) : (
                    grades.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Название темы (UZ) *</label>
                <input type="text" required value={topicForm.name} onChange={e => setTopicForm(p => ({ ...p, name: e.target.value }))} className={INPUT} placeholder="Algebra" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Название темы (RU)</label>
                <input type="text" value={topicForm.name_ru} onChange={e => setTopicForm(p => ({ ...p, name_ru: e.target.value }))} className={INPUT} placeholder="Алгебра" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Название темы (EN)</label>
                <input type="text" value={topicForm.name_en} onChange={e => setTopicForm(p => ({ ...p, name_en: e.target.value }))} className={INPUT} placeholder="Algebra" />
              </div>
              {topicFormError && (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                  <span className="mt-0.5 shrink-0">⚠</span>
                  <span>{topicFormError}</span>
                </div>
              )}
              <button type="submit" disabled={isSaving} className={BTN_PRIMARY + " flex items-center justify-center gap-2"}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                    <span>{editTopicId ? 'Сохранение...' : 'Создание...'}</span>
                  </>
                ) : (
                  <span>{editTopicId ? 'Сохранить' : 'Создать тему'}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Question Modal */}
      {questionModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="flex min-h-full items-center justify-center py-8">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg relative shadow-2xl">
            <button onClick={() => setQuestionModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"><XCircle className="w-5 h-5" /></button>
            <h2 className="text-xl font-bold text-slate-900 mb-5">{editQuestionId ? 'Изменить вопрос' : 'Новый вопрос'}</h2>
            
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
              <button 
                type="button"
                onClick={() => setQuestionLangTab('uz')} 
                className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${questionLangTab === 'uz' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >O'zbekcha</button>
              <button 
                type="button"
                onClick={() => setQuestionLangTab('ru')} 
                className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${questionLangTab === 'ru' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >Русский</button>
              <button 
                type="button"
                onClick={() => setQuestionLangTab('en')} 
                className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${questionLangTab === 'en' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >English</button>
            </div>

            <form onSubmit={saveQuestion} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Текст вопроса ({questionLangTab.toUpperCase()}) {questionLangTab === 'uz' && '*'}
                </label>
                <textarea 
                  required={questionLangTab === 'uz'} 
                  value={(questionLangTab === 'uz' ? questionForm.text : questionLangTab === 'ru' ? questionForm.text_ru : questionForm.text_en) || ''} 
                  onChange={e => setQuestionForm(p => ({ ...p, [questionLangTab === 'uz' ? 'text' : `text_${questionLangTab}`]: e.target.value }))} 
                  className={INPUT + ' h-24 resize-none'} 
                  placeholder={questionLangTab === 'uz' ? "2 + 2 nechiga teng?" : questionLangTab === 'ru' ? "Чему равно 2 + 2?" : "What is 2 + 2?"} 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Варианты ответов ({questionLangTab.toUpperCase()})</label>
                <div className="space-y-2">
                  {(['A', 'B', 'C', 'D'] as const).map(key => {
                    const optionField = questionLangTab === 'uz' ? 'options' : `options_${questionLangTab}` as 'options_ru' | 'options_en';
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setQuestionForm(p => ({ ...p, correct_option: key }))}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                            questionForm.correct_option === key
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                          aria-pressed={questionForm.correct_option === key}
                          aria-label={`Set correct answer to ${key}`}
                        >
                          {key}
                        </button>
                        <input 
                          type="text" 
                          value={questionForm[optionField]?.[key] || ''} 
                          onChange={e => setQuestionForm(p => ({ ...p, [optionField]: { ...(p[optionField] || {}), [key]: e.target.value } }))} 
                          className={INPUT} 
                          placeholder={`Вариант ${key}`} 
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Сложность (1–5)</label>
                  <select value={questionForm.difficulty || 1} onChange={e => setQuestionForm(p => ({ ...p, difficulty: parseInt(e.target.value) }))} className={INPUT}>
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Объяснение (опционально)</label>
                  <textarea value={questionForm.explanation || ''} onChange={e => setQuestionForm(p => ({ ...p, explanation: e.target.value }))} className={INPUT + ' h-10 resize-none'} placeholder="Объяснение правильного ответа..." />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Изображение (опционально)</label>
                  {questionForm.existing_image_url && !questionForm.image && (
                    <div className="mb-2">
                      <img src={questionForm.existing_image_url} alt="Current" className="h-16 w-auto rounded-lg object-contain border border-slate-200" />
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={e => setQuestionForm(p => ({ ...p, image: e.target.files?.[0] || null }))} 
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Подпись к фото (опционально)</label>
                  <input 
                    type="text" 
                    value={questionForm.image_caption || ''} 
                    onChange={e => setQuestionForm(p => ({ ...p, image_caption: e.target.value }))} 
                    className={INPUT} 
                    placeholder="Например: График функции y = x^2" 
                  />
                </div>
              </div>

              {questionFormError && (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                  <span className="mt-0.5 shrink-0">⚠</span>
                  <span>{questionFormError}</span>
                </div>
              )}
              <button type="submit" disabled={isSaving} className={BTN_PRIMARY + " flex items-center justify-center gap-2"}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                    <span>{editQuestionId ? 'Сохранение...' : 'Сохранение...'}</span>
                  </>
                ) : (
                  <span>{editQuestionId ? 'Сохранить' : 'Добавить вопрос'}</span>
                )}
              </button>
            </form>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
