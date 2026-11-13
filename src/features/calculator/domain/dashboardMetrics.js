import { calculateActivityBreakdown } from './activityBreakdown';
import { buildCoverage, summarizeDates } from './dateAllocation';
import { addDays, daysInMonth, monthOf } from './dates';
import { validateLog } from './logValidation';
import { calculateMonthlyProjection } from './monthlyProjection';

/** Trailing windows used by the dashboard. These are display windows, not consumption benchmarks. */
export const DASHBOARD_WINDOWS = Object.freeze({ WEEK_DAYS: 7, RECENT_DAYS: 30 });

/**
 * Everything the dashboard shows, from COMPLETE logs only (drafts never count):
 *  - latest:       the most recent complete log and its daily equivalent (a week is labelled an average)
 *  - week:         sum over complete covered dates in the last 7 days, with coveredDays out of 7
 *  - monthToDate:  sum over complete covered dates this month, with coveredDays out of the month's days
 *  - outlook:      the monthly projection result for this month (see monthlyProjection.js)
 *  - recent:       complete dates in the last 30 days: total, covered days, average liters per complete day
 *  - perMemberDailyLiters: recent average / household size, or null without data or a valid size
 *  - breakdown:    liters per activity over the same 30 days
 * All figures are estimates, except outlook.monthlyTotalLiters whose basis is given by monthlyTotalBasis.
 */
export function calculateDashboardMetrics({ logs, today, householdSize }) {
  const { dates, contributing, excluded } = buildCoverage(logs, { today });
  const within = (from, to) => summarizeDates([...dates].filter(([d]) => d >= from && d <= to).map(([, v]) => v));

  const { WEEK_DAYS, RECENT_DAYS } = DASHBOARD_WINDOWS;
  const weekFrom = addDays(today, -(WEEK_DAYS - 1));
  const recentFrom = addDays(today, -(RECENT_DAYS - 1));
  const month = monthOf(today);

  const newest = [...contributing].sort((a, b) => (a.periodEnd === b.periodEnd ? (a.periodStart < b.periodStart ? 1 : -1) : a.periodEnd < b.periodEnd ? 1 : -1))[0];
  let latest = null;
  if (newest) {
    const { totalLiters, dailyEquivalentLiters } = validateLog(newest, { today });
    latest = { logId: newest.id, periodType: newest.periodType, periodStart: newest.periodStart, periodEnd: newest.periodEnd, totalLiters, dailyEquivalentLiters };
  }

  const recent = { ...within(recentFrom, today), windowDays: RECENT_DAYS, from: recentFrom, to: today };
  const sizeOk = Number.isInteger(householdSize) && householdSize >= 1;

  return {
    latest,
    week: { ...within(weekFrom, today), windowDays: WEEK_DAYS, from: weekFrom, to: today },
    monthToDate: { ...within(`${month}-01`, today), month, daysInMonth: daysInMonth(month) },
    outlook: calculateMonthlyProjection({ logs, month, today }),
    recent,
    perMemberDailyLiters: sizeOk && recent.averageDailyLiters !== null ? recent.averageDailyLiters / householdSize : null,
    breakdown: calculateActivityBreakdown(logs, { today, from: recentFrom, to: today }),
    excludedLogs: excluded,
    draftLogsExcluded: excluded.filter((e) => e.reason === 'draft').length,
  };
}
