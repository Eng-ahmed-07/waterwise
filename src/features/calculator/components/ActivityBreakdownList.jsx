import { MetricValue } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/format';
import { ar } from '@/locales/ar';

/**
 * Liters per activity with a proportional bar, highest first. The top activity is highlighted in
 * amber (the "high usage" accent) AND named in text, so the highlight never relies on colour alone.
 * `breakdown` is the result of calculateActivityBreakdown(); every figure is an estimate.
 */
export function ActivityBreakdownList({ breakdown }) {
  const t = ar.calculatorPage.results;
  return (
    <div>
      <ul className="grid gap-3">
        {breakdown.activities.map((activity) => {
          const isTop = activity.activityId === breakdown.topActivityId;
          const percent = activity.share === null ? 0 : Math.round(activity.share * 100);
          return (
            <li key={activity.activityId}>
              <MetricValue
                variant="row"
                label={`${ar.calculator.activities[activity.activityId].name} (${t.share({ percent: formatNumber(percent) })})`}
                value={activity.totalLiters}
                unit="liter"
                basis="estimated"
              />
              <div aria-hidden="true" className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-primary-100">
                <div className={cn('h-full rounded-full', isTop ? 'bg-amber-500' : 'bg-primary-500')} style={{ width: `${percent}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      {breakdown.topActivityId && (
        <p className="mt-3 rounded-control bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-800">
          {t.topActivity({ name: ar.calculator.activities[breakdown.topActivityId].name })}
        </p>
      )}
    </div>
  );
}
