import { useState, useCallback } from 'react';
import type { ToastOptions } from '@/types';
import { generateId } from '@/lib/utils';

interface Toast extends ToastOptions {
  id: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(({ message, type = 'info', duration = 3000 }: ToastOptions) => {
    const id = generateId();
    const newToast: Toast = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    toast,
    dismiss,
    dismissAll,
    success: (message: string, duration?: number) => toast({ message, type: 'success', duration }),
    error: (message: string, duration?: number) => toast({ message, type: 'error', duration }),
    info: (message: string, duration?: number) => toast({ message, type: 'info', duration }),
    warning: (message: string, duration?: number) => toast({ message, type: 'warning', duration }),
  };
}
