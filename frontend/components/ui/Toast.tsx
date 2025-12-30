'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Toast store (simple implementation without external dependencies)
type ToastListener = (toasts: Toast[]) => void;

class ToastStore {
  private toasts: Toast[] = [];
  private listeners: Set<ToastListener> = new Set();

  subscribe(listener: ToastListener) {
    this.listeners.add(listener);
    listener(this.toasts);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.toasts));
  }

  add(toast: Omit<Toast, 'id'>) {
    const id = Math.random().toString(36).slice(2, 11);
    const newToast: Toast = { ...toast, id };
    this.toasts = [...this.toasts, newToast];
    this.notify();

    // Auto-remove after duration
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }

    return id;
  }

  remove(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  clear() {
    this.toasts = [];
    this.notify();
  }
}

export const toastStore = new ToastStore();

// Helper functions
export const toast = {
  success: (title: string, message?: string, options?: Partial<Toast>) =>
    toastStore.add({ type: 'success', title, message, ...options }),
  error: (title: string, message?: string, options?: Partial<Toast>) =>
    toastStore.add({ type: 'error', title, message, ...options }),
  warning: (title: string, message?: string, options?: Partial<Toast>) =>
    toastStore.add({ type: 'warning', title, message, ...options }),
  info: (title: string, message?: string, options?: Partial<Toast>) =>
    toastStore.add({ type: 'info', title, message, ...options }),
  dismiss: (id: string) => toastStore.remove(id),
  clear: () => toastStore.clear(),
};

// Icon and color mappings
const icons: Record<ToastType, LucideIcon> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors: Record<ToastType, string> = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-sky-50 border-sky-200 text-sky-800',
};

const iconColors: Record<ToastType, string> = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-sky-500',
};

// Toast Item Component
function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const Icon = icons[t.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg min-w-[320px] max-w-[420px]',
        colors[t.type]
      )}
      role="alert"
      aria-live={t.type === 'error' ? 'assertive' : 'polite'}
    >
      <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', iconColors[t.type])} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{t.title}</p>
        {t.message && (
          <p className="text-sm mt-0.5 opacity-90">{t.message}</p>
        )}
        {t.action && (
          <button
            onClick={t.action.onClick}
            className="mt-2 text-sm font-medium underline underline-offset-2 hover:no-underline"
          >
            {t.action.label}
          </button>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 p-0.5 rounded hover:bg-black/5 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// Toast Container Component
export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return toastStore.subscribe(setToasts);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastItem
            key={t.id}
            toast={t}
            onDismiss={() => toastStore.remove(t.id)}
          />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}

// Hook for using toast
export function useToast() {
  return toast;
}
