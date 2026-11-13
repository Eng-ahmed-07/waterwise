import { Link } from 'react-router-dom';
import { Button, CoverageNote, MetricValue } from '@/components/ui';
import { ar } from '@/locales/ar';
import { litersToCubicMeters } from '../domain/calculations';
import { describeProjection } from '../domain/messages';
import { PROJECTION_STATUS } from '../domain/monthlyProjection';

/**
 * The monthly figure, in whichever of its three honest states applies (Phase 0 Revision 3, section C):
 *  - partial_coverage: a PROJECTION (basis projected) with its formula and the complete days it uses
 *  - fully_covered:    a plain estimated TOTAL (basis estimated), not a projection
 *  - insufficient_data: NO number, an explanation, a progress bar toward the minimum and a call to action
 * `guestDay` is true for a guest who entered a single day: they get the "enter a whole week" hint.
 */
export function OutlookTile({ outlook, guestDay = false, ctaTo = '/calculator' }) {
  const text = ar.calculator.projection;
  const description = describeProjection(outlook);

  if (outlook.status === PROJECTION_STATUS.PARTIAL_COVERAGE) {
    return (
      <MetricValue
        label={text.labels.monthlyOutlook}
        value={litersToCubicMeters(outlook.monthlyTotalLiters)}
        unit="cubicMeter"
        basis={outlook.monthlyTotalBasis}
        formula={description.formula}
      >
        <CoverageNote covered={outlook.sampleDays} total={outlook.daysInMonth} />
      </MetricValue>
    );
  }

  if (outlook.status === PROJECTION_STATUS.FULLY_COVERED) {
    return (
      <MetricValue
        label={text.labels.monthlyEstimatedTotal}
        value={litersToCubicMeters(outlook.monthlyTotalLiters)}
        unit="cubicMeter"
        basis={outlook.monthlyTotalBasis}
      >
        <p className="text-xs text-ink-muted">{description.summary}</p>
      </MetricValue>
    );
  }

  // Insufficient data: explain instead of showing a misleading number.
  return (
    <div className="rounded-card border border-line bg-primary-50 p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-ink">{text.labels.monthlyOutlook}</h3>
      <p className="mt-2 text-sm text-ink">{guestDay ? ar.calculatorPage.results.guestDayHint : description.summary}</p>
      {!guestDay && (
        <>
          <p className="mt-1 text-xs text-ink-muted">{description.remaining}</p>
          <CoverageNote covered={Math.min(outlook.sampleDays, outlook.minCompleteDays)} total={outlook.minCompleteDays} showBar className="mt-3" />
          <Button as={Link} to={ctaTo} variant="secondary" size="sm" className="mt-4">
            {ar.calculatorPage.results.addDay}
          </Button>
        </>
      )}
    </div>
  );
}
