import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration: number;
  actionLabel?: string;
  onAction?: () => void;
}

type ToastMethod = (
  title: string,
  description?: string,
  durationOrOptions?: number | ToastOptions
) => void;

interface ToastContextType {
  toast: {
    success: ToastMethod;
    error: ToastMethod;
    warning: ToastMethod;
    info: ToastMethod;
  };
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const ToastCard: React.FC<{
  item: ToastItem;
  onRemove: (id: string) => void;
}> = ({ item, onRemove }) => {
  const timerRef = useRef<number | null>(null);
  const remainingRef = useRef<number>(item.duration);
  const startTimeRef = useRef<number>(Date.now());

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = useCallback(
    (ms: number) => {
      if (ms <= 0) return;
      clearTimer();
      startTimeRef.current = Date.now();
      timerRef.current = window.setTimeout(() => {
        onRemove(item.id);
      }, ms);
    },
    [item.id, onRemove]
  );

  useEffect(() => {
    startTimer(remainingRef.current);
    return clearTimer;
  }, [startTimer]);

  const handleMouseEnter = () => {
    if (remainingRef.current <= 0) return;
    const elapsed = Date.now() - startTimeRef.current;
    remainingRef.current = Math.max(400, remainingRef.current - elapsed);
    clearTimer();
  };

  const handleMouseLeave = () => {
    if (item.duration > 0) {
      startTimer(remainingRef.current);
    }
  };

  const styleMap: Record<
    ToastType,
    { border: string; iconBg: string; icon: React.ReactNode }
  > = {
    success: {
      border: 'border-emerald-200/90',
      iconBg: 'bg-emerald-50 text-emerald-600',
      icon: <CheckCircle2 className="h-4 w-4" strokeWidth={2} />,
    },
    error: {
      border: 'border-rose-200/90',
      iconBg: 'bg-rose-50 text-rose-600',
      icon: <AlertCircle className="h-4 w-4" strokeWidth={2} />,
    },
    warning: {
      border: 'border-amber-200/90',
      iconBg: 'bg-amber-50 text-amber-600',
      icon: <AlertTriangle className="h-4 w-4" strokeWidth={2} />,
    },
    info: {
      border: 'border-slate-200/90',
      iconBg: 'bg-sky-50 text-sky-600',
      icon: <Info className="h-4 w-4" strokeWidth={2} />,
    },
  };

  const visual = styleMap[item.type];

  return (
    <div
      role={item.type === 'error' ? 'alert' : 'status'}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`pointer-events-auto animate-toast-enter flex items-start gap-3 rounded-xl border bg-white/95 p-3.5 text-slate-800 shadow-[0_10px_28px_-6px_rgba(15,23,42,0.14)] backdrop-blur-md ${visual.border}`}
    >
      <div
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${visual.iconBg}`}
      >
        {visual.icon}
      </div>

      <div className="min-w-0 flex-1 pr-1">
        <p className="text-xs font-semibold leading-snug text-slate-900">{item.title}</p>
        {item.description && (
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
            {item.description}
          </p>
        )}
        {item.actionLabel && item.onAction && (
          <button
            type="button"
            onClick={() => {
              item.onAction?.();
              onRemove(item.id);
            }}
            className="mt-1.5 inline-flex cursor-pointer items-center text-[11px] font-semibold text-slate-900 underline underline-offset-2 hover:text-slate-700"
          >
            {item.actionLabel}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="shrink-0 cursor-pointer rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        aria-label="Đóng thông báo"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (
      type: ToastType,
      title: string,
      description?: string,
      durationOrOptions?: number | ToastOptions
    ) => {
      const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      const opts: ToastOptions =
        typeof durationOrOptions === 'number'
          ? { duration: durationOrOptions }
          : durationOrOptions || {};
      const duration = opts.duration ?? 3800;

      setToasts((prev) => {
        const next = [
          ...prev,
          {
            id,
            type,
            title,
            description,
            duration,
            actionLabel: opts.actionLabel,
            onAction: opts.onAction,
          },
        ];
        return next.slice(-4);
      });
    },
    []
  );

  const toast = {
    success: (title: string, description?: string, opts?: number | ToastOptions) =>
      addToast('success', title, description, opts),
    error: (title: string, description?: string, opts?: number | ToastOptions) =>
      addToast('error', title, description, opts),
    warning: (title: string, description?: string, opts?: number | ToastOptions) =>
      addToast('warning', title, description, opts),
    info: (title: string, description?: string, opts?: number | ToastOptions) =>
      addToast('info', title, description, opts),
  };

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}

      {/* Floating Toasts Viewport */}
      <div
        className="no-print pointer-events-none fixed bottom-4 right-4 z-[70] flex w-full max-w-sm flex-col gap-2 pl-4 sm:pl-0"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} item={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toast: {
        success: (title: string, desc?: string) => console.log('[Toast success]', title, desc),
        error: (title: string, desc?: string) => console.error('[Toast error]', title, desc),
        warning: (title: string, desc?: string) => console.warn('[Toast warning]', title, desc),
        info: (title: string, desc?: string) => console.info('[Toast info]', title, desc),
      },
      removeToast: () => {},
    };
  }
  return ctx;
};
