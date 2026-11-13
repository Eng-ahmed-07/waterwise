import { cn } from '@/lib/cn';
import { FormField, controlClasses } from './FormField';
import { ChevronDownIcon } from './Icons';

/**
 * Native <select> (best accessibility and mobile behaviour) with a custom chevron placed on the
 * inline-end side, so it mirrors correctly in RTL.
 *
 * Pass `options` ([{ value, label, disabled? }]) and/or plain <option> children.
 * `placeholder` renders a disabled empty first option; use it with a controlled value of ''.
 */
export function Select({
  label,
  hint,
  error,
  required,
  id,
  className,
  selectClassName,
  options,
  placeholder,
  children,
  ref,
  ...rest
}) {
  return (
    <FormField label={label} hint={hint} error={error} required={required} id={id} className={className}>
      {(controlProps) => (
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              controlClasses.base,
              'appearance-none pe-10',
              error ? controlClasses.invalid : controlClasses.normal,
              selectClassName,
            )}
            {...controlProps}
            {...rest}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options?.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
            {children}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute inset-y-0 end-3 my-auto size-5 text-ink-muted" />
        </div>
      )}
    </FormField>
  );
}
