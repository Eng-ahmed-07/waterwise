import { ACTIVITY_DEFINITIONS } from './activityDefinitions';
import { dailyEquivalent, roundLiters } from './calculations';
import { selectContributingLogs } from './dateAllocation';
import { eachDate } from './dates';
import { periodLengthDays } from './periodValidation';

/**
 * Where the water goes: liters per activity over the COMPLETE covered dates in [from, to].
 * Each log contributes, per date it covers inside the range, (entry liters / days in period), so a
 * week is spread evenly over its 7 dates and a week straddling the range edge is split correctly.
 * Drafts, invalid logs and overlapping logs contribute nothing (same rules as every other metric).
 *
 * Returns { coveredDays, totalLiters, activities, topActivityId } where `activities` always lists all
 * six activities sorted by liters (then display order) with { activityId, totalLiters, share,
 * dailyAverageLiters }. share and dailyAverageLiters are null when there is nothing to divide by.
 * topActivityId is null when the total is 0 (no "highest" activity among all zeros).
 * Every figure here is an ESTIMATE (basis "estimated").
 */
export function calculateActivityBreakdown(logs, { today, from, to } = {}) {
  const { contributing } = selectContributingLogs(logs, { today });
  const totals = Object.fromEntries(ACTIVITY_DEFINITIONS.map((d) => [d.id, 0]));
  const coveredDates = new Set();

  for (const log of contributing) {
    const perDayDivisor = periodLengthDays(log.periodType);
    const dates = eachDate(log.periodStart, log.periodEnd).filter((d) => (!from || d >= from) && (!to || d <= to));
    if (dates.length === 0) continue;
    for (const date of dates) coveredDates.add(date);
    for (const entry of log.entries) {
      totals[entry.activityId] += dailyEquivalent(entry.estimatedLiters, perDayDivisor) * dates.length;
    }
  }

  const totalLiters = roundLiters(Object.values(totals).reduce((sum, v) => sum + v, 0));
  const coveredDays = coveredDates.size;
  const activities = ACTIVITY_DEFINITIONS.map(({ id, sortOrder }) => ({
    activityId: id,
    sortOrder,
    totalLiters: roundLiters(totals[id]),
    share: totalLiters > 0 ? totals[id] / totalLiters : null,
    dailyAverageLiters: coveredDays > 0 ? totals[id] / coveredDays : null,
  })).sort((a, b) => b.totalLiters - a.totalLiters || a.sortOrder - b.sortOrder);

  return { coveredDays, totalLiters, activities, topActivityId: totalLiters > 0 ? activities[0].activityId : null };
}
