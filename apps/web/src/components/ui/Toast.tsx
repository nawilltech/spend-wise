'use client';

import { useToastStore } from '@/store/toast.store';

export function ToastContainer() {
  const { toasts, dismiss } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg pointer-events-auto text-white text-sm font-medium ${
            toast.type === 'success' ? 'bg-success' : 'bg-danger'
          }`}
          style={{ animation: 'slideIn 0.2s ease-out' }}
        >
          <span className="text-base flex-shrink-0 mt-px">
            {toast.type === 'success' ? '✓' : '✕'}
          </span>
          <span className="flex-1 leading-snug">{toast.message}</span>
          <button
            onClick={() => dismiss(toast.id)}
            className="text-white/70 hover:text-white leading-none text-lg flex-shrink-0 ml-1"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
