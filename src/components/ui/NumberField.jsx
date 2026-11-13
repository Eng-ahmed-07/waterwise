import { cn } from '@/lib/cn';
import { parseNumericInput, INPUT_STATUS } from '@/lib/numberInput';
import { FormField, controlClasses } from './FormField';
import { MinusIcon, PlusIcon } from './Icons';

/**
 * Pure stepping arithmetic. Returns the next raw string, or null for "no change".
 * Blank + "+" starts at `step`; blank + "-" does nothing (it must not invent an answer of zero);
 * a value never goes below `min`; unparseable text counts as blank.
 */
export function stepValue(text, direction, { step = 1, min = 0 } = {}) {
  const parsed = parseNumericInput(text);
  const current = parsed.status === INPUT_STATUS.VALID ? parsed.value : null;
  if (direction < 0 && current === null) return null;
  const next = Math.max(min, (current ?? 0) + direction * step);
  return String(Math.round(next * 1000) / 1000);
}

/**
 * Number input with a minus and a plus button (44px touch targets), for counts and minutes.
 * The value is the RAW string the person typed ('' means "not answered"), so blank is never turned
 * into zero. Arabic-Indic digits are accepted (see lib/numberInput).
 *
 * Stepping rules are in stepValue().
 */
export function NumberField({
  label,
  hint,
  error,
  value,
  onChange,
  step = 1,
  min = 0,
  disabled = false,
  required,
  id,
  className,
  incrementLabel,
  decrementLabel,
  inputProps,
}) {
  const text = value === null || value === undefined ? '' : String(value);
  const parsed = parseNumericInput(text);
  const current = parsed.status === INPUT_STATUS.VALID ? parsed.value : null;

  const stepBy = (direction) => {
    const next = stepValue(text, direction, { step, min });
    if (next !== null) onChange(next);
  };

  const buttonClass =
    'inline-flex size-11 shrink-0 items-center justify-center rounded-control border border-line-strong bg-surface text-ink transition-colors hover:border-primary-600 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <FormField label={label} hint={hint} error={error} required={required} id={id} className={className}>
      {(controlProps) => (
        <div className="flex items-center gap-2">
          <button type="button" className={buttonClass} aria-label={decrementLabel} disabled={disabled || current === null || current <= min} onClick={() => stepBy(-1)}>
            <MinusIcon className="size-5" />
          </button>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={text}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            className={cn(controlClasses.base, 'min-w-0 flex-1 text-center tabular-nums', error ? controlClasses.invalid : controlClasses.normal)}
            {...controlProps}
            {...inputProps}
          />
          <button type="button" className={buttonClass} aria-label={incrementLabel} disabled={disabled} onClick={() => stepBy(1)}>
            <PlusIcon className="size-5" />
          </button>
        </div>
      )}
    </FormField>
  );
}
