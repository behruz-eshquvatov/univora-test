import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, XCircle } from 'lucide-react';
import { billingApi } from '../../lib/api/billing';
import type { Plan } from '../../lib/api/billing';
import ConfirmDialog from './ConfirmDialog';

export default function BillingTab() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [planLangTab, setPlanLangTab] = useState<'uz' | 'ru' | 'en'>('uz');
  const [form, setForm] = useState({ 
    name: '', name_ru: '', name_en: '', 
    description: '', description_ru: '', description_en: '', 
    price: '', duration_days: 30 
  });
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    billingApi.getPlans().then(setPlans).catch(console.error);
  }, []);

  const openCreate = () => { 
    setPlanLangTab('uz');
    setForm({ name: '', name_ru: '', name_en: '', description: '', description_ru: '', description_en: '', price: '', duration_days: 30 }); 
    setEditId(null); setIsModalOpen(true); 
  };
  const openEdit = (plan: Plan) => { 
    setPlanLangTab('uz');
    setEditId(plan.id); 
    setForm({ 
      name: plan.name, name_ru: plan.name_ru || '', name_en: plan.name_en || '', 
      description: plan.description, description_ru: plan.description_ru || '', description_en: plan.description_en || '', 
      price: plan.price.toString(), duration_days: plan.duration_days 
    }); 
    setIsModalOpen(true); 
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        const updated = await billingApi.updatePlan(editId, form);
        setPlans(plans.map(p => p.id === editId ? updated : p));
      } else {
        const created = await billingApi.createPlan(form);
        setPlans([...plans, created]);
      }
      setIsModalOpen(false);
      setEditId(null);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await billingApi.deletePlan(deleteId);
    setPlans(plans.filter(p => p.id !== deleteId));
    setDeleteId(null);
  };

  const INP = 'w-full bg-white text-slate-900 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm';

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Тарифные планы</h2>
        <button onClick={openCreate} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm">
          <Plus className="w-4 h-4" /> Создать тариф
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.length > 0 ? plans.map(plan => (
          <div key={plan.id} className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 mb-1">{plan.name}</h3>
            <div className="text-2xl font-extrabold text-violet-600 mb-2">
              {plan.price} <span className="text-sm text-slate-400 font-medium">UZS / {plan.duration_days} дн.</span>
            </div>
            <p className="text-sm text-slate-500 flex-1 mb-5">{plan.description}</p>
            <div className="flex gap-2">
              <button onClick={() => openEdit(plan)} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5">
                <Edit2 className="w-3.5 h-3.5" /> Изменить
              </button>
              <button onClick={() => setDeleteId(plan.id)} className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )) : (
          <div className="col-span-full text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">Нет тарифных планов</div>
        )}
      </div>

      {/* Plan Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
              <XCircle className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 mb-5">{editId ? 'Изменить тариф' : 'Новый тариф'}</h2>
            
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
              <button 
                type="button"
                onClick={() => setPlanLangTab('uz')} 
                className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${planLangTab === 'uz' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >O'zbekcha</button>
              <button 
                type="button"
                onClick={() => setPlanLangTab('ru')} 
                className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${planLangTab === 'ru' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >Русский</button>
              <button 
                type="button"
                onClick={() => setPlanLangTab('en')} 
                className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${planLangTab === 'en' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >English</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Название ({planLangTab.toUpperCase()}) {planLangTab === 'uz' && '*'}
                </label>
                <input 
                  type="text" 
                  required={planLangTab === 'uz'} 
                  value={planLangTab === 'uz' ? form.name : planLangTab === 'ru' ? form.name_ru : form.name_en} 
                  onChange={e => setForm(p => ({ ...p, [planLangTab === 'uz' ? 'name' : `name_${planLangTab}`]: e.target.value }))} 
                  className={INP} 
                  placeholder={planLangTab === 'uz' ? "Masalan: Pro" : planLangTab === 'ru' ? "Например: Pro" : "Example: Pro"}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Цена (UZS)</label>
                  <input type="number" required value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} className={INP} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Дней</label>
                  <input type="number" required value={form.duration_days} onChange={e => setForm(p => ({ ...p, duration_days: parseInt(e.target.value) }))} className={INP} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Описание ({planLangTab.toUpperCase()})</label>
                <textarea 
                  value={planLangTab === 'uz' ? form.description : planLangTab === 'ru' ? form.description_ru : form.description_en} 
                  onChange={e => setForm(p => ({ ...p, [planLangTab === 'uz' ? 'description' : `description_${planLangTab}`]: e.target.value }))} 
                  className={INP + ' h-20 resize-none'} 
                />
              </div>
              <button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl text-sm">
                {editId ? 'Сохранить' : 'Создать тариф'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <ConfirmDialog
          title="Удалить тариф?"
          body="Это действие необратимо."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
