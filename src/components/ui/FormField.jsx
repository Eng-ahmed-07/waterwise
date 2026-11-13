import { useId } from 'react';
import { cn } from '@/lib/cn';
import { AlertIcon } from './Icons';

/**
 * Shared label / hint / error wrapper for Input and Select.
 * It owns the accessibility wiring: the label is bound to the control, and hint and error
 * text are linked through aria-describedby. The error carries an icon and text, never colour alone.
 *
 * `children` is a render function that receives the props to spread on the native control:
 *   <FormField label="...">{(controlProps) => <input {...controlProps} />}</FormField>
 */
export function FormField({ label, hint, error, required = false, id, className, children }) {
  const autoId = useId();
  const controlId = id ?? `field-${autoId}`;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const controlProps = {
    id: controlId,
    'aria-describedby': describedBy,
    'aria-invalid': error ? true : undefined,
    required: required || undefined,
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={controlId} className="text-sm font-medium text-ink">
        {label}
        {required && (
          <span aria-hidden="true" className="ms-1 text-danger-700">
            *
          </span>
        )}
      </label>
      {children(controlProps)}
      {hint && (
        <p id={hintId} className="text-xs text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="flex items-start gap-1.5 text-xs font-medium text-danger-700">
          <AlertIcon className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

// Shared control skin. Borders use line-strong so the control boundary meets 3:1 contrast.
export const controlClasses = {
  base: 'h-11 w-full rounded-control border bg-surface px-3.5 text-base text-ink transition-colors placeholder:text-ink-muted disabled:cursor-not-allowed disabled:bg-primary-50 disabled:text-ink-muted',
  normal: 'border-line-strong hover:border-primary-600 focus-visible:border-primary-600',
  invalid: 'border-danger-600 focus-visible:border-danger-600',
};
