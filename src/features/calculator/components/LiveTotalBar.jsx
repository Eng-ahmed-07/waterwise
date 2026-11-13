import { MetricValue } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/format';
import { ar } from '@/locales/ar';

/**
 * Sticky bar for small screens (the results panel is a side column from lg up): answered count,
 * a progress bar, and the running total. The total is the COMPLETE total once all six are answered,
 * otherwise a partial subtotal that is labelled as not included in any calculation.
 * `aboveBottomNav` lifts it over the mobile tab bar of the signed-in shell.
 */
export function LiveTotalBar({ evaluation, aboveBottomNav = false }) {
  const { build, completeValidation } = evaluation;
  const isComplete = Boolean(completeValidation);
  const liters = isComplete ? completeValidation.totalLiters : build.validation.partialSubtotalLiters;
  const percent = (build.answeredCount / build.requiredCount) * 100;
  const progress = ar.calculator.progress(formatNumber(build.answeredCount), formatNumber(build.requiredCount));

  return (
    <div
      className={cn(
        'sticky z-20 border-t border-line bg-surface/95 backdrop-blur lg:hidden',
        aboveBottomNav ? 'bottom-[calc(3.5rem+env(safe-area-inset-bottom))] md:bottom-0' : 'bottom-0',
      )}
    >
      <div className="mx-auto max-w-6xl px-4 py-2.5 sm:px-6">
        <div
          role="progressbar"
          aria-label={progress}
          aria-valuemin={0}
          aria-valuemax={build.requiredCount}
          aria-valuenow={build.answeredCount}
          className="mb-1.5 h-1.5 overflow-hidden rounded-full bg-primary-100"
        >
          <div className="h-full rounded-full bg-primary-600" style={{ width: `${percent}%` }} />
        </div>
        <div aria-live="polite" className="grid gap-1">
          <p className="text-xs font-medium text-ink-muted">{progress}</p>
          <MetricValue
            variant="row"
            label={isComplete ? ar.calculatorPage.live.complete : ar.calculatorPage.live.partial}
            value={build.answeredCount > 0 ? liters : null}
            unit="liter"
            basis="estimated"
          />
        </div>
      </div>
    </div>
  );
}
