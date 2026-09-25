import { useState, useEffect } from 'react';
import { introApi, type IntroQuestion } from '../../lib/api/intro';
import { Plus, Trash2, Edit2, Loader2, Sparkles, Image, Video, HelpCircle, CheckCircle2 } from 'lucide-react';

export default function AdminIntroQuestionsTab() {
  const [questions, setQuestions] = useState<IntroQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [text, setText] = useState('');
  const [kind, setKind] = useState<'logic' | 'psychology'>('logic');
  const [options, setOptions] = useState<{ A: string; B: string; C: string; D: string }>({
    A: '',
    B: '',
    C: '',
    D: '',
  });
  const [correctOption, setCorrectOption] = useState('A');
  const [explanation, setExplanation] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const data = await introApi.getAdminQuestions();
      const list = Array.isArray(data) ? data : (data as any)?.results || [];
      setQuestions(list);
    } catch (err) {
      console.error('Failed to load admin intro questions:', err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setText('');
    setKind('logic');
    setOptions({ A: '', B: '', C: '', D: '' });
    setCorrectOption('A');
    setExplanation('');
    setVideoUrl('');
    setImageFile(null);
    setShowModal(true);
  };

  const handleOpenEdit = (q: IntroQuestion) => {
    setEditingId(q.id);
    setText(q.text);
    setKind(q.kind || 'logic');
    setOptions({
      A: q.options?.A || '',
      B: q.options?.B || '',
      C: q.options?.C || '',
      D: q.options?.D || '',
    });
    setCorrectOption(q.correct_option || 'A');
    setExplanation(q.explanation || '');
    setVideoUrl(q.video_url || '');
    setImageFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      alert('Savol matnini kiriting');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('kind', kind);
      formData.append('options', JSON.stringify(options));
      formData.append('correct_option', correctOption);
      if (explanation) formData.append('explanation', explanation);
      if (videoUrl) formData.append('video_url', videoUrl);
      if (imageFile) formData.append('image', imageFile);

      if (editingId) {
        await introApi.updateAdminQuestion(editingId, formData);
      } else {
        await introApi.createAdminQuestion(formData);
      }

      setShowModal(false);
      fetchQuestions();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Savolni o\'chirishni tasdiqlaysizmi?')) return;
    try {
      await introApi.deleteAdminQuestion(id);
      fetchQuestions();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'O\'chirishda xatolik');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-600" />
            Kirish testi savollari (Admin)
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Ro'yxatdan o'tmasdan topshiriladigan 4 ta tasodifiy kirish savollarini boshqarish
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi savol qo'shish</span>
        </button>
      </div>

      {/* Questions Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 text-violet-600 animate-spin mx-auto mb-2" />
            <p className="text-slate-500 font-bold text-sm">Savollar yuklanmoqda...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="font-bold">Hozircha kirish testi savollari mavjud emas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4">Savol matni</th>
                  <th className="p-4">Turi</th>
                  <th className="p-4">Variantlar</th>
                  <th className="p-4">To'g'ri javob</th>
                  <th className="p-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium">
                {questions.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 max-w-xs truncate">
                      <p className="font-bold text-slate-900 truncate">{q.text}</p>
                      {q.image && <span className="text-xs text-violet-600 flex items-center gap-1 mt-0.5"><Image className="w-3 h-3" /> Rasm mavjud</span>}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${q.kind === 'logic' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                        {q.kind === 'logic' ? 'Mantiqiy' : 'Psixologik'}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-500">
                      {Object.keys(q.options || {}).join(', ')}
                    </td>
                    <td className="p-4 font-bold text-emerald-600">
                      {q.correct_option || '-'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(q)}
                          className="p-2 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(q.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Question Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              {editingId ? 'Savolni tahrirlash' : 'Yangi savol yaratish'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm font-medium">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Savol matni:</label>
                <textarea
                  value={text || ''}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full h-20 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  required
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Savol turi:</label>
                <select
                  value={kind || 'logic'}
                  onChange={(e) => setKind(e.target.value as any)}
                  className="w-full p-3 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="logic">Mantiqiy (Baholanadi)</option>
                  <option value="psychology">Psixologik (Baholanmaydi)</option>
                </select>
              </div>

              {/* Options A, B, C, D */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Javob variantlari (A, B, C, D)
                  </label>
                  {kind === 'logic' && (
                    <span className="text-xs text-emerald-600 font-bold">
                      * To'g'ri harfni bosing ({correctOption} to'g'ri)
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                    const isCorrect = correctOption === optKey;
                    return (
                      <div key={optKey} className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setCorrectOption(optKey)}
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 transition-all shadow-xs ${
                            isCorrect
                              ? 'bg-[#00c58d] text-white shadow-emerald-500/20 shadow-md scale-105'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                          title="To'g'ri javob sifatida belgilash"
                        >
                          {optKey}
                        </button>
                        <input
                          type="text"
                          value={(options as any)?.[optKey] || ''}
                          onChange={(e) => setOptions({ ...options, [optKey]: e.target.value })}
                          className="w-full bg-white text-slate-900 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-medium"
                          placeholder={`Variant ${optKey}`}
                          required
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Izoh / Tushuntirish:</label>
                <textarea
                  value={explanation || ''}
                  onChange={(e) => setExplanation(e.target.value)}
                  className="w-full h-16 p-3 border border-slate-200 rounded-xl"
                  placeholder="Javob izohi..."
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Video Havolasi (YouTube URL):</label>
                <input
                  type="url"
                  value={videoUrl || ''}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rasm yuklash:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Saqlash</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
