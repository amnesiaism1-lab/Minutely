import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (title: string, description?: string, duration?: number) => void;
    error: (title: string, description?: string, duration?: number) => void;
    info: (title: string, description?: string, duration?: number) => void;
  };
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, title: string, description?: string, duration: number = 3500) => {
      const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      setToasts((prev) => [...prev, { id, type, title, description, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toast = {
    success: (title: string, description?: string, duration?: number) =>
      addToast('success', title, description, duration),
    error: (title: string, description?: string, duration?: number) =>
      addToast('error', title, description, duration),
    info: (title: string, description?: string, duration?: number) =>
      addToast('info', title, description, duration),
  };

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}

      {/* Floating Toasts Viewport */}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 ${
              t.type === 'success'
                ? 'bg-white/95 border-emerald-200 text-slate-800'
                : t.type === 'error'
                ? 'bg-white/95 border-rose-200 text-slate-800'
                : 'bg-white/95 border-slate-200 text-slate-800'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              {t.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600" />}
              {t.type === 'info' && <Info className="w-4 h-4 text-sky-600" />}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <p className="text-xs font-semibold text-slate-900 leading-snug">{t.title}</p>
              {t.description && (
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  {t.description}
                </p>
              )}
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors cursor-pointer"
              aria-label="Đóng thông báo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Graceful fallback if invoked outside ToastProvider
    return {
      toast: {
        success: (title: string, desc?: string) => console.log('[Toast success]', title, desc),
        error: (title: string, desc?: string) => console.error('[Toast error]', title, desc),
        info: (title: string, desc?: string) => console.info('[Toast info]', title, desc),
      },
      removeToast: () => {},
    };
  }
  return ctx;
};
