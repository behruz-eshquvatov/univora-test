import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { 
  CheckCircle2,
  AlertCircle,
  History,
  XCircle
} from 'lucide-react';
import { billingApi, type Payment } from '../lib/api/billing';



const PaymentHistorySection = () => {
  const [payments, setPayments] = useState<Payment[]>([]);

  React.useEffect(() => {
    billingApi.getPayments().then(setPayments).catch(console.error);
  }, []);

  return (
    <div className="bg-white dark:bg-dark-surface rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-dark-border h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h3 className="font-extrabold text-slate-800 dark:text-dark-text-main text-xl">История платежей</h3>
        <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-dark-bg flex items-center justify-center">
          <History className="w-5 h-5 text-slate-400 dark:text-dark-text-muted" />
        </div>
      </div>
      <div className="bg-slate-50 dark:bg-dark-bg rounded-2xl border border-slate-100 dark:border-dark-border overflow-hidden">
        {payments.length > 0 ? payments.map(payment => (
          <div key={payment.id} className="p-4 border-b border-slate-100 dark:border-dark-border last:border-0 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800 dark:text-dark-text-main">{payment.amount} UZS</p>
              <p className="text-xs text-slate-500 dark:text-dark-text-muted font-medium mt-0.5">{new Date(payment.created_at).toLocaleString()}</p>
            </div>
            {payment.status === 'approved' ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-100 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
                <CheckCircle2 className="w-3 h-3" /> Оплачено
              </span>
            ) : payment.status === 'pending' ? (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-bold bg-amber-100 dark:bg-amber-950/20 px-2.5 py-1 rounded-lg">
                <AlertCircle className="w-3 h-3" /> Ожидает
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 text-xs font-bold bg-rose-100 dark:bg-rose-950/20 px-2.5 py-1 rounded-lg">
                <AlertCircle className="w-3 h-3" /> Отклонено
              </span>
            )}
          </div>
        )) : (
          <div className="p-6 text-center text-slate-500 dark:text-dark-text-muted font-medium text-sm">Нет истории платежей</div>
        )}
      </div>
    </div>
  );
};

const ProfileSection = () => {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    name: user?.full_name || user?.name || '',
    bio: '',
    avatar: user?.avatar || user?.avatar_url || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Профиль обновлен! (Функционал в разработке)');
  };

  return (
    <div className="bg-white dark:bg-dark-surface rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-dark-border h-full flex flex-col">
      <div className="mb-8">
        <h3 className="font-extrabold text-slate-800 dark:text-dark-text-main text-xl">Настройки профиля</h3>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 flex-1">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-dark-bg flex items-center justify-center overflow-hidden shrink-0">
            {formData.avatar ? (
              <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-slate-400 dark:text-dark-text-muted">
                {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
              </span>
            )}
          </div>
          <div>
            <button type="button" className="px-4 py-2 bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 rounded-xl font-bold text-sm hover:bg-violet-100 dark:hover:bg-violet-950/40 transition-colors">
              Загрузить фото
            </button>
            <p className="text-xs text-slate-500 dark:text-dark-text-muted mt-2 font-medium">JPG, PNG или GIF. Макс. 2 MB.</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-dark-text-muted mb-2">Имя и фамилия</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-dark-text-main transition-all font-medium"
            placeholder="Иван Иванов"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-dark-text-muted mb-2">Биография</label>
          <textarea
            value={formData.bio}
            onChange={e => setFormData({ ...formData, bio: e.target.value })}
            rows={4}
            className="w-full bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-dark-text-main transition-all font-medium resize-none"
            placeholder="Расскажите немного о себе..."
          />
        </div>

        <div className="pt-4 mt-auto border-t border-slate-100 dark:border-dark-border">
          <button type="submit" className="w-full sm:w-auto px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-colors text-sm">
            Сохранить изменения
          </button>
        </div>
      </form>
    </div>
  );
};

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'profile' | 'payments';
}

export default function SettingsModal({ isOpen, onClose, initialTab = 'profile' }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'payments'>(initialTab);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-slate-50 dark:bg-dark-surface rounded-[2rem] w-full max-w-5xl h-[85vh] sm:h-[80vh] flex flex-col md:flex-row overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        <button 
          onClick={onClose}
          className="md:hidden absolute top-4 right-4 z-50 p-2 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md rounded-full text-slate-500 dark:text-dark-text-muted shadow-sm"
        >
          <XCircle className="w-6 h-6" />
        </button>

        {/* Sidebar */}
        <div className="w-full md:w-64 bg-white dark:bg-dark-surface border-r border-slate-100 dark:border-dark-border shrink-0 flex flex-col p-4 sm:p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-slate-800 dark:text-dark-text-main">Настройки</h2>
            <button onClick={onClose} className="hidden md:flex text-slate-400 dark:text-dark-text-muted hover:text-slate-700 dark:hover:text-dark-text-main transition-colors">
              <XCircle className="w-6 h-6" />
            </button>
          </div>
          
          <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-4 md:pb-0 hide-scrollbar">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap md:whitespace-normal ${
                activeTab === 'profile' 
                  ? 'bg-violet-50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-400 shadow-sm' 
                  : 'text-slate-600 dark:text-dark-text-muted hover:bg-slate-50 dark:hover:bg-dark-bg hover:text-slate-900 dark:hover:text-dark-text-main'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${activeTab === 'profile' ? 'bg-violet-200/50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400' : 'bg-slate-100 dark:bg-dark-bg text-slate-500 dark:text-dark-text-muted'}`}>
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              Профиль
            </button>


            <button
              onClick={() => setActiveTab('payments')}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap md:whitespace-normal ${
                activeTab === 'payments' 
                  ? 'bg-violet-50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-400 shadow-sm' 
                  : 'text-slate-600 dark:text-dark-text-muted hover:bg-slate-50 dark:hover:bg-dark-bg hover:text-slate-900 dark:hover:text-dark-text-main'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${activeTab === 'payments' ? 'bg-violet-200/50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400' : 'bg-slate-100 dark:bg-dark-bg text-slate-500 dark:text-dark-text-muted'}`}>
                 <History className="w-4 h-4" />
              </div>
              История платежей
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-slate-50/50 dark:bg-dark-bg/60 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="max-w-3xl mx-auto h-full">
            {activeTab === 'profile' && <ProfileSection />}
            {activeTab === 'payments' && <PaymentHistorySection />}
          </div>
        </div>
      </div>
    </div>
  );
}
