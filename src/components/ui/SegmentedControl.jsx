import { useId } from 'react';
import { cn } from '@/lib/cn';

/**
 * Two-to-four option toggle built on native radio inputs: arrow keys, focus and screen-reader
 * semantics come from the browser. `options` is [{ value, label }].
 */
export function SegmentedControl({ legend, options, value, onChange, className }) {
  const name = useId();
  return (
    <fieldset className={cn('min-w-0', className)}>
      <legend className="mb-1.5 text-sm font-medium text-ink">{legend}</legend>
      <div className="inline-flex w-full rounded-control border border-line-strong bg-surface p-1">
        {options.map((option) => (
          <label key={option.value} className="relative flex-1">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span className="flex h-9 cursor-pointer items-center justify-center rounded-lg px-4 text-sm font-semibold text-ink-muted transition-colors hover:text-ink peer-checked:bg-primary-600 peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-600">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
