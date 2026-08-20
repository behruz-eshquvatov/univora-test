import { AlertTriangle } from 'lucide-react';
import { BTN_CANCEL, BTN_DELETE } from './constants';

interface Props {
  title: string;
  body: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ title, body, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-3xl p-7 w-full max-w-sm text-center">
        <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-rose-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">{title}</h2>
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">{body}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className={BTN_CANCEL}>Отмена</button>
          <button onClick={onConfirm} className={BTN_DELETE}>Удалить</button>
        </div>
      </div>
    </div>
  );
}
