import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import MobileBottomNav from './MobileBottomNav';
import { useAuthStore } from '../store/useAuthStore';

export default function DashboardLayout() {
  const { fetchUser, fetchStreak, fetchXpSummary } = useAuthStore();

  useEffect(() => {
    fetchUser();
    fetchStreak();
    fetchXpSummary();
  }, [fetchUser, fetchStreak, fetchXpSummary]);

  return (
    <div className="min-h-screen bg-transparent flex flex-col md:flex-row relative pt-[72px] md:pt-0 pb-[70px] md:pb-0">
      <MobileHeader />

      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 md:pl-[120px] md:pr-4 md:py-4 transition-all duration-300">
        <Outlet />
      </main>

      <MobileBottomNav />
    </div>
  );
}
