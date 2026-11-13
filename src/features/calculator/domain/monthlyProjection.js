import { BASIS } from '@/lib/basis';
import { MIN_COMPLETE_DAYS_FOR_PROJECTION } from '@/lib/constants';
import { roundLiters } from './calculations';
import { buildCoverage, summarizeDates, EXCLUSION_REASONS } from './dateAllocation';
import { daysInMonth, isValidMonth, monthOf } from './dates';

export const PROJECTION_STATUS = Object.freeze({
  INSUFFICIENT_DATA: 'insufficient_data',
  PARTIAL_COVERAGE: 'partial_coverage',
  FULLY_COVERED: 'fully_covered',
});

export const PROJECTION_MODES = Object.freeze({ REGISTERED: 'registered', GUEST: 'guest' });

/**
 * Monthly estimate / projection for one month, from COMPLETE covered dates only.
 *
 * Which dates count: every date inside a complete, valid, non-overlapping log. A weekly log
 * contributes its daily equivalent (weekly total / 7) to each of its 7 dates, attributed to the
 * month each date falls in, so a week straddling two months is split correctly. Drafts never count.
 *
 * Classification (checked in this order):
 *  1. fully_covered   every date of the month is covered. monthlyTotalLiters is the plain SUM of the
 *                     recorded estimates, basis ESTIMATED. Nothing is extrapolated, so it is NOT a projection.
 *  2. insufficient_data   fewer than `minCompleteDays` complete days. No projection, no monthly total.
 *                     Returns how many days exist and how many are still needed.
 *  3. partial_coverage    enough days: average daily liters x uncovered dates, added to the recorded
 *                     sum. monthlyTotalLiters has basis PROJECTED. (For a registered user this equals
 *                     average x days in month, the Phase 0 formula, because average x covered = recorded.)
 *
 * mode 'registered': the average uses the complete dates INSIDE the target month.
 * mode 'guest':      a guest has one log and no history, so the average uses all of the guest's
 *                    complete dates (a complete week = 7 days qualifies even if it straddles months;
 *                    a single complete day = 1 day never does). Same engine, same formulas.
 *
 * The estimate (recordedLiters, averageDailyLiters) and the projection are returned separately and
 * never labelled alike: show recordedLiters / averageDailyLiters with basis "estimated" and the
 * monthly total with `monthlyTotalBasis`. Nothing here is an actual meter reading.
 */
export function calculateMonthlyProjection({
  logs,
  month,
  today,
  mode = PROJECTION_MODES.REGISTERED,
  minCompleteDays = MIN_COMPLETE_DAYS_FOR_PROJECTION,
}) {
  if (!isValidMonth(month)) throw new TypeError(`"month" must be YYYY-MM, received: ${String(month)}`);
  if (!Object.values(PROJECTION_MODES).includes(mode)) throw new RangeError(`Unknown mode: ${String(mode)}`);

  const totalDays = daysInMonth(month);
  const { dates, excluded } = buildCoverage(logs, { today });

  const monthEntries = [...dates].filter(([date]) => monthOf(date) === month).map(([, value]) => value);
  const monthSummary = summarizeDates(monthEntries);
  const sample = mode === PROJECTION_MODES.GUEST ? summarizeDates(dates.values()) : monthSummary;

  const coveredDays = monthSummary.coveredDays;
  const uncoveredDays = totalDays - coveredDays;
  const meetsMinimum = sample.coveredDays >= minCompleteDays;

  let status;
  if (coveredDays === totalDays) status = PROJECTION_STATUS.FULLY_COVERED;
  else if (meetsMinimum) status = PROJECTION_STATUS.PARTIAL_COVERAGE;
  else status = PROJECTION_STATUS.INSUFFICIENT_DATA;

  let projectedUncoveredLiters = null;
  let monthlyTotalLiters = null;
  let monthlyTotalBasis = null;
  let formulaKey = null;

  if (status === PROJECTION_STATUS.FULLY_COVERED) {
    monthlyTotalLiters = monthSummary.totalLiters;
    monthlyTotalBasis = BASIS.ESTIMATED;
  } else if (status === PROJECTION_STATUS.PARTIAL_COVERAGE) {
    projectedUncoveredLiters = roundLiters(sample.averageDailyLiters * uncoveredDays);
    monthlyTotalLiters = roundLiters(monthSummary.totalLiters + projectedUncoveredLiters);
    monthlyTotalBasis = BASIS.PROJECTED;
    formulaKey = sample.coveredDays === coveredDays ? 'formulaWholeMonth' : 'formulaWithRecorded';
  }

  return {
    month,
    mode,
    daysInMonth: totalDays,
    coveredDays,
    uncoveredDays,
    /** Complete days the average is built from (= coveredDays for registered users). */
    sampleDays: sample.coveredDays,
    /** Sum of the recorded estimates on the month's covered dates. Basis: estimated. */
    recordedLiters: monthSummary.totalLiters,
    /** Average liters per complete day, or null with no complete days. Basis: estimated. */
    averageDailyLiters: sample.averageDailyLiters,
    minCompleteDays,
    remainingDaysRequired: Math.max(0, minCompleteDays - sample.coveredDays),
    meetsMinimum,
    /** True only when a real projection (extrapolation) is being returned. */
    projectionEligible: status === PROJECTION_STATUS.PARTIAL_COVERAGE,
    status,
    projectedUncoveredLiters,
    monthlyTotalLiters,
    /** 'projected' for partial_coverage, 'estimated' for fully_covered, null for insufficient_data. */
    monthlyTotalBasis,
    excludedLogs: excluded,
    draftLogsExcluded: excluded.filter((e) => e.reason === EXCLUSION_REASONS.DRAFT).length,
    calculation: { formulaKey, sampleDays: sample.coveredDays, uncoveredDays, averageDailyLiters: sample.averageDailyLiters },
    /** Machine-readable explanation; messages.js turns it into Arabic. */
    explanation: {
      code: status,
      params: { covered: sample.coveredDays, min: minCompleteDays, remaining: Math.max(0, minCompleteDays - sample.coveredDays), sample: sample.coveredDays },
    },
  };
}
