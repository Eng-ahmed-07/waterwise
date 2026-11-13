import { cn } from '@/lib/cn';
import { SpinnerIcon } from './Icons';

const VARIANTS = {
  // White on primary-600 is 4.58:1 (AA). Never use white text on secondary.
  primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800',
  secondary: 'border border-line-strong bg-surface text-ink hover:border-primary-600 hover:bg-primary-50',
  ghost: 'text-primary-700 hover:bg-primary-100 active:bg-primary-200',
  danger: 'bg-danger-600 text-white hover:bg-danger-700',
};

// md (44px) is the default touch target. sm (36px) is for dense desktop toolbars only.
const SIZES = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-base',
  lg: 'h-12 px-6 text-lg',
};

/**
 * Button. Renders a native <button> by default, or any element/component through `as`
 * (for example `as={Link} to="/login"` from React Router).
 *
 * `type` defaults to "button", so a button inside a <form> never submits by accident.
 * Pass type="submit" explicitly for submit buttons.
 */
export function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type,
  className,
  children,
  ...rest
}) {
  const isNativeButton = Component === 'button';
  const isDisabled = disabled || loading;

  const behaviour = isNativeButton
    ? { type: type ?? 'button', disabled: isDisabled }
    : { 'aria-disabled': isDisabled || undefined, tabIndex: isDisabled ? -1 : undefined };

  return (
    <Component
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-control font-semibold whitespace-nowrap transition-colors duration-150',
        'disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      aria-busy={loading || undefined}
      {...behaviour}
      {...rest}
    >
      {loading && <SpinnerIcon className="size-5 animate-spin motion-reduce:animate-none" />}
      {children}
    </Component>
  );
}
