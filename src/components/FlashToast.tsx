import React from 'react';
import { Check, AlertCircle } from 'lucide-react';

export interface ToastData {
  message: string;
  isBad?: boolean;
}

export const FlashToast: React.FC<{ toast: ToastData | null }> = ({ toast }) => {
  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full font-mono font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 pointer-events-none animate-bounce-subtle ${
        toast.isBad
          ? 'bg-vermilion text-surface'
          : 'bg-ink text-surface'
      }`}
    >
      {toast.isBad ? <AlertCircle className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5 text-vermilion" />}
      <span>{toast.message}</span>
    </div>
  );
};
