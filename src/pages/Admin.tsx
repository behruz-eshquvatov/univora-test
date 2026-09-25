import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, Layers, CreditCard, BellRing, Sparkles } from 'lucide-react';
import UsersTab from './admin/UsersTab';
import CatalogSection from './admin/CatalogSection';
import BillingTab from './admin/BillingTab';
import PaymentsTab from './admin/PaymentsTab';
import AnnouncementsTab from './admin/AnnouncementsTab';
import AdminIntroQuestionsTab from './admin/AdminIntroQuestionsTab';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';

type Tab = 'users' | 'catalog' | 'billing' | 'payments' | 'announcements' | 'intro';

export default function Admin() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('users');

  useEffect(() => {
    // If user is loaded and not admin/staff, redirect to dashboard
    if (user && user.role !== 'admin' && !(user as any).is_staff && !(user as any).is_superuser) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);
  
  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'users', label: t('admin.tab_users'), icon: Users },
    { key: 'intro', label: 'Kirish savollari', icon: Sparkles },
    { key: 'catalog', label: t('admin.tab_catalog'), icon: Layers },
    { key: 'billing', label: t('admin.tab_billing'), icon: BookOpen },
    { key: 'payments', label: t('admin.tab_payments'), icon: CreditCard },
    { key: 'announcements', label: t('admin.tab_announcements'), icon: BellRing },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-8 font-body relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-violet-200/40 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">{t('admin.title')}</h1>
          <p className="text-slate-500 mt-1 font-medium">{t('admin.subtitle')}</p>
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
          {activeTab === 'intro'    && <AdminIntroQuestionsTab />}
          {activeTab === 'catalog'  && <CatalogSection />}
          {activeTab === 'billing'  && <BillingTab />}
          {activeTab === 'payments' && <PaymentsTab />}
          {activeTab === 'announcements' && <AnnouncementsTab />}
        </div>
      </div>
    </div>
  );
}
