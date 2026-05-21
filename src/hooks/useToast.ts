import { useCallback } from 'react';
import { create } from 'zustand';
import type { ToastOptions } from '@/types';
import { generateId } from '@/lib/utils';

interface Toast extends ToastOptions {
  id: string;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Toast) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

// Global Zustand store — shared across all components so ToastContainer
// always reflects toasts added anywhere in the tree.
const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => set((state) => ({ toasts: [...state.toasts, toast] })),
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  clearToasts: () => set({ toasts: [] }),
}));

export function useToast() {
  const { toasts, addToast, removeToast, clearToasts } = useToastStore();

  const toast = useCallback(({ message, type = 'info', duration = 3000 }: ToastOptions) => {
    const id = generateId();
    const newToast: Toast = { id, message, type, duration };

    addToast(newToast);

    // Auto-dismiss
    if (duration) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [addToast, removeToast]);

  const dismiss = useCallback((id: string) => {
    removeToast(id);
  }, [removeToast]);

  const dismissAll = useCallback(() => {
    clearToasts();
  }, [clearToasts]);

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
