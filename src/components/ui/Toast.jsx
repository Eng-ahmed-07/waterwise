import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { ar } from '@/locales/ar';
import { AlertIcon, CheckIcon, CloseIcon, InfoIcon } from './Icons';

// Each variant has a different icon AND an accent bar, so meaning never relies on colour alone.
const VARIANTS = {
  success: { Icon: CheckIcon, box: 'border-secondary-700 bg-secondary-50 text-secondary-900', icon: 'text-secondary-700' },
  error: { Icon: AlertIcon, box: 'border-danger-600 bg-danger-50 text-danger-700', icon: 'text-danger-700' },
  info: { Icon: InfoIcon, box: 'border-primary-600 bg-primary-50 text-primary-900', icon: 'text-primary-700' },
};

/** One notification. Auto-dismisses after `duration` ms (null = stays until closed). Pauses on hover and focus. */
export function Toast({ toast, onDismiss }) {
  const { id, variant, message, duration } = toast;
  const [paused, setPaused] = useState(false);
  const { Icon, box, icon } = VARIANTS[variant];

  useEffect(() => {
    if (duration == null || paused) return undefined;
    const timer = setTimeout(() => onDismiss(id), duration);
    return () => clearTimeout(timer);
  }, [duration, paused, id, onDismiss]);

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn('pointer-events-auto flex items-start gap-3 rounded-control border border-s-4 p-3.5 shadow-pop', box)}
    >
      <Icon className={cn('mt-0.5 size-5 shrink-0', icon)} />
      <p className="min-w-0 flex-1 text-sm font-medium">{message}</p>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        aria-label={ar.toast.dismiss}
        className="-m-1 inline-flex size-8 shrink-0 items-center justify-center rounded-lg hover:bg-ink/10"
      >
        <CloseIcon className="size-4" />
      </button>
    </div>
  );
}

/** Fixed stack of toasts. Top of the screen so it never collides with the mobile bottom tab bar. */
export function ToastViewport({ toasts, onDismiss }) {
  return (
    <div
      role="region"
      aria-label={ar.toast.region}
      className="pointer-events-none fixed inset-x-4 top-4 z-50 flex flex-col gap-3 sm:inset-x-auto sm:end-4 sm:w-96"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
