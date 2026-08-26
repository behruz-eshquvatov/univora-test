import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { billingApi } from '../../lib/api/billing';
import type { Payment } from '../../lib/api/billing';

export default function PaymentsTab() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [rejectModalId, setRejectModalId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const loadPayments = () => {
    billingApi.getPayments().then(setPayments).catch(console.error);
  };

  useEffect(() => {
    loadPayments();
  }, []);

  useEffect(() => {
    const hasPending = payments.some(p => p.status === 'pending');
    if (!hasPending) return;

    const interval = setInterval(loadPayments, 5000);
    return () => clearInterval(interval);
  }, [payments]);

  const handleApprove = async (id: number) => {
    try {
      await billingApi.approvePayment(id);
      setPayments(cur => cur.map(p => p.id === id ? { ...p, status: 'approved' } : p));
    } catch (err) { console.error(err); }
  };

  const handleRejectClick = (id: number) => {
    setRejectModalId(id);
    setRejectReason('');
  };

  const submitReject = async () => {
    if (rejectModalId === null) return;
    setIsRejecting(true);
    
    try {
      await billingApi.rejectPayment(rejectModalId, rejectReason);
      setPayments(cur => cur.map(p => p.id === rejectModalId ? { ...p, status: 'rejected' } : p));
      setRejectModalId(null);
    } catch (err) { 
      console.error(err); 
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-900">Заявки на оплату</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
              {['ID', 'User ID', 'Сумма', 'Дата', 'Контакты', 'Статус', 'Действия'].map(h => (
                <th key={h} className="p-4 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payments.length > 0 ? payments.map(p => (
              <tr key={p.id} className="border-b border-slate-100 last:border-none hover:bg-slate-50">
                <td className="p-4 text-slate-500">#{p.id}</td>
                <td className="p-4 font-bold text-slate-900">
                  {p.user_full_name || p.user_email || `User ${p.user}`}
                </td>
                <td className="p-4 font-medium">{p.amount_display || `${p.amount} UZS`}</td>
                <td className="p-4 text-sm text-slate-500">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="p-4 text-sm">
                  {p.contact_telegram && (
                    <a href={p.contact_telegram.startsWith('@') ? `https://t.me/${p.contact_telegram.substring(1)}` : p.contact_telegram} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline block">
                      {p.contact_telegram}
                    </a>
                  )}
                  {p.contact_phone && (
                    <span className="text-slate-500 block">{p.contact_phone}</span>
                  )}
                  {!p.contact_telegram && !p.contact_phone && <span className="text-slate-400">-</span>}
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    p.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                    p.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                    'bg-amber-50 text-amber-600 border-amber-200'
                  }`}>
                    {p.status_display || (p.status === 'approved' ? 'Одобрен' : p.status === 'rejected' ? 'Отклонён' : 'Ожидает')}
                  </span>
                </td>
                <td className="p-4">
                  {p.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(p.id)} className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg">
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleRejectClick(p.id)} className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            )) : (
              <tr><td colSpan={7} className="p-8 text-center text-slate-400">Нет заявок</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Reject Modal */}
      {rejectModalId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative border animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setRejectModalId(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Отклонить заявку</h3>
            <p className="text-sm text-slate-500 mb-4">Укажите причину отклонения. Эта информация будет показана пользователю (необязательно).</p>
            
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Например: Некорректный чек, недостаточная сумма..."
              className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all resize-none mb-6"
            />
            
            <div className="flex gap-3">
              <button 
                onClick={() => setRejectModalId(null)} 
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors text-sm"
              >
                Отмена
              </button>
              <button 
                onClick={submitReject} 
                disabled={isRejecting}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl transition-colors text-sm disabled:opacity-50 flex items-center justify-center"
              >
                {isRejecting ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span> : 'Отклонить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
