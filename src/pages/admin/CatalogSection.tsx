import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, XCircle, Plus, Edit2, Trash2,
  ChevronRight, Home, FolderOpen, ArrowLeft
} from 'lucide-react';
import { catalogApi } from '../../lib/api/catalog';
import type { Subject, Topic, Question } from '../../lib/api/catalog';
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

type CatalogView = 'subjects' | 'topics' | 'questions';

interface DeleteTarget {
  type: 'subject' | 'topic' | 'question';
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
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  // Subject form
  const [subjectModal, setSubjectModal] = useState(false);
  const [subjectForm, setSubjectForm] = useState({ name: '', name_ru: '', name_en: '', description: '' });
  const [editSubjectId, setEditSubjectId] = useState<number | null>(null);
  const [subjectFormError, setSubjectFormError] = useState<string | null>(null);

  // Topic form
  const [topicModal, setTopicModal] = useState(false);
  const [topicForm, setTopicForm] = useState({ name: '', name_ru: '', name_en: '' });
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

  const loadTopics = useCallback(async (subjectId: number) => {
    setLoading(true); setError(null);
    try {
      const data = await catalogApi.getTopics(subjectId);
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

  const openSubject = (subject: Subject) => { setSelectedSubject(subject); setView('topics'); loadTopics(subject.id); };
  const openTopic = (topic: Topic) => { setSelectedTopic(topic); setView('questions'); loadQuestions(topic.id); };
  const goBack = () => {
    if (view === 'questions') { setView('topics'); setSelectedTopic(null); setQuestions([]); }
    else if (view === 'topics') { setView('subjects'); setSelectedSubject(null); setTopics([]); }
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
    }
  };

  // Topic CRUD
  const openCreateTopic = () => { setTopicForm({ name: '', name_ru: '', name_en: '' }); setEditTopicId(null); setTopicFormError(null); setTopicModal(true); };
  const openEditTopic = (t: Topic, e: React.MouseEvent) => {
    e.stopPropagation();
    setTopicForm({ name: (t as any).name || (t as any).title || '', name_ru: t.translations?.ru || '', name_en: t.translations?.en || '' });
    setEditTopicId(t.id); setTopicFormError(null); setTopicModal(true);
  };
  const saveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;
    setTopicFormError(null);
    try {
      if (editTopicId) {
        const updated = await catalogApi.updateTopic(editTopicId, topicForm as any);
        setTopics(prev => prev.map(t => t.id === editTopicId ? updated : t));
      } else {
        const created = await catalogApi.createTopic({ ...topicForm, subject: selectedSubject.id } as any);
        setTopics(prev => [...prev, created]);
      }
      setTopicModal(false);
    } catch (err: any) {
      setTopicFormError(parseApiError(err));
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
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setError(null);
    try {
      if (deleteTarget.type === 'subject') {
        await catalogApi.deleteSubject(deleteTarget.id);
        setSubjects(prev => prev.filter(s => s.id !== deleteTarget.id));
      } else if (deleteTarget.type === 'topic') {
        await catalogApi.deleteTopic(deleteTarget.id);
        setTopics(prev => prev.filter(t => t.id !== deleteTarget.id));
      } else {
        await catalogApi.deleteQuestion(deleteTarget.id);
        setQuestions(prev => prev.filter(q => q.id !== deleteTarget.id));
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Не удалось удалить');
    } finally { setDeleteTarget(null); }
  };

  const topicName = (t: Topic) => (t as any).name || (t as any).title || '—';

  const Breadcrumb = () => (
    <nav className="flex items-center gap-1 text-sm font-medium text-slate-400 mb-5 flex-wrap">
      <button onClick={() => { setView('subjects'); setSelectedSubject(null); setSelectedTopic(null); }} className="hover:text-violet-600 transition-colors flex items-center gap-1">
        <Home className="w-3.5 h-3.5" /> Предметы
      </button>
      {selectedSubject && (
        <>
          <ChevronRight className="w-3.5 h-3.5" />
          <button onClick={() => { setView('topics'); setSelectedTopic(null); loadTopics(selectedSubject.id); }} className="hover:text-violet-600 transition-colors text-slate-600">{selectedSubject.name}</button>
        </>
      )}
      {selectedTopic && (
        <>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-800">{topicName(selectedTopic)}</span>
        </>
      )}
    </nav>
  );

  return (
    <div className="space-y-4">
      {/* Breadcrumb row with back arrow */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {view !== 'subjects' && (
            <button onClick={goBack} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <Breadcrumb />
        </div>
        {view === 'questions' && (
          <button
            onClick={openCreateQuestion}
            className="flex w-[85.66px] h-[85.66px] items-center justify-center shrink-0 bg-white border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-violet-400 hover:text-violet-500 hover:bg-violet-50/20 transition-all"
            aria-label="Добавить вопрос"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </div>

      {error && <div className="px-4 py-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm font-medium rounded-xl">{error}</div>}

      {loading && (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-violet-600 rounded-full animate-spin mr-3" />
          Загрузка...
        </div>
      )}

      {/* SUBJECTS */}
      {!loading && view === 'subjects' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map(s => (
            <div key={s.id} onClick={() => openSubject(s)} className="group bg-white border border-slate-200 rounded-2xl p-5 cursor-pointer hover:border-violet-300 hover:bg-violet-50/30 transition-all flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center shrink-0 group-hover:bg-violet-200 transition-colors">
                <FolderOpen className="w-5 h-5 text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 truncate">{s.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {(s as any).topics_count != null ? `${(s as any).topics_count} тем` : '—'}
                </p>
              </div>
              <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <button onClick={e => openEditSubject(s, e)} className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-violet-600 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={e => { e.stopPropagation(); setDeleteTarget({ type: 'subject', id: s.id, name: s.name, warning: 'Все темы и вопросы внутри будут удалены.' }); }} className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-rose-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
          {/* + Add card */}
          <button
            onClick={openCreateSubject}
            className="flex w-[85.66px] h-[85.66px] items-center justify-center justify-self-start bg-white border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-violet-400 hover:text-violet-500 hover:bg-violet-50/20 transition-all"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* TOPICS */}
      {!loading && view === 'topics' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map(t => (
            <div key={t.id} onClick={() => openTopic(t)} className="group bg-white border border-slate-200 rounded-2xl p-5 cursor-pointer hover:border-violet-300 hover:bg-violet-50/30 transition-all flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-200 transition-colors">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 truncate">{topicName(t)}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {(t as any).questions_count != null ? `${(t as any).questions_count} вопросов` : '—'}
                </p>
              </div>
              <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <button onClick={e => openEditTopic(t, e)} className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-violet-600 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={e => { e.stopPropagation(); setDeleteTarget({ type: 'topic', id: t.id, name: topicName(t), warning: 'Все вопросы внутри темы будут удалены.' }); }} className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-rose-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
          {/* + Add card */}
          <button
            onClick={openCreateTopic}
            className="flex w-[85.66px] h-[85.66px] items-center justify-center justify-self-start bg-white border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/20 transition-all"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* QUESTIONS */}
      {!loading && view === 'questions' && (
        <div className="space-y-3">
          <div className="hidden md:grid grid-cols-[48px_1fr_140px_90px] gap-4 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 bg-slate-50 border border-slate-200 rounded-2xl">
            <div>#</div>
            <div>Вопрос</div>
            <div>Сложность</div>
            <div className="text-right">Действия</div>
          </div>
          {questions.map((q, idx) => (
            <div key={q.id} className="group bg-white border border-slate-200 rounded-2xl px-5 py-4 hover:border-violet-200 transition-all">
              <div className="grid grid-cols-1 md:grid-cols-[48px_1fr_140px_90px] gap-4 items-center">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm shrink-0">
                  {idx + 1}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 text-sm leading-relaxed truncate md:whitespace-normal">
                    {q.text}
                  </p>
                </div>
                <div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200">
                    {'★'.repeat(q.difficulty || 1)}{'☆'.repeat(5 - (q.difficulty || 1))}
                  </span>
                </div>
                <div className="flex justify-start md:justify-end gap-1 shrink-0 opacity-100 transition-opacity">
                  <button onClick={e => openEditQuestion(q, e)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-violet-600 transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteTarget({ type: 'question', id: q.id, name: q.text.slice(0, 40) + '…' })} className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
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
              <button type="submit" className={BTN_PRIMARY}>{editSubjectId ? 'Сохранить' : 'Создать предмет'}</button>
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
              <button type="submit" className={BTN_PRIMARY}>{editTopicId ? 'Сохранить' : 'Создать тему'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Question Modal */}
      {questionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
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
                  value={questionLangTab === 'uz' ? questionForm.text : questionLangTab === 'ru' ? questionForm.text_ru : questionForm.text_en} 
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
                          value={questionForm[optionField][key]} 
                          onChange={e => setQuestionForm(p => ({ ...p, [optionField]: { ...p[optionField], [key]: e.target.value } }))} 
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
                  <select value={questionForm.difficulty} onChange={e => setQuestionForm(p => ({ ...p, difficulty: parseInt(e.target.value) }))} className={INPUT}>
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Объяснение (опционально)</label>
                  <textarea value={questionForm.explanation} onChange={e => setQuestionForm(p => ({ ...p, explanation: e.target.value }))} className={INPUT + ' h-10 resize-none'} placeholder="Объяснение правильного ответа..." />
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
                    value={questionForm.image_caption} 
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
              <button type="submit" className={BTN_PRIMARY}>{editQuestionId ? 'Сохранить' : 'Добавить вопрос'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
