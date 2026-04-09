'use client';

import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { Toast } from '@/hooks/useToast';
import clsx from 'clsx';

const ICONS = {
  success: <CheckCircle size={16} />,
  error:   <XCircle size={16} />,
  info:    <Info size={16} />,
};

const STYLES = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error:   'bg-red-50 border-red-200 text-red-800',
  info:    'bg-blue-50 border-blue-200 text-blue-800',
};

interface Props {
  toasts: Toast[];
  dismiss: (id: number) => void;
}

export default function ToastList({ toasts, dismiss }: Props) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={clsx(
            'flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium pointer-events-auto',
            'animate-in slide-in-from-right-4 fade-in duration-200',
            STYLES[t.type]
          )}
        >
          <span className="shrink-0">{ICONS[t.type]}</span>
          <span className="flex-1">{t.message}</span>
          <button onClick={() => dismiss(t.id)} className="shrink-0 opacity-60 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
