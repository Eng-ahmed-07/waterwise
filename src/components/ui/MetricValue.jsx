import { useEffect, useId } from 'react';
import { cn } from '@/lib/cn';
import { IS_DEV } from '@/lib/env';
import { resolveBasis } from '@/lib/basis';
import { formatQuantity } from '@/lib/format';
import { isUnit } from '@/lib/units';
import { ar } from '@/locales/ar';
import { BasisBadge } from './BasisBadge';
import { Skeleton } from './Skeleton';

/**
 * The ONLY way a computed figure is shown in WaterWise (Phase 0 labelling contract).
 * `basis` is required: every number is shown with its BasisBadge, and a projected figure also gets
 * a dashed tile outline, so it cannot be mistaken for an estimate even if the badge is cropped out.
 *
 *   <MetricValue
 *     label="توقع شهري" value={15.5325} unit="cubicMeter" basis="projected"
 *     formula="المتوسط اليومي التقديري × عدد أيام الشهر">
 *     <CoverageNote covered={8} total={30} />
 *   </MetricValue>
 *
 * Props
 *  - label     short name of the figure (never "monthly consumption" for a projection)
 *  - value     finite number already in `unit`, or null/undefined when there is no figure
 *  - unit      one of UNITS (lib/units.js). No conversion is done here.
 *  - basis     'estimated' | 'projected' (required; 'actual' is blocked in the MVP)
 *  - formula   optional visible formula text (required by the contract for projections)
 *  - fractionDigits  override display precision
 *  - variant   'tile' (default, a bordered card) | 'row' (compact line for lists: label, number, unit, badge)
 *  - size      'md' | 'lg' (tile only)
 *  - isLoading shows a skeleton instead of the number (label and badge stay visible)
 *  - children  caption area, e.g. <CoverageNote />
 *
 * Failure behaviour: in development a missing basis, an unknown unit, or a non-numeric value throws.
 * In production it FAILS CLOSED: the number is hidden and "—" is shown, never an unlabelled figure.
 */
const TILE = {
  estimated: 'border border-line shadow-card',
  projected: 'border-[1.5px] border-dashed border-secondary-700',
};

const VALUE_SIZE = { md: 'text-3xl', lg: 'text-5xl' };

const isFiniteNumber = (v) => typeof v === 'number' && Number.isFinite(v);

export function MetricValue({
  label,
  value,
  unit,
  basis,
  formula,
  fractionDigits,
  size = 'md',
  variant = 'tile',
  isLoading = false,
  children,
  className,
}) {
  const labelId = useId();
  const resolved = resolveBasis(basis, { strict: IS_DEV });

  if (IS_DEV) {
    if (!isUnit(unit)) throw new RangeError(`MetricValue "${label}": unknown unit "${String(unit)}".`);
    if (value != null && !isFiniteNumber(value)) {
      throw new TypeError(`MetricValue "${label}": value must be a finite number or null, received ${String(value)}.`);
    }
  }

  // Production fail-closed signal for monitoring; development already threw above.
  useEffect(() => {
    if (!resolved.ok) console.error(`MetricValue "${label}": ${resolved.error}`);
  }, [resolved.ok, resolved.error, label]);

  const quantity =
    resolved.ok && !isLoading && isFiniteNumber(value) && isUnit(unit)
      ? formatQuantity(value, unit, { fractionDigits })
      : null;

  if (variant === 'row') {
    return (
      <div
        role="group"
        aria-labelledby={labelId}
        aria-busy={isLoading || undefined}
        data-basis={resolved.ok ? resolved.basis : undefined}
        className={cn('flex flex-wrap items-center justify-between gap-x-4 gap-y-1', className)}
      >
        <p id={labelId} className="min-w-0 text-sm text-ink">
          {label}
        </p>
        <div className="flex items-center gap-2">
          {isLoading ? (
            <>
              <Skeleton className="h-6 w-20" />
              <span className="sr-only">{ar.common.loading}</span>
            </>
          ) : quantity ? (
            <>
              <bdi className="text-base font-bold tabular-nums text-ink">{quantity.number}</bdi>
              <span className="text-sm text-ink-muted">{quantity.unitLabel}</span>
            </>
          ) : (
            <>
              <span aria-hidden="true" className="font-bold text-ink-muted">
                —
              </span>
              <span className="sr-only">{ar.metric.noValue}</span>
            </>
          )}
          {resolved.ok && <BasisBadge basis={resolved.basis} size="sm" />}
        </div>
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      aria-busy={isLoading || undefined}
      data-basis={resolved.ok ? resolved.basis : undefined}
      className={cn('rounded-card bg-surface p-4 sm:p-5', TILE[resolved.ok ? resolved.basis : 'estimated'], className)}
    >
      <div className="flex items-start justify-between gap-3">
        <p id={labelId} className="text-sm font-medium text-ink-muted">
          {label}
        </p>
        {resolved.ok && <BasisBadge basis={resolved.basis} size="sm" className="shrink-0" />}
      </div>

      <div className="mt-3">
        {isLoading ? (
          <>
            <Skeleton className="h-10 w-36" />
            <span className="sr-only">{ar.common.loading}</span>
          </>
        ) : quantity ? (
          <p className="flex flex-wrap items-baseline gap-x-2">
            {/* <bdi> isolates the digits from the surrounding RTL text. */}
            <bdi className={cn('font-bold tabular-nums text-ink', VALUE_SIZE[size])}>{quantity.number}</bdi>
            <span className="text-base font-medium text-ink-muted">{quantity.unitLabel}</span>
          </p>
        ) : (
          <p className={cn('font-bold text-ink-muted', VALUE_SIZE[size])}>
            <span aria-hidden="true">—</span>
            <span className="sr-only">{ar.metric.noValue}</span>
          </p>
        )}
      </div>

      {formula && <p className="mt-2 text-xs text-ink-muted">{formula}</p>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
