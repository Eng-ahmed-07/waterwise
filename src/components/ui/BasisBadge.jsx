import { cn } from '@/lib/cn';
import { IS_DEV } from '@/lib/env';
import { resolveBasis } from '@/lib/basis';
import { ar } from '@/locales/ar';

/**
 * Badge that states what kind of figure a number is (Phase 0 labelling contract).
 * Meaning is carried by the TEXT label and by the BORDER SHAPE, never by colour alone:
 *   estimated -> تقديري  solid outline
 *   projected -> متوقع   dashed outline
 *   actual    -> فعلي    filled (reserved for future meter readings; blocked while FEATURES.actualBasis is false)
 *
 * Development: a missing/invalid basis throws. Production: renders nothing (fails closed).
 */
const STYLES = {
  estimated: 'border-[1.5px] border-solid border-primary-600 bg-primary-50 text-primary-800',
  projected: 'border-[1.5px] border-dashed border-secondary-700 bg-surface text-secondary-800',
  actual: 'border-[1.5px] border-solid border-ink bg-ink text-white',
};

const SIZES = {
  sm: 'px-2.5 py-px text-xs',
  md: 'px-3 py-0.5 text-sm',
};

export function BasisBadge({ basis, size = 'md', className }) {
  const resolved = resolveBasis(basis, { strict: IS_DEV });
  if (!resolved.ok) return null;

  return (
    <span
      data-basis={resolved.basis}
      className={cn(
        'inline-flex items-center rounded-full font-semibold whitespace-nowrap',
        STYLES[resolved.basis],
        SIZES[size],
        className,
      )}
    >
      {ar.basis[resolved.basis].label}
    </span>
  );
}
