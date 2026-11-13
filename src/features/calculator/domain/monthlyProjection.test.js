import { describe, expect, it } from 'vitest';
import { MIN_COMPLETE_DAYS_FOR_PROJECTION } from '@/lib/constants';
import { calculateMonthlyProjection, PROJECTION_MODES, PROJECTION_STATUS } from './monthlyProjection';
import { addDays } from './dates';
import { buildLogFromAnswers } from './logBuilder';
import { close, litersLog, makeLog, REV3_DAY_ANSWERS, REV3_WEEK_ANSWERS, TODAY, ZERO_ANSWERS, ASSUMPTIONS } from './testHelpers';

const NOV = '2026-11';
/** n complete daily logs on Nov 1..n; day i has `cyclesFor(i)` washer cycles (50 L each). */
const dailyLogs = (n, cyclesFor = () => 1) => Array.from({ length: n }, (_, i) => litersLog(`d${i + 1}`, 'day', addDays('2026-11-01', i), cyclesFor(i + 1)));
const project = (logs, options = {}) => calculateMonthlyProjection({ logs, month: NOV, today: TODAY, ...options });

describe('the minimum-data rule', () => {
  it('reuses the Phase 1 constant (7 complete days)', () => {
    expect(MIN_COMPLETE_DAYS_FOR_PROJECTION).toBe(7);
    expect(project([]).minCompleteDays).toBe(7);
  });

  it('with no data: insufficient, 0 days, 7 still needed, no average', () => {
    const r = project([]);
    expect(r.status).toBe(PROJECTION_STATUS.INSUFFICIENT_DATA);
    expect(r.coveredDays).toBe(0);
    expect(r.remainingDaysRequired).toBe(7);
    expect(r.averageDailyLiters).toBeNull();
    expect(r.monthlyTotalLiters).toBeNull();
  });

  it('FEWER than 7 complete days: no projection, no monthly total, reports days and the remainder', () => {
    const r = project(dailyLogs(6));
    expect(r.status).toBe(PROJECTION_STATUS.INSUFFICIENT_DATA);
    expect(r.coveredDays).toBe(6);
    expect(r.sampleDays).toBe(6);
    expect(r.remainingDaysRequired).toBe(1);
    expect(r.meetsMinimum).toBe(false);
    expect(r.projectionEligible).toBe(false);
    expect(r.projectedUncoveredLiters).toBeNull();
    expect(r.monthlyTotalLiters).toBeNull();
    expect(r.monthlyTotalBasis).toBeNull();
    expect(r.calculation.formulaKey).toBeNull();
    expect(r.recordedLiters).toBe(300); // the estimate for recorded days is still reported
    expect(r.averageDailyLiters).toBe(50);
    expect(r.explanation.code).toBe('insufficient_data');
  });

  it('EXACTLY 7 complete days: eligible', () => {
    const r = project(dailyLogs(7, () => 2)); // 100 L each
    expect(r.status).toBe(PROJECTION_STATUS.PARTIAL_COVERAGE);
    expect(r.meetsMinimum).toBe(true);
    expect(r.projectionEligible).toBe(true);
    expect(r.remainingDaysRequired).toBe(0);
    expect(r.coveredDays).toBe(7);
    expect(r.uncoveredDays).toBe(23);
    expect(r.recordedLiters).toBe(700);
    expect(r.averageDailyLiters).toBe(100);
    expect(r.projectedUncoveredLiters).toBe(2300);
    expect(r.monthlyTotalLiters).toBe(3000);
    expect(r.monthlyTotalBasis).toBe('projected');
  });

  it('MORE than 7 complete days: uses the average of all of them', () => {
    const r = project(dailyLogs(10, (day) => day)); // 1..10 cycles = 55 cycles = 2750 L
    expect(r.coveredDays).toBe(10);
    expect(r.recordedLiters).toBe(2750);
    expect(r.averageDailyLiters).toBe(275);
    expect(r.uncoveredDays).toBe(20);
    expect(r.projectedUncoveredLiters).toBe(5500);
    expect(r.monthlyTotalLiters).toBe(8250);
  });

  it('for a registered user the total equals average x days in the month (the Phase 0 formula)', () => {
    const r = project(dailyLogs(9, (day) => (day % 3) + 1));
    expect(close(r.monthlyTotalLiters, r.averageDailyLiters * r.daysInMonth, 1e-6)).toBe(true);
    expect(r.calculation.formulaKey).toBe('formulaWholeMonth');
  });

  it('respects a configured minimum', () => {
    expect(project(dailyLogs(3), { minCompleteDays: 3 }).status).toBe(PROJECTION_STATUS.PARTIAL_COVERAGE);
    expect(project(dailyLogs(3), { minCompleteDays: 4 }).remainingDaysRequired).toBe(1);
  });

  it('treats complete days of explicit zero consumption as real days', () => {
    const logs = Array.from({ length: 7 }, (_, i) => makeLog({ id: `z${i}`, periodStart: addDays('2026-11-01', i), answers: ZERO_ANSWERS }));
    const r = project(logs);
    expect(r.projectionEligible).toBe(true);
    expect(r.averageDailyLiters).toBe(0);
    expect(r.monthlyTotalLiters).toBe(0);
  });
});

