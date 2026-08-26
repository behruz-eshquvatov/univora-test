import { useState, useEffect } from 'react';
import { billingApi, type Plan, type CurrentSubscriptionResponse, type SubscriptionRequestResponse } from '../lib/api/billing';
import { Check, Sparkles, Zap, Shield, Crown, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubData, setCurrentSubData] = useState<CurrentSubscriptionResponse | null>(null);
  const [selectingPlanId, setSelectingPlanId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPlanModal, setShowPlanModal] = useState<Plan | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<SubscriptionRequestResponse | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    billingApi.getPlans().then(setPlans).catch(console.error);
    billingApi.getCurrentSubscription().then(setCurrentSubData).catch(console.error);
  }, []);

  const confirmSelectPlan = async () => {
    if (!showPlanModal) return;
    setSelectingPlanId(showPlanModal.id);
    setError(null);
    try {
      const resp = await billingApi.createPayment({
        plan_id: showPlanModal.id,
        amount: Number(showPlanModal.price)
      });
      setRequestSuccess(resp);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Ошибка при оформлении заявки');
      setShowPlanModal(null);
    } finally {
      setSelectingPlanId(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentSubData?.subscription) return;
    if (!window.confirm('Вы уверены, что хотите отменить текущую подписку? Действие необратимо.')) return;
    
    setCancelLoading(true);
    try {
      await billingApi.cancelSubscription(currentSubData.subscription.id);
      // Refresh subscription status
      const updatedData = await billingApi.getCurrentSubscription();
      setCurrentSubData(updatedData);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Ошибка при отмене подписки');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-surface min-h-[calc(100vh-2rem)] rounded-[2rem] p-6 sm:p-10 border border-slate-100 dark:border-dark-border overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-dark-text-main mb-4 tracking-tight">
            Выберите доступ к <span className="text-violet-600">Univora</span>
          </h1>
          <p className="text-slate-500 dark:text-dark-text-muted font-medium max-w-2xl mx-auto mb-8">
            Отменяйте в любое время. Подписываясь, вы соглашаетесь с условиями предоставления услуг.
          </p>
          
          {/* Fake Monthly/Annual Toggle (just for visual similarity) */}
          <div className="inline-flex items-center bg-slate-100/80 dark:bg-dark-bg rounded-full p-1 border border-slate-200/50 dark:border-dark-border mb-3">
            <button className="px-6 py-2 rounded-full bg-white dark:bg-dark-surface text-violet-700 dark:text-violet-400 shadow-sm font-bold text-sm">
              Monthly
            </button>
            <button className="px-6 py-2 rounded-full text-slate-500 dark:text-dark-text-muted font-bold text-sm hover:text-slate-800 dark:hover:text-dark-text-main transition-colors">
              Annual
            </button>
          </div>
          <p className="text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-widest">
            Сэкономьте 16% при оплате за год
          </p>
        </div>

        {error && (
          <div className="mb-8 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm font-medium rounded-xl text-center max-w-md mx-auto">
            {error}
          </div>
        )}

        {currentSubData?.pending_request && (
          <div className="mb-8 px-4 py-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-start gap-4 max-w-2xl mx-auto">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-800 dark:text-amber-500 mb-1">Ваша заявка находится на рассмотрении</h4>
              <p className="text-sm text-amber-700/80 dark:text-amber-400/80 mb-2">
                Вы запросили тариф <strong>{currentSubData.pending_request.plan.name}</strong>. Администратор рассмотрит заявку в ближайшее время.
              </p>
              {currentSubData.pending_request.rejection_reason && (
                <div className="mt-2 text-sm text-rose-600 bg-rose-100 p-2 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Причина отклонения предыдущей заявки: {currentSubData.pending_request.rejection_reason}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8 max-w-lg lg:max-w-none mx-auto relative z-10">
          {plans.map((plan, idx) => {
            const isCurrent = currentSubData?.subscription?.plan.id === plan.id;
            const isRecommended = idx === 1; // Highlight the middle plan like in Gemini's design

            return (
              <div 
                key={plan.id}
                className={`relative bg-white dark:bg-dark-surface rounded-3xl p-8 flex flex-col transition-all duration-300
                  ${isRecommended 
                    ? 'border-2 border-violet-500 dark:border-violet-600 shadow-2xl shadow-violet-500/10 dark:shadow-violet-950/20 scale-[1.02]' 
                    : 'border border-slate-200 dark:border-dark-border shadow-lg shadow-slate-200/50 dark:shadow-black/50 hover:shadow-xl dark:hover:shadow-black/70 dark:hover:border-violet-950'
                  }`}
              >
                {/* Badges */}
                {(isRecommended || isCurrent) && (
                  <div className="absolute top-0 left-8 -translate-y-1/2 bg-white dark:bg-dark-surface px-2 flex gap-3">
                    {isRecommended && (
                      <span className="text-xs font-black text-violet-600 dark:text-violet-400 tracking-widest uppercase">
                        Recommended
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-xs font-black text-emerald-500 dark:text-emerald-400 tracking-widest uppercase flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Текущий
                      </span>
                    )}
                  </div>
                )}

                {/* Plan Header */}
                <h3 className="text-xl font-bold text-slate-900 dark:text-dark-text-main mb-2">
                  Univora <span className={isRecommended ? "text-violet-600 dark:text-violet-400" : "text-slate-600 dark:text-dark-text-muted"}>{plan.name}</span>
                </h3>
                <p className="text-slate-500 dark:text-dark-text-muted text-sm h-10 line-clamp-2">
                  {plan.name.toLowerCase().includes('premium') ? 'Расширенные функции для учебы и быстрая работа.' : 
                   plan.name.toLowerCase().includes('pro') ? 'Максимальные возможности и ускоренная генерация.' : 
                   plan.name.includes('1+1') ? 'Специальное предложение для двоих.' : 
                   'Базовые функции для начала работы.'}
                </p>

                {/* Price */}
                <div className="mt-6 mb-8">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-4xl font-extrabold text-slate-900 dark:text-dark-text-main">
                      {Number(plan.price).toLocaleString('ru-RU', { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-slate-500 dark:text-dark-text-muted font-medium whitespace-nowrap">
                      UZS / {plan.duration_days} дней
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-2 mb-8">
                  {isCurrent ? (
                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={handleCancelSubscription}
                        disabled={cancelLoading}
                        className="w-full py-3.5 rounded-2xl font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-100 dark:border-rose-900/50 transition-colors text-sm disabled:opacity-50"
                      >
                        {cancelLoading ? 'Отменяем...' : 'Отменить подписку'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowPlanModal(plan)}
                      className={`w-full py-3.5 rounded-2xl font-bold transition-all text-sm ${
                        isRecommended 
                          ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-md' 
                          : 'bg-slate-50 dark:bg-dark-bg hover:bg-slate-100 dark:hover:bg-dark-bg/60 text-violet-600 dark:text-violet-400 border border-slate-200 dark:border-dark-border'
                      }`}
                    >
                      Выбрать {plan.name}
                    </button>
                  )}
                </div>

                <div className="h-px w-full bg-slate-100 dark:bg-dark-border mb-6"></div>

                {/* Features List */}
                <div className="mt-auto">
                  <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="w-4 h-4 text-violet-500" />
                    <span className="font-bold text-slate-800 dark:text-dark-text-main text-sm">Включает:</span>
                  </div>
                  
                  <ul className="space-y-4">
                    {plan.features?.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                        <span className="text-slate-600 dark:text-dark-text-muted text-sm leading-relaxed">{feature}</span>
                      </li>
                    ))}
                    
                    {/* Fake static features to make it look tall like the image */}
                    {!plan.features?.length && (
                      <>
                        <li className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                          <span className="text-slate-600 dark:text-dark-text-muted text-sm leading-relaxed">Доступ к базовым функциям платформы</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                          <span className="text-slate-600 dark:text-dark-text-muted text-sm leading-relaxed">Техническая поддержка</span>
                        </li>
                      </>
                    )}
                  </ul>

                  <div className="h-px w-full bg-slate-100 dark:bg-dark-border my-6"></div>

                {/* Extra Features / Ecosystem (like Google's "Includes more access") */}
                <p className="text-xs font-bold text-slate-800 dark:text-dark-text-main uppercase tracking-wide mb-6">
                  Дополнительные возможности
                </p>

                <ul className="space-y-5">
                  <li className="flex items-start gap-4">
                    <Zap className="w-5 h-5 text-slate-400 dark:text-dark-text-muted shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-dark-text-main">Быстрая обработка</p>
                      <p className="text-xs text-slate-500 dark:text-dark-text-muted mt-0.5">Ускоренная работа нейросетей</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <Shield className="w-5 h-5 text-slate-400 dark:text-dark-text-muted shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-dark-text-main">Приватность</p>
                      <p className="text-xs text-slate-500 dark:text-dark-text-muted mt-0.5">Ваши данные надежно защищены</p>
                    </div>
                  </li>
                </ul>
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* Plan Request / Telegram Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-surface rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative border dark:border-dark-border animate-in zoom-in-95 duration-200">
            {!requestSuccess ? (
              <>
                <div className="w-12 h-12 bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 rounded-2xl flex items-center justify-center mb-5">
                  <Crown className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-800 dark:text-dark-text-main mb-2">Смена тарифа</h3>
                <p className="text-slate-600 dark:text-dark-text-muted mb-6 leading-relaxed">
                  Вы выбрали тариф <strong>{showPlanModal.name}</strong> ({showPlanModal.price} UZS / {showPlanModal.duration_days} дней).
                  Отправить заявку администратору для выставления счета и активации?
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setShowPlanModal(null)} className="flex-1 bg-slate-100 dark:bg-dark-bg hover:bg-slate-200 dark:hover:bg-dark-bg/60 text-slate-700 dark:text-dark-text-muted font-bold py-3 rounded-xl transition-colors text-sm">
                    Отмена
                  </button>
                  <button onClick={confirmSelectPlan} disabled={selectingPlanId !== null || currentSubData?.pending_request !== null} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {selectingPlanId ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span> : 'Отправить заявку'}
                  </button>
                </div>
                {currentSubData?.pending_request && (
                  <p className="text-center text-xs text-amber-600 mt-4">У вас уже есть активная заявка на рассмотрении.</p>
                )}
              </>
            ) : (
              <div className="text-center pt-2">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-800 dark:text-dark-text-main mb-2">Заявка отправлена!</h3>
                <p className="text-slate-600 dark:text-dark-text-muted mb-6 leading-relaxed">
                  {requestSuccess.message || 'Ваш запрос успешно сформирован. Для завершения оплаты и быстрой активации тарифа, пожалуйста, свяжитесь с нашим администратором:'}
                </p>
                {!requestSuccess.auto_activated && (
                  <a href={requestSuccess.admin_telegram || "https://t.me/akobir_ETA"} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center w-full bg-[#0088cc] hover:bg-[#0077b3] text-white font-bold py-3.5 rounded-xl transition-colors text-sm mb-3 gap-2">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.896-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.892-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                    Написать в Telegram
                  </a>
                )}
                <button onClick={() => { setShowPlanModal(null); setRequestSuccess(null); }} className="w-full bg-slate-100 dark:bg-dark-bg hover:bg-slate-200 dark:hover:bg-dark-bg/60 text-slate-700 dark:text-dark-text-muted font-bold py-3 rounded-xl transition-colors text-sm">
                  Закрыть
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
