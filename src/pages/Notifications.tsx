import { useState, useEffect } from 'react';
import { CheckCircle2, Bell } from 'lucide-react';
import { notificationsApi, type NotificationLog } from '../lib/api/notifications';

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    markAsRead();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await notificationsApi.getMyNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
    } catch (err) {
      console.error('Failed to mark notifications as read', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full pb-20">
      <div className="hidden md:block mb-6">
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-dark-text-main flex items-center gap-3">
          <Bell className="w-6 h-6 text-violet-600" />
          Уведомления
        </h1>
        <p className="text-slate-500 dark:text-dark-text-muted mt-1">
          Здесь хранятся все важные обновления и анонсы.
        </p>
      </div>

      <div className="bg-white dark:bg-dark-surface sm:rounded-3xl sm:border border-slate-200 dark:border-dark-border overflow-hidden -mx-4 sm:mx-0">
        {isLoading ? (
          <div className="p-12 text-center">
            <span className="w-8 h-8 border-4 border-slate-200 border-t-violet-600 rounded-full animate-spin inline-block" />
          </div>
        ) : notifications.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-dark-border">
            {notifications.map(n => (
              <div 
                key={n.id} 
                className={`p-4 sm:p-6 flex gap-3 sm:gap-4 transition-colors ${
                  !n.is_read ? 'bg-violet-50/50 dark:bg-violet-900/10' : 'hover:bg-slate-50 dark:hover:bg-dark-border/30'
                }`}
              >
                <div className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${!n.is_read ? 'bg-violet-500' : 'bg-transparent'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-slate-900 dark:text-dark-text-main font-medium leading-relaxed">
                    {n.message}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-3 text-sm text-slate-500 dark:text-dark-text-muted">
                    <span>{new Date(n.created_at).toLocaleString()}</span>
                    {n.type_display && (
                      <>
                        <span>&bull;</span>
                        <span className="text-violet-600 dark:text-violet-400 font-bold">{n.type_display}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-dark-border/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-dark-text-main mb-1">
              Нет новых уведомлений
            </h3>
            <p className="text-slate-500 dark:text-dark-text-muted">
              У вас пока нет истории уведомлений.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