describe('drafts never count', () => {
  it('6 complete days plus drafts is still insufficient, and drafts are reported', () => {
    const drafts = [7, 8, 9].map((d) => makeLog({ id: `draft${d}`, periodStart: `2026-11-0${d}`, answers: REV3_DAY_ANSWERS, complete: false }));
    const r = project([...dailyLogs(6), ...drafts]);
    expect(r.status).toBe(PROJECTION_STATUS.INSUFFICIENT_DATA);
    expect(r.coveredDays).toBe(6);
    expect(r.draftLogsExcluded).toBe(3);
  });

  it('a partial draft cannot change the average or the projection of complete days', () => {
    const base = project(dailyLogs(7, () => 2));
    const draft = makeLog({ id: 'big', periodStart: '2026-11-20', answers: { shower: { occurrences: 40, durationMinutes: 90 } }, complete: false });
    const withDraft = project([...dailyLogs(7, () => 2), draft]);
    expect(withDraft.averageDailyLiters).toBe(base.averageDailyLiters);
    expect(withDraft.monthlyTotalLiters).toBe(base.monthlyTotalLiters);
    expect(withDraft.draftLogsExcluded).toBe(1);
  });

  it('a log that only claims to be complete (missing activities) is excluded, not counted as zero', () => {
    const good = dailyLogs(6);
    const forged = { ...litersLog('forged', 'day', '2026-11-07', 1), entries: litersLog('x', 'day', '2026-11-07', 1).entries.slice(0, 2) };
    const r = project([...good, forged]);
    expect(r.coveredDays).toBe(6);
    expect(r.status).toBe(PROJECTION_STATUS.INSUFFICIENT_DATA);
    expect(r.excludedLogs[0].reason).toBe('invalid');
  });
});

describe('weekly logs and month boundaries', () => {
  it('one complete week is 7 covered days and reaches the minimum', () => {
    const r = project([litersLog('w', 'week', '2026-11-05', 14)]); // 700 L = 100 L/day
    expect(r.coveredDays).toBe(7);
    expect(r.projectionEligible).toBe(true);
    expect(r.averageDailyLiters).toBe(100);
    expect(r.monthlyTotalLiters).toBe(3000);
  });

  it('attributes a week to the months its dates fall in (Jan 29 - Feb 4)', () => {
    const logs = [litersLog('w', 'week', '2026-01-29', 14)];
    const jan = calculateMonthlyProjection({ logs, month: '2026-01', today: '2026-12-31' });
    const feb = calculateMonthlyProjection({ logs, month: '2026-02', today: '2026-12-31' });
    expect(jan.coveredDays).toBe(3);
    expect(jan.recordedLiters).toBe(300);
    expect(feb.coveredDays).toBe(4);
    expect(feb.recordedLiters).toBe(400);
    expect(jan.recordedLiters + feb.recordedLiters).toBe(700); // nothing lost, nothing doubled
  });

  it('a registered week that straddles two months has too few days in EITHER month for a projection', () => {
    const logs = [litersLog('w', 'week', '2026-01-29', 14)];
    expect(calculateMonthlyProjection({ logs, month: '2026-01', today: '2026-12-31' }).status).toBe(PROJECTION_STATUS.INSUFFICIENT_DATA);
    expect(calculateMonthlyProjection({ logs, month: '2026-02', today: '2026-12-31' }).status).toBe(PROJECTION_STATUS.INSUFFICIENT_DATA);
  });

  it('never counts a date twice when a daily log overlaps a weekly one: both are excluded and reported', () => {
    const r = project([litersLog('w', 'week', '2026-11-05', 14), litersLog('d', 'day', '2026-11-08', 3)]);
    expect(r.coveredDays).toBe(0);
    expect(r.excludedLogs.map((e) => e.reason)).toEqual(['overlap', 'overlap']);
  });

  it('allocates month-by-month with weekly + daily logs together, with no double counting', () => {
    const r = project([litersLog('w', 'week', '2026-11-05', 14), litersLog('d1', 'day', '2026-11-03', 2), litersLog('d2', 'day', '2026-11-04', 2)]);
    expect(r.coveredDays).toBe(9);
    expect(r.recordedLiters).toBe(700 + 100 + 100);
  });
});

