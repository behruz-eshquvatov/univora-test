import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, XCircle, Sparkles, CheckSquare, Loader2 } from 'lucide-react';
import { billingApi, type Plan, type PlanFeaturesSchema, type PlanFeatureItem } from '../../lib/api/billing';
import ConfirmDialog from './ConfirmDialog';

export default function BillingTab() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [featureCatalog, setFeatureCatalog] = useState<PlanFeaturesSchema | null>(null);
  const [loadingFeatures, setLoadingFeatures] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [planLangTab, setPlanLangTab] = useState<'uz' | 'ru' | 'en'>('uz');
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Form State
  const [form, setForm] = useState<Record<string, any>>({
    name: '',
    name_ru: '',
    name_en: '',
    description: '',
    description_ru: '',
    description_en: '',
    price: '',
    duration_days: 30,
    is_pro: false,
    // Dynamic feature values
    featureValues: {} as Record<string, any>,
  });

  useEffect(() => {
    setLoadingPlans(true);
    billingApi.getPlans().then(setPlans).catch(console.error).finally(() => setLoadingPlans(false));
    setLoadingFeatures(true);
    billingApi
      .getPlanFeatures()
      .then(setFeatureCatalog)
      .catch(console.error)
      .finally(() => setLoadingFeatures(false));
  }, []);

  const openCreate = () => {
    setPlanLangTab('uz');
    const initialFeatureValues: Record<string, any> = {};
    if (featureCatalog) {
      featureCatalog.features.forEach((feat) => {
        if (feat.kind === 'flag') initialFeatureValues[feat.key] = true;
        else if (feat.kind === 'choice') initialFeatureValues[feat.key] = feat.choices?.[0] || 30;
        else if (feat.kind === 'limit') initialFeatureValues[feat.key] = '';
      });
    }
    setForm({
      name: '',
      name_ru: '',
      name_en: '',
      description: '',
      description_ru: '',
      description_en: '',
      price: '',
      duration_days: 30,
      is_pro: false,
      featureValues: initialFeatureValues,
    });
    setEditId(null);
    setIsModalOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setPlanLangTab('uz');
    setEditId(plan.id);

    const featureValues: Record<string, any> = {};
    if (featureCatalog) {
      featureCatalog.features.forEach((feat) => {
        if (feat.storage === 'field') {
          featureValues[feat.key] = (plan as any)[feat.key] ?? (feat.kind === 'flag' ? false : '');
        } else {
          featureValues[feat.key] = (plan.features as any)?.[feat.key] ?? (feat.kind === 'flag' ? false : '');
        }
      });
    }

    setForm({
      name: plan.name,
      name_ru: plan.name_ru || '',
      name_en: plan.name_en || '',
      description: plan.description,
      description_ru: plan.description_ru || '',
      description_en: plan.description_en || '',
      price: plan.price.toString(),
      duration_days: plan.duration_days,
      is_pro: (plan as any).is_pro || false,
      featureValues,
    });
    setIsModalOpen(true);
  };

  const handleFeatureChange = (key: string, val: any) => {
    setForm((prev) => ({
      ...prev,
      featureValues: {
        ...prev.featureValues,
        [key]: val,
      },
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Separate field storage vs feature (JSON) storage
    const payload: Record<string, any> = {
      name: form.name,
      name_ru: form.name_ru,
      name_en: form.name_en,
      description: form.description,
      description_ru: form.description_ru,
      description_en: form.description_en,
      price: form.price,
      duration_days: form.duration_days,
      is_pro: form.is_pro,
      features: {},
    };

    if (featureCatalog) {
      featureCatalog.features.forEach((feat) => {
        const val = form.featureValues[feat.key];
        if (feat.storage === 'field') {
          payload[feat.key] = val === '' ? null : val;
        } else {
          payload.features[feat.key] = val;
        }
      });
    }

    try {
      if (editId) {
        const updated = await billingApi.updatePlan(editId, payload);
        setPlans(plans.map((p) => (p.id === editId ? updated : p)));
      } else {
        const created = await billingApi.createPlan(payload);
        setPlans([...plans, created]);
      }
      setIsModalOpen(false);
      setEditId(null);
    } catch (err: any) {
      alert(err?.response?.data?.detail || JSON.stringify(err?.response?.data) || 'Xatolik yuz berdi');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await billingApi.deletePlan(deleteId);
      setPlans(plans.filter((p) => p.id !== deleteId));
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'O\'chirishda xatolik');
    } finally {
      setDeleteId(null);
    }
  };

  const INP =
    'w-full bg-white text-slate-900 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm';

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Tarif rejalari va Ptichkalar</h2>
          <p className="text-sm text-slate-500 mt-0.5">Dinamik plan builder va cheklovlar moslamasi</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-2xl font-bold text-sm shadow-md transition-all"
        >
          <Plus className="w-4 h-4" /> Yangi tarif yaratish
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {loadingPlans ? (
          <div className="col-span-full py-16 text-center">
            <Loader2 className="w-8 h-8 text-violet-600 animate-spin mx-auto mb-2" />
            <p className="text-slate-500 font-bold text-sm">Tariflar yuklanmoqda...</p>
          </div>
        ) : plans.length > 0 ? (
          plans.map((plan) => (
            <div key={plan.id} className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                {(plan as any).is_pro && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-700">
                    PRO
                  </span>
                )}
              </div>
              <div className="text-2xl font-extrabold text-violet-600 mb-2">
                {Number(plan.price).toLocaleString()} <span className="text-sm text-slate-400 font-medium">UZS / {plan.duration_days} kun</span>
              </div>
              <p className="text-sm text-slate-500 flex-1 mb-5 line-clamp-2">{plan.description}</p>
              
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(plan)}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Izmenit
                </button>
                <button
                  onClick={() => setDeleteId(plan.id)}
                  className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
            Tarif rejalari topilmadi
          </div>
        )}
      </div>

      {/* Plan Builder Form Modal with Dynamic Ptichkalar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-full"
            >
              <XCircle className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-extrabold text-slate-900 mb-1">
              {editId ? 'Tarifni tahrirlash' : 'Yangi tarif yaratish'}
            </h2>
            <p className="text-xs text-slate-500 mb-6">Tarif ma'lumotlari va ptichkalar (cheklovlar) moslamasi</p>

            {/* Language tabs for Name & Description */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6 max-w-sm">
              <button
                type="button"
                onClick={() => setPlanLangTab('uz')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  planLangTab === 'uz' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'
                }`}
              >
                O'zbekcha
              </button>
              <button
                type="button"
                onClick={() => setPlanLangTab('ru')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  planLangTab === 'ru' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'
                }`}
              >
                Русский
              </button>
              <button
                type="button"
                onClick={() => setPlanLangTab('en')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  planLangTab === 'en' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'
                }`}
              >
                English
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              {/* Basic Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tarif nomi ({planLangTab.toUpperCase()}) {planLangTab === 'uz' && '*'}
                  </label>
                  <input
                    type="text"
                    required={planLangTab === 'uz'}
                    value={
                      planLangTab === 'uz'
                        ? form.name
                        : planLangTab === 'ru'
                        ? form.name_ru
                        : form.name_en
                    }
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        [planLangTab === 'uz' ? 'name' : `name_${planLangTab}`]: e.target.value,
                      }))
                    }
                    className={INP}
                    placeholder="Masalan: Pro Plan"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Narxi (UZS)</label>
                    <input
                      type="number"
                      required
                      value={form.price}
                      onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                      className={INP}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Muddat (Kun)</label>
                    <input
                      type="number"
                      required
                      value={form.duration_days}
                      onChange={(e) => setForm((p) => ({ ...p, duration_days: parseInt(e.target.value) }))}
                      className={INP}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tavsif ({planLangTab.toUpperCase()})
                  </label>
                  <textarea
                    value={
                      planLangTab === 'uz'
                        ? form.description
                        : planLangTab === 'ru'
                        ? form.description_ru
                        : form.description_en
                    }
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        [planLangTab === 'uz' ? 'description' : `description_${planLangTab}`]: e.target.value,
                      }))
                    }
                    className={INP + ' h-16 resize-none'}
                  />
                </div>
              </div>

              {/* Dynamic Feature Groups & Items ("Ptichkalar") */}
              <div className="border-t border-slate-200 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-violet-600" />
                  <h3 className="font-extrabold text-base text-slate-900">
                    Tarif Imkoniyatlari va Cheklovlari (Ptichkalar)
                  </h3>
                </div>

                {loadingFeatures ? (
                  <div className="py-6 text-center">
                    <Loader2 className="w-6 h-6 text-violet-600 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-bold">Imkoniyatlar ro'yxati yuklanmoqda...</p>
                  </div>
                ) : featureCatalog ? (
                  <div className="space-y-6">
                    {featureCatalog.groups.map((grp) => {
                      const groupFeatures = featureCatalog.features.filter((f) => f.group === grp.key);
                      if (groupFeatures.length === 0) return null;

                      return (
                        <div key={grp.key} className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                          <h4 className="font-bold text-sm text-violet-700 uppercase tracking-wider mb-3">
                            {grp.label}
                          </h4>

                          <div className="space-y-3">
                            {groupFeatures.map((feat) => {
                              const curVal = form.featureValues[feat.key];

                              if (feat.kind === 'flag') {
                                return (
                                  <label key={feat.key} className="flex items-start gap-3 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={!!curVal}
                                      onChange={(e) => handleFeatureChange(feat.key, e.target.checked)}
                                      className="w-4 h-4 mt-0.5 rounded text-violet-600 focus:ring-violet-500 shrink-0"
                                    />
                                    <div>
                                      <p className="text-sm font-bold text-slate-800">{feat.label}</p>
                                      {feat.help && <p className="text-xs text-slate-500 mt-0.5">{feat.help}</p>}
                                    </div>
                                  </label>
                                );
                              }

                              if (feat.kind === 'limit') {
                                return (
                                  <div key={feat.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                                    <div>
                                      <p className="text-sm font-bold text-slate-800">{feat.label}</p>
                                      {feat.help && <p className="text-xs text-slate-500 mt-0.5">{feat.help}</p>}
                                    </div>
                                    <input
                                      type="number"
                                      placeholder="Bo'sh = Cheksiz"
                                      value={curVal ?? ''}
                                      onChange={(e) =>
                                        handleFeatureChange(
                                          feat.key,
                                          e.target.value === '' ? '' : parseInt(e.target.value)
                                        )
                                      }
                                      className="w-full sm:w-36 px-3 py-1.5 border border-slate-200 rounded-xl text-sm font-medium"
                                    />
                                  </div>
                                );
                              }

                              if (feat.kind === 'choice') {
                                return (
                                  <div key={feat.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                                    <div>
                                      <p className="text-sm font-bold text-slate-800">{feat.label}</p>
                                      {feat.help && <p className="text-xs text-slate-500 mt-0.5">{feat.help}</p>}
                                    </div>
                                    <select
                                      value={curVal ?? feat.choices?.[0]}
                                      onChange={(e) => handleFeatureChange(feat.key, parseInt(e.target.value))}
                                      className="w-full sm:w-36 px-3 py-1.5 border border-slate-200 rounded-xl text-sm font-bold bg-white"
                                    >
                                      {feat.choices?.map((choice) => (
                                        <option key={choice} value={choice}>
                                          {choice} ta savol
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                );
                              }

                              return null;
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <button
                type="submit"
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3.5 rounded-2xl text-base shadow-lg shadow-violet-500/25 transition-all"
              >
                {editId ? 'Saqlash' : 'Tarifni yaratish'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <ConfirmDialog
          title="Tarifni o'chirish?"
          body="Bu amalni ortga qaytarib bo'lmaydi."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
