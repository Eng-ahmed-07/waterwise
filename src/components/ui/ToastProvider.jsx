import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ToastViewport } from './Toast';

const ToastContext = createContext(null);

// Success and info fade on their own. Errors stay until closed (people need time to read and act).
const DEFAULT_DURATION = { success: 5000, info: 5000, error: null };

let nextId = 0;

/**
 * Usage:
 *   const toast = useToast();
 *   toast.success('تم الحفظ');   toast.error('تعذّر الحفظ');   toast.info('...');
 * Options: { duration: ms | null }.
 */
export function ToastProvider({ children, maxVisible = 4 }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (variant, message, { duration } = {}) => {
      nextId += 1;
      const toast = { id: nextId, variant, message, duration: duration === undefined ? DEFAULT_DURATION[variant] : duration };
      setToasts((current) => [...current, toast].slice(-maxVisible));
      return toast.id;
    },
    [maxVisible],
  );

  const api = useMemo(
    () => ({
      success: (message, options) => push('success', message, options),
      error: (message, options) => push('error', message, options),
      info: (message, options) => push('info', message, options),
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>.');
  return context;
}
