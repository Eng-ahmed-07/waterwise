import { describe, expect, it } from 'vitest';
import { calculateActivityBreakdown } from './activityBreakdown';
import { litersToCubicMeters } from './calculations';
import { calculateDashboardMetrics, DASHBOARD_WINDOWS } from './dashboardMetrics';
import { validateAssumptions, validateRate } from './logValidation';
import { ERROR_CODES as E } from './errorCodes';
import { ASSUMPTIONS, close, litersLog, makeLog, REV3_DAY_ANSWERS, REV3_WEEK_ANSWERS, TODAY, ZERO_ANSWERS } from './testHelpers';

const day = makeLog({ id: 'L1', periodStart: '2026-11-03', answers: REV3_DAY_ANSWERS });
const week = makeLog({ id: 'L2', periodType: 'week', periodStart: '2026-11-05', answers: REV3_WEEK_ANSWERS });
const draft = makeLog({ id: 'L3', periodStart: '2026-11-04', answers: { shower: REV3_DAY_ANSWERS.shower }, complete: false });
const byId = (breakdown, id) => breakdown.activities.find((a) => a.activityId === id);

describe('litersToCubicMeters', () => {
  it('divides by 1000 (display conversion for monthly-scale figures)', () => {
    expect(litersToCubicMeters(15532.5)).toBe(15.5325);
    expect(litersToCubicMeters(0)).toBe(0);
  });
});

describe('validateRate', () => {
  it('validates a single rate with the same codes as validateAssumptions', () => {
    expect(validateRate('shower', 8)).toEqual([]);
    expect(validateRate('shower', undefined)[0].code).toBe(E.ASSUMPTION_MISSING);
    expect(validateRate('shower', 0)[0].code).toBe(E.RATE_INVALID);
    expect(validateRate('shower', 101)[0].code).toBe(E.RATE_TOO_LARGE);
    expect(validateRate('washing_machine', 1000)).toEqual([]);
    expect(validateAssumptions(ASSUMPTIONS)).toEqual([]);
  });
});

describe('calculateActivityBreakdown', () => {
  it('splits the Revision 3 example by activity (totals add up to 4,142 L) and finds the top one', () => {
    const b = calculateActivityBreakdown([day, week, draft], { today: TODAY });
    expect(b.coveredDays).toBe(8);
    expect(b.totalLiters).toBe(4142);
    expect(byId(b, 'shower').totalLiters).toBe(1536); // 192 + 1344
    expect(byId(b, 'faucet').totalLiters).toBe(576);
    expect(byId(b, 'dishwashing').totalLiters).toBe(1440);
    expect(byId(b, 'plant_watering').totalLiters).toBe(300);
    expect(byId(b, 'washing_machine').totalLiters).toBe(250);
    expect(byId(b, 'house_cleaning').totalLiters).toBe(40);
    expect(b.topActivityId).toBe('shower');
    expect(b.activities.map((a) => a.activityId)).toEqual(['shower', 'dishwashing', 'faucet', 'plant_watering', 'washing_machine', 'house_cleaning']);
  });

  it('shares sum to 1 and daily averages are per complete day', () => {
    const b = calculateActivityBreakdown([day, week], { today: TODAY });
    expect(close(b.activities.reduce((s, a) => s + a.share, 0), 1)).toBe(true);
    expect(close(byId(b, 'shower').dailyAverageLiters, 1536 / 8)).toBe(true);
  });

  it('ignores drafts completely', () => {
    const big = makeLog({ id: 'big', periodStart: '2026-11-20', answers: { shower: { occurrences: 40, durationMinutes: 90 } }, complete: false });
    expect(calculateActivityBreakdown([day, big], { today: TODAY }).totalLiters).toBe(494);
  });

  it('respects the date range and splits a week across it (only the dates inside are counted)', () => {
    const b = calculateActivityBreakdown([week], { today: TODAY, from: '2026-11-09', to: '2026-11-30' });
    expect(b.coveredDays).toBe(3); // Nov 9, 10, 11
    expect(close(b.totalLiters, (3648 / 7) * 3, 1e-6)).toBe(true);
  });

  it('has no top activity and no shares when everything is zero, and for no data', () => {
    const zero = makeLog({ id: 'z', periodStart: '2026-11-03', answers: ZERO_ANSWERS });
    const b = calculateActivityBreakdown([zero], { today: TODAY });
    expect(b.totalLiters).toBe(0);
    expect(b.topActivityId).toBeNull();
    expect(b.activities.every((a) => a.share === null)).toBe(true);
    const none = calculateActivityBreakdown([], { today: TODAY });
    expect(none.coveredDays).toBe(0);
    expect(none.activities).toHaveLength(6);
    expect(none.activities.every((a) => a.dailyAverageLiters === null)).toBe(true);
  });

  it('excludes overlapping complete logs (never double counts)', () => {
    const inside = litersLog('d', 'day', '2026-11-08', 3);
    expect(calculateActivityBreakdown([week, inside], { today: TODAY }).coveredDays).toBe(0);
  });
});

