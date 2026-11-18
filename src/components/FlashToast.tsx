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
      className="fixed top-4 sm:top-5 inset-x-0 z-50 flex justify-center px-4 pointer-events-none"
    >
      <div
        className={`max-w-full px-4 sm:px-5 py-2.5 rounded-full font-mono font-bold text-[11px] sm:text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 border animate-toast-in ${
          toast.isBad
            ? 'bg-vermilion text-surface border-vermilion-hover'
            : 'bg-ink text-surface border-ink'
        }`}
      >
        {toast.isBad ? (
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <Check className="w-3.5 h-3.5 text-vermilion shrink-0" />
        )}
        <span className="truncate">{toast.message}</span>
      </div>
    </div>
  );
};
