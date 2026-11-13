import { Card, Input, MetricValue } from '@/components/ui';
import { ar } from '@/locales/ar';
import { calculateActivityBreakdown } from '../domain/activityBreakdown';
import { ActivityBreakdownList } from './ActivityBreakdownList';
import { OutlookTile } from './OutlookTile';

/**
 * Results for the calculator. Every number goes through MetricValue (basis estimated or projected).
 *  - incomplete form: a prompt, plus the partial subtotal labelled as NOT included in any calculation
 *  - complete form:   daily estimate, period total (week only), per-member, the monthly outlook,
 *                     and the breakdown by activity with the top activity highlighted
 * `sizeField` (guests, or a new account with no household yet) lets the person type the household size.
 */
export function ResultsPanel({ evaluation, today, periodType, mode, householdSize, sizeField, className }) {
  const t = ar.calculatorPage.results;
  const { build, completeLog, completeValidation, outlook } = evaluation;

  const sizeInput = sizeField && (
    <Input
      label={t.householdSize}
      inputMode="numeric"
      value={sizeField.raw}
      onChange={(event) => sizeField.onChange(event.target.value)}
      error={sizeField.error}
    />
  );

  if (!completeLog) {
    const partial = build.validation.partialSubtotalLiters;
    return (
      <Card as="section" title={t.title} className={className} aria-live="polite">
        <p className="text-ink-muted">{t.pending}</p>
        {build.answeredCount > 0 && partial !== null && (
          <MetricValue variant="row" className="mt-4 border-t border-line pt-4" label={t.partialSubtotal} value={partial} unit="liter" basis="estimated" />
        )}
      </Card>
    );
  }

  const breakdown = calculateActivityBreakdown([completeLog], { today });
  const isWeek = periodType === 'week';
  const perMember = householdSize ? completeValidation.dailyEquivalentLiters / householdSize : null;

  return (
    <Card as="section" title={t.title} className={className} aria-live="polite">
      <div className="grid gap-4">
        <MetricValue label={t.dailyEstimate} value={completeValidation.dailyEquivalentLiters} unit="literPerDay" basis="estimated" size="lg">
          {isWeek && <p className="text-xs text-ink-muted">{t.weekNote}</p>}
        </MetricValue>

        {isWeek && <MetricValue label={t.periodTotal} value={completeValidation.totalLiters} unit="liter" basis="estimated" />}

        {sizeInput}
        {perMember !== null ? (
          <MetricValue label={t.perMember} value={perMember} unit="literPerPersonDay" basis="estimated" />
        ) : (
          <p className="text-sm text-ink-muted">{t.needHouseholdSize}</p>
        )}

        <OutlookTile outlook={outlook} guestDay={mode === 'guest' && periodType === 'day'} />

        <div>
          <h3 className="mb-2 text-sm font-semibold text-ink">{t.breakdown}</h3>
          <ActivityBreakdownList breakdown={breakdown} />
        </div>
        <p className="text-xs text-ink-muted">{ar.notices.estimateNotMeasurement}</p>
      </div>
    </Card>
  );
}
