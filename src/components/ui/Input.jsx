import { cn } from '@/lib/cn';
import { FormField, controlClasses } from './FormField';

// Latin-script values (emails, passwords, URLs, phone numbers) are forced LTR. Without this the
// bidi algorithm in an RTL page reorders "@", "." and "/" and the value looks scrambled.
const LTR_TYPES = new Set(['email', 'password', 'url', 'tel']);

/**
 * Text input with label, hint and error. Formik-friendly: spread `getFieldProps('name')` on it.
 * Forms should use `noValidate` and show Yup errors through the `error` prop, so the browser's
 * own (non-Arabic, unstyled) validation bubbles never appear.
 *
 * For numbers use type="text" or "number" with inputMode="decimal".
 * `ref` is a normal prop in React 19.
 */
export function Input({
  label,
  hint,
  error,
  required,
  id,
  className,
  inputClassName,
  type = 'text',
  dir,
  ref,
  ...rest
}) {
  const resolvedDir = dir ?? (LTR_TYPES.has(type) ? 'ltr' : undefined);

  return (
    <FormField label={label} hint={hint} error={error} required={required} id={id} className={className}>
      {(controlProps) => (
        <input
          ref={ref}
          type={type}
          dir={resolvedDir}
          className={cn(controlClasses.base, error ? controlClasses.invalid : controlClasses.normal, inputClassName)}
          {...controlProps}
          {...rest}
        />
      )}
    </FormField>
  );
}
