/**
 * Joins class names, skipping falsy values.
 * cn('a', false && 'b', ['c', null], 'd') -> 'a c d'
 *
 * Deliberately NOT tailwind-merge: components put their own classes first and the caller's
 * `className` last. Do not pass classes that conflict with a component's own (for example a
 * different padding); extend the component with a prop instead.
 */
export function cn(...parts) {
  const out = [];
  for (const part of parts) {
    if (!part) continue;
    if (Array.isArray(part)) {
      const nested = cn(...part);
      if (nested) out.push(nested);
    } else {
      out.push(String(part));
    }
  }
  return out.join(' ');
}
