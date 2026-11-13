import { cn } from '@/lib/cn';
import { IS_DEV } from '@/lib/env';
import { formatNumber } from '@/lib/format';
import { ar } from '@/locales/ar';

/**
 * States how many COMPLETE days a figure is based on (Phase 0, Revision 3: drafts and partial
 * days are never counted). `covered` and `total` are plain integers; formatting is done here.
 * `showBar` adds a progress indicator, used for the "need 7 complete days" message.
 */
export function CoverageNote({ covered, total, showBar = false, className }) {
  if (IS_DEV) {
    const ok = Number.isInteger(covered) && covered >= 0 && Number.isInteger(total) && total > 0;
    if (!ok) throw new TypeError(`CoverageNote: covered must be an integer >= 0 and total an integer > 0 (got ${covered}, ${total}).`);
  }

  const text = ar.coverage.completeDays(formatNumber(covered), formatNumber(total));
  const clamped = Math.min(Math.max(covered, 0), total);
  const percent = (clamped / total) * 100;

  return (
    <div className={cn('text-xs text-ink-muted', className)}>
      <p>{text}</p>
      {showBar && (
        <div
          role="progressbar"
          aria-label={text}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={clamped}
          className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-primary-100"
        >
          <div className="h-full rounded-full bg-primary-600" style={{ width: `${percent}%` }} />
        </div>
      )}
    </div>
  );
}