describe('calculateDashboardMetrics', () => {
  const today = '2026-11-12'; // week window Nov 6-12, recent window Oct 14 - Nov 12
  const m = calculateDashboardMetrics({ logs: [day, week, draft], today, householdSize: 4 });

  it('windows are 7 and 30 days', () => {
    expect(DASHBOARD_WINDOWS).toEqual({ WEEK_DAYS: 7, RECENT_DAYS: 30 });
    expect(m.week.windowDays).toBe(7);
    expect(m.recent.windowDays).toBe(30);
  });

  it('latest is the most recent COMPLETE log: the week, as a daily average', () => {
    expect(m.latest.logId).toBe('L2');
    expect(m.latest.periodType).toBe('week');
    expect(m.latest.totalLiters).toBe(3648);
    expect(m.latest.dailyEquivalentLiters).toBe(3648 / 7);
  });

  it('week sums only the complete dates inside the last 7 days (Nov 6-11 = 6 days of the week log)', () => {
    expect(m.week.coveredDays).toBe(6);
    expect(close(m.week.totalLiters, (3648 / 7) * 6, 1e-6)).toBe(true);
  });

  it('month to date and the outlook use the current month', () => {
    expect(m.monthToDate.coveredDays).toBe(8);
    expect(m.monthToDate.totalLiters).toBe(4142);
    expect(m.monthToDate.daysInMonth).toBe(30);
    expect(m.outlook.status).toBe('partial_coverage');
    expect(m.outlook.monthlyTotalLiters).toBe(15532.5);
  });

  it('recent average and per-member figure', () => {
    expect(m.recent.coveredDays).toBe(8);
    expect(m.recent.averageDailyLiters).toBe(517.75);
    expect(m.perMemberDailyLiters).toBe(517.75 / 4);
    expect(m.breakdown.topActivityId).toBe('shower');
  });

  it('reports drafts as excluded and never counts them', () => {
    expect(m.draftLogsExcluded).toBe(1);
    expect(m.recent.totalLiters).toBe(4142);
  });

  it('has no per-member figure without a valid household size or without data', () => {
    expect(calculateDashboardMetrics({ logs: [day], today, householdSize: 0 }).perMemberDailyLiters).toBeNull();
    expect(calculateDashboardMetrics({ logs: [day], today, householdSize: undefined }).perMemberDailyLiters).toBeNull();
    expect(calculateDashboardMetrics({ logs: [], today, householdSize: 4 }).perMemberDailyLiters).toBeNull();
  });

  it('handles an empty account without throwing', () => {
    const empty = calculateDashboardMetrics({ logs: [], today, householdSize: 4 });
    expect(empty.latest).toBeNull();
    expect(empty.week.coveredDays).toBe(0);
    expect(empty.outlook.status).toBe('insufficient_data');
    expect(empty.breakdown.topActivityId).toBeNull();
  });
});
