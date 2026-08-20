import { useState } from 'react';
import { Users, BookOpen, Layers, CreditCard } from 'lucide-react';
import UsersTab from './admin/UsersTab';
import CatalogSection from './admin/CatalogSection';
import BillingTab from './admin/BillingTab';
import PaymentsTab from './admin/PaymentsTab';

type Tab = 'users' | 'catalog' | 'billing' | 'payments';

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'users', label: 'Пользователи', icon: Users },
  { key: 'catalog', label: 'Каталог', icon: Layers },
  { key: 'billing', label: 'Тарифы', icon: BookOpen },
  { key: 'payments', label: 'Платежи', icon: CreditCard },
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>('users');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-8 font-body relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-violet-200/40 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Панель Администратора</h1>
          <p className="text-slate-500 mt-1 font-medium">Управление платформой и контентом</p>
        </div>

        {/* Tab Nav */}
        <div className="flex bg-white p-1.5 rounded-2xl w-full border border-slate-200 overflow-x-auto whitespace-nowrap hide-scrollbar">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-none px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                activeTab === key ? 'bg-violet-600 text-white' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-2">
          {activeTab === 'users'    && <UsersTab />}
          {activeTab === 'catalog'  && <CatalogSection />}
          {activeTab === 'billing'  && <BillingTab />}
          {activeTab === 'payments' && <PaymentsTab />}
        </div>
      </div>
    </div>
  );
}
