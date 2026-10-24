import React from 'react';

export interface ToastData {
  message: string;
  isBad?: boolean;
}

export const FlashToast: React.FC<{ toast: ToastData | null }> = ({ toast }) => {
  if (!toast) return null;

  return (
    <div
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-6 py-2.5 rounded-xl font-bold text-sm sm:text-base shadow-2xl flex items-center gap-2 pointer-events-none transition-all duration-200 transform animate-bounce-subtle ${
        toast.isBad
          ? 'bg-rose-600 text-white border border-rose-400/50 shadow-rose-600/30'
          : 'bg-emerald-600 text-white border border-emerald-400/50 shadow-emerald-600/30'
      }`}
    >
      <span>{toast.isBad ? '⚠️' : '⚡'}</span>
      <span>{toast.message}</span>
    </div>
  );
};
