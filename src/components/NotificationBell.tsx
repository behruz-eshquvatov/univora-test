import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { notificationsApi } from '../lib/api/notifications';


export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const data = await notificationsApi.getUnreadCount();
      setUnreadCount(data.unread_count);
    } catch (err) {
      console.error('Failed to fetch unread count', err);
    }
  };

  return (
    <Link 
      to="/notifications"
      className="relative p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border text-slate-400 hover:text-violet-600 dark:text-dark-text-muted dark:hover:text-violet-400 transition-colors block"
      onClick={(e) => e.stopPropagation()} // Prevent triggering parent clicks
    >
      <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-dark-surface animate-pulse" />
      )}
    </Link>
  );
}
