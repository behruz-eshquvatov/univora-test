import { Search, MoreVertical } from 'lucide-react';
import { mockStudents } from './constants';

export default function UsersTab() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-900">Список студентов (Демо)</h2>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Поиск..." className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl w-64 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
              {['Студент', 'Тесты', 'Средний балл', 'Статус', 'Активность', ''].map(h => (
                <th key={h} className="p-4 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockStudents.map(s => (
              <tr key={s.id} className="border-b border-slate-100 last:border-none hover:bg-slate-50 transition-colors">
                <td className="p-4">
                  <p className="font-bold text-slate-900">{s.name}</p>
                  <p className="text-sm text-slate-500">{s.email}</p>
                </td>
                <td className="p-4 font-medium text-slate-700">{s.testsCompleted}</td>
                <td className="p-4 font-medium text-slate-700">{s.avgScore}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    s.status === 'Активен' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'
                  }`}>{s.status}</span>
                </td>
                <td className="p-4 text-sm text-slate-500">{s.lastActive}</td>
                <td className="p-4 text-right">
                  <button className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