describe('guest eligibility (same engine, guest mode)', () => {
  const guest = (logs, month = NOV) => calculateMonthlyProjection({ logs, month, today: TODAY, mode: PROJECTION_MODES.GUEST });

  it('a complete guest WEEKLY log qualifies for a projection', () => {
    const r = guest([litersLog('g', 'week', '2026-11-05', 14)]);
    expect(r.projectionEligible).toBe(true);
    expect(r.sampleDays).toBe(7);
    expect(r.monthlyTotalLiters).toBe(3000);
    expect(r.monthlyTotalBasis).toBe('projected');
  });

  it('a complete guest DAILY log never qualifies on its own', () => {
    const r = guest([litersLog('g', 'day', '2026-11-05', 2)]);
    expect(r.projectionEligible).toBe(false);
    expect(r.status).toBe(PROJECTION_STATUS.INSUFFICIENT_DATA);
    expect(r.sampleDays).toBe(1);
    expect(r.remainingDaysRequired).toBe(6);
    expect(r.monthlyTotalLiters).toBeNull();
    expect(r.averageDailyLiters).toBe(100); // the daily estimate is still shown
  });

  it('an incomplete guest log (draft) gives nothing', () => {
    const draft = makeLog({ id: 'g', periodType: 'week', periodStart: '2026-11-05', answers: { shower: { occurrences: 3, durationMinutes: 5 } }, complete: false });
    expect(guest([draft]).status).toBe(PROJECTION_STATUS.INSUFFICIENT_DATA);
  });

  it('a guest week straddling two months still qualifies, using all 7 days for the average', () => {
    const logs = [litersLog('g', 'week', '2026-01-29', 14)]; // 100 L/day
    const feb = calculateMonthlyProjection({ logs, month: '2026-02', today: '2026-12-31', mode: 'guest' });
    expect(feb.projectionEligible).toBe(true);
    expect(feb.coveredDays).toBe(4);
    expect(feb.sampleDays).toBe(7);
    expect(feb.recordedLiters).toBe(400);
    expect(feb.projectedUncoveredLiters).toBe(2400); // 100 L x 24 uncovered days
    expect(feb.monthlyTotalLiters).toBe(2800); // 28 days x 100 L
    expect(feb.calculation.formulaKey).toBe('formulaWithRecorded');
  });

  it('uses the same numbers as registered mode when the week sits inside the month', () => {
    const logs = [litersLog('g', 'week', '2026-11-05', 14)];
    const registered = project(logs);
    const asGuest = guest(logs);
    expect(asGuest.monthlyTotalLiters).toBe(registered.monthlyTotalLiters);
    expect(asGuest.averageDailyLiters).toBe(registered.averageDailyLiters);
  });
});

describe('fully covered month', () => {
  const february = [0, 7, 14, 21].map((offset, i) => litersLog(`w${i}`, 'week', addDays('2026-02-01', offset), 14)); // 4 x 700 L

  it('reports the plain estimated sum and is NOT a projection', () => {
    const r = calculateMonthlyProjection({ logs: february, month: '2026-02', today: TODAY });
    expect(r.status).toBe(PROJECTION_STATUS.FULLY_COVERED);
    expect(r.coveredDays).toBe(28);
    expect(r.uncoveredDays).toBe(0);
    expect(r.monthlyTotalLiters).toBe(2800);
    expect(r.monthlyTotalBasis).toBe('estimated');
    expect(r.projectionEligible).toBe(false);
    expect(r.projectedUncoveredLiters).toBeNull();
    expect(r.calculation.formulaKey).toBeNull();
  });

  it('is not fully covered if even one date is missing (22 of 28 here)', () => {
    const r = calculateMonthlyProjection({ logs: february.slice(0, 3).concat(litersLog('d', 'day', '2026-02-22', 2)), month: '2026-02', today: TODAY });
    expect(r.status).toBe(PROJECTION_STATUS.PARTIAL_COVERAGE);
    expect(r.coveredDays).toBe(22);
  });
});

