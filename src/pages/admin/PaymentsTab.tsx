import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { billingApi } from '../../lib/api/billing';
import type { Payment } from '../../lib/api/billing';

export default function PaymentsTab() {
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    billingApi.getPayments().then(setPayments).catch(console.error);
  }, []);

  const handleApprove = async (id: number) => {
    try {
      await billingApi.approvePayment(id);
      setPayments(cur => cur.map(p => p.id === id ? { ...p, status: 'approved' } : p));
    } catch (err) { console.error(err); }
  };

  const handleReject = async (id: number) => {
    try {
      await billingApi.rejectPayment(id);
      setPayments(cur => cur.map(p => p.id === id ? { ...p, status: 'rejected' } : p));
    } catch (err) { console.error(err); }
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
              {['ID', 'User ID', 'Сумма', 'Дата', 'Статус', 'Действия'].map(h => (
                <th key={h} className="p-4 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payments.length > 0 ? payments.map(p => (
              <tr key={p.id} className="border-b border-slate-100 last:border-none hover:bg-slate-50">
                <td className="p-4 text-slate-500">#{p.id}</td>
                <td className="p-4 font-bold text-slate-900">User {p.user}</td>
                <td className="p-4 font-medium">{p.amount} UZS</td>
                <td className="p-4 text-sm text-slate-500">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    p.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                    p.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                    'bg-amber-50 text-amber-600 border-amber-200'
                  }`}>
                    {p.status === 'approved' ? 'Одобрен' : p.status === 'rejected' ? 'Отклонён' : 'Ожидает'}
                  </span>
                </td>
                <td className="p-4">
                  {p.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(p.id)} className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg">
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleReject(p.id)} className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">Нет заявок</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
