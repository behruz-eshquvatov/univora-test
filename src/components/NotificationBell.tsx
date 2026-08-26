import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import { notificationsApi, type NotificationLog } from '../lib/api/notifications';

interface NotificationBellProps {
  direction?: 'up' | 'down';
}

export default function NotificationBell({ direction = 'down' }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial fetch of unread count
    fetchUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Close popover when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const fetchUnreadCount = async () => {
    try {
      const data = await notificationsApi.getUnreadCount();
      setUnreadCount(data.unread_count);
    } catch (err) {
      console.error('Failed to fetch unread count', err);
    }
  };

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await notificationsApi.getMyNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePopover = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      setIsOpen(true);
      await fetchNotifications();
      // If there are unread notifications, mark them as read after opening
      if (unreadCount > 0) {
        try {
          await notificationsApi.markAllAsRead();
          setUnreadCount(0);
          // Update local state to reflect read status
          setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (err) {
          console.error('Failed to mark notifications as read', err);
        }
      }
    } else {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button 
        onClick={togglePopover}
        className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border text-slate-400 hover:text-violet-600 dark:text-dark-text-muted dark:hover:text-violet-400 transition-colors relative"
      >
        <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-dark-surface animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className={`absolute w-80 sm:w-96 bg-white dark:bg-dark-surface rounded-2xl shadow-xl border border-slate-200 dark:border-dark-border z-50 animate-in fade-in duration-200 ${
          direction === 'up' 
            ? 'bottom-[calc(100%+8px)] -right-4 sm:right-0 slide-in-from-bottom-2' 
            : 'top-full mt-2 -right-4 sm:right-0 slide-in-from-top-2'
        }`}>
          <div className="p-4 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-dark-text-main">Уведомления</h3>
            {unreadCount > 0 && (
              <span className="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs font-bold px-2 py-1 rounded-full">
                {unreadCount} новых
              </span>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto p-2">
            {isLoading ? (
              <div className="p-8 text-center text-slate-400 dark:text-dark-text-muted">
                <span className="w-6 h-6 border-2 border-slate-200 border-t-violet-600 rounded-full animate-spin inline-block" />
              </div>
            ) : notifications.length > 0 ? (
              <div className="space-y-1">
                {notifications.map(n => (
                  <div 
                    key={n.id} 
                    className={`p-3 rounded-xl flex gap-3 transition-colors ${
                      !n.is_read ? 'bg-violet-50 dark:bg-violet-900/10' : 'hover:bg-slate-50 dark:hover:bg-dark-border/30'
                    }`}
                  >
                    <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${!n.is_read ? 'bg-violet-500' : 'bg-transparent'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-dark-text-main mb-1">
                        {n.message}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-dark-text-muted">
                        <span>{new Date(n.created_at).toLocaleString()}</span>
                        {n.type_display && (
                          <>
                            <span>&bull;</span>
                            <span className="text-violet-600 dark:text-violet-400 font-medium">{n.type_display}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-slate-50 dark:bg-dark-border/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-slate-500 dark:text-dark-text-muted font-medium">Нет новых уведомлений</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