describe('partial coverage basis and explanation', () => {
  it('exposes the calculation basis and the coverage used', () => {
    const r = project(dailyLogs(8, () => 2));
    expect(r.calculation).toEqual({ formulaKey: 'formulaWholeMonth', sampleDays: 8, uncoveredDays: 22, averageDailyLiters: 100 });
    expect(r.daysInMonth).toBe(30);
    expect(r.month).toBe(NOV);
    expect(r.explanation).toEqual({ code: 'partial_coverage', params: { covered: 8, min: 7, remaining: 0, sample: 8 } });
  });

  it('keeps the recorded estimate and the projected remainder separate', () => {
    const r = project(dailyLogs(8, () => 2));
    expect(r.recordedLiters).toBe(800);
    expect(r.projectedUncoveredLiters).toBe(2200);
    expect(r.monthlyTotalLiters).toBe(3000);
  });

  it('leap February has 29 days', () => {
    const r = calculateMonthlyProjection({ logs: [litersLog('w', 'week', '2028-02-05', 14, { today: '2028-12-31' })], month: '2028-02', today: '2028-12-31' });
    expect(r.daysInMonth).toBe(29);
    expect(r.monthlyTotalLiters).toBe(2900);
  });
});

describe('approved Revision 3 worked example', () => {
  const day = makeLog({ id: 'L1', periodStart: '2026-11-03', answers: REV3_DAY_ANSWERS });
  const week = makeLog({ id: 'L2', periodType: 'week', periodStart: '2026-11-05', answers: REV3_WEEK_ANSWERS });
  const draft = makeLog({ id: 'L3', periodStart: '2026-11-04', answers: { shower: REV3_DAY_ANSWERS.shower, faucet: REV3_DAY_ANSWERS.faucet }, complete: false });

  it('matches the numbers in the plan: 494 L, 3,648 L, 8 complete days, 517.75 L/day, 15,532.5 L', () => {
    const r = project([day, week, draft]);
    expect(r.coveredDays).toBe(8);
    expect(r.recordedLiters).toBe(4142);
    expect(r.averageDailyLiters).toBe(517.75);
    expect(r.projectedUncoveredLiters).toBe(11390.5); // 517.75 x 22
    expect(r.monthlyTotalLiters).toBe(15532.5);
    expect(r.monthlyTotalBasis).toBe('projected');
    expect(r.draftLogsExcluded).toBe(1);
  });

  it('per-member figure (household of 4) is 129.44 L/person/day', () => {
    expect(close(project([day, week]).averageDailyLiters / 4, 129.4375)).toBe(true);
  });

  it('including the draft would have given the wrong 489.56 L/day: the engine does not', () => {
    const wrong = (4142 + 264) / 9;
    expect(close(wrong, 489.5555, 1e-3)).toBe(true);
    expect(project([day, week, draft]).averageDailyLiters).toBe(517.75);
  });

  it('with only the single complete day there is no projection (1 of 7)', () => {
    const r = project([day]);
    expect(r.status).toBe(PROJECTION_STATUS.INSUFFICIENT_DATA);
    expect(r.coveredDays).toBe(1);
    expect(r.remainingDaysRequired).toBe(6);
  });

  it('the build helper rejects a daily log for Nov 8 because the week Nov 5-11 already covers it', () => {
    const result = buildLogFromAnswers(
      { id: 'L4', periodType: 'day', periodStart: '2026-11-08', answers: REV3_DAY_ANSWERS, assumptions: ASSUMPTIONS, finalize: true },
      { today: TODAY, existingLogs: [day, week] },
    );
    expect(result.canFinalize).toBe(false);
    expect(result.errors.map((e) => e.code)).toContain('LOG_OVERLAP');
  });
});

describe('input safety', () => {
  it('rejects an invalid month or mode (programmer errors)', () => {
    expect(() => calculateMonthlyProjection({ logs: [], month: '2026-13', today: TODAY })).toThrow(TypeError);
    expect(() => calculateMonthlyProjection({ logs: [], month: NOV, today: TODAY, mode: 'admin' })).toThrow(RangeError);
  });

  it('ignores logs from other months', () => {
    const r = project([...dailyLogs(7, () => 2), litersLog('oct', 'day', '2026-10-05', 40)]);
    expect(r.coveredDays).toBe(7);
    expect(r.recordedLiters).toBe(700);
  });
});
