import { useState, useEffect } from 'react';
import { Send, CheckCircle2, Clock, Users } from 'lucide-react';
import { notificationsApi, type Announcement } from '../../lib/api/notifications';

export default function AnnouncementsTab() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  useEffect(() => {
    // Poll every 3 seconds if there are any announcements that are still sending
    const hasPending = announcements.some(a => !a.is_sent);
    if (!hasPending) return;

    const interval = setInterval(loadAnnouncements, 3000);
    return () => clearInterval(interval);
  }, [announcements]);

  const loadAnnouncements = async () => {
    try {
      const data = await notificationsApi.getAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error('Failed to load announcements', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      const newAnnouncement = await notificationsApi.createAnnouncement({ title, message });
      setAnnouncements([newAnnouncement, ...announcements]);
      setTitle('');
      setMessage('');
    } catch (err) {
      console.error('Failed to send announcement', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Announcement */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Создать анонс</h2>
          <p className="text-slate-500 text-sm">Отправить уведомление всем активным студентам платформы.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Заголовок</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Например: Важное обновление платформы"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all outline-none"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Текст сообщения</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Текст уведомления..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all outline-none resize-y"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !title.trim() || !message.trim()}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            Отправить всем
          </button>
        </form>
      </div>

      {/* History */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">История анонсов</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                <th className="p-4 font-semibold">Заголовок</th>
                <th className="p-4 font-semibold">Дата создания</th>
                <th className="p-4 font-semibold">Автор</th>
                <th className="p-4 font-semibold">Статус</th>
              </tr>
            </thead>
            <tbody>
              {announcements.length > 0 ? announcements.map(a => (
                <tr key={a.id} className="border-b border-slate-100 last:border-none hover:bg-slate-50">
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{a.title}</div>
                    <div className="text-sm text-slate-500 truncate max-w-xs" title={a.message}>{a.message}</div>
                  </td>
                  <td className="p-4 text-sm text-slate-500">{new Date(a.created_at).toLocaleString()}</td>
                  <td className="p-4 text-sm text-slate-700">{a.created_by_email}</td>
                  <td className="p-4">
                    {a.is_sent ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Отправлено ({a.recipients_count})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">
                        <Clock className="w-3.5 h-3.5" />
                        Отправляется...
                      </span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="p-8 text-center text-slate-400">История анонсов пуста</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
