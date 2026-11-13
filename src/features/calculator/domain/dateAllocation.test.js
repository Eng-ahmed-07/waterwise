import { describe, expect, it } from 'vitest';
import { allocateLogToDates, buildCoverage, EXCLUSION_REASONS, selectContributingLogs, summarizeDates } from './dateAllocation';
import { eachDate } from './dates';
import { close, litersLog, makeLog, REV3_DAY_ANSWERS, TODAY } from './testHelpers';

describe('allocating a log to calendar dates', () => {
  it('spreads a weekly log as total / 7 on each of its 7 dates, not onto the start date', () => {
    const week = litersLog('w', 'week', '2026-11-05', 14); // 700 L
    const spread = allocateLogToDates(week, 700);
    expect(spread.map((s) => s.date)).toEqual(eachDate('2026-11-05', '2026-11-11'));
    for (const { liters } of spread) expect(liters).toBe(100);
    expect(close(spread.reduce((sum, s) => sum + s.liters, 0), 700)).toBe(true);
  });

  it('gives a day log its whole total on its single date', () => {
    const spread = allocateLogToDates(litersLog('d', 'day', '2026-11-03', 2), 100);
    expect(spread).toEqual([{ date: '2026-11-03', liters: 100, logId: 'd', periodType: 'day' }]);
  });

  it('splits a week that crosses a month boundary across the two months (Jan 29 - Feb 4)', () => {
    const { dates } = buildCoverage([litersLog('w', 'week', '2026-01-29', 14)], { today: '2026-12-31' });
    const jan = summarizeDates([...dates].filter(([d]) => d.startsWith('2026-01')).map(([, v]) => v));
    const feb = summarizeDates([...dates].filter(([d]) => d.startsWith('2026-02')).map(([, v]) => v));
    expect(jan.coveredDays).toBe(3);
    expect(feb.coveredDays).toBe(4);
    expect(jan.totalLiters).toBe(300); // 3/7 of 700
    expect(feb.totalLiters).toBe(400); // 4/7 of 700
    expect(jan.totalLiters + feb.totalLiters).toBe(700);
  });
});

describe('which logs contribute', () => {
  it('excludes drafts from every metric and reports them', () => {
    const complete = litersLog('c', 'day', '2026-11-03', 2);
    const draft = makeLog({ id: 'd', periodStart: '2026-11-04', answers: { shower: { occurrences: 9, durationMinutes: 30 } }, complete: false });
    const { dates, excluded } = buildCoverage([complete, draft], { today: TODAY });
    expect([...dates.keys()]).toEqual(['2026-11-03']);
    expect(excluded).toEqual([{ logId: 'd', reason: EXCLUSION_REASONS.DRAFT }]);
    expect(summarizeDates(dates.values()).totalLiters).toBe(100);
  });

  it('excludes a draft even when all six activities were answered', () => {
    const fullDraft = makeLog({ id: 'f', periodStart: '2026-11-04', answers: REV3_DAY_ANSWERS, complete: false });
    expect(buildCoverage([fullDraft], { today: TODAY }).dates.size).toBe(0);
  });

  it('excludes a log that claims to be complete but is not, with the reasons', () => {
    const good = makeLog({ id: 'g', periodStart: '2026-11-03', answers: REV3_DAY_ANSWERS });
    const forged = { ...good, id: 'forged', periodStart: '2026-11-04', periodEnd: '2026-11-04', entries: good.entries.slice(0, 3) };
    const { contributing, excluded } = selectContributingLogs([good, forged], { today: TODAY });
    expect(contributing.map((l) => l.id)).toEqual(['g']);
    expect(excluded[0].reason).toBe(EXCLUSION_REASONS.INVALID);
    expect(excluded[0].errorCodes).toContain('COMPLETE_STATUS_MISMATCH');
  });

  it('excludes a complete log whose period has not ended yet', () => {
    const early = makeLog({ id: 'e', periodStart: '2026-12-05', today: '2026-12-31' });
    const { excluded } = selectContributingLogs([early], { today: TODAY });
    expect(excluded[0].reason).toBe(EXCLUSION_REASONS.INVALID);
    expect(excluded[0].errorCodes).toContain('PERIOD_IN_FUTURE');
  });
});

describe('a date is never counted twice', () => {
  it('excludes BOTH logs of an overlapping complete pair instead of guessing, and still counts others', () => {
    const week = litersLog('w', 'week', '2026-11-05', 14);
    const dayInside = litersLog('d', 'day', '2026-11-08', 2);
    const separate = litersLog('s', 'day', '2026-11-20', 1);
    const { dates, excluded, contributing } = buildCoverage([week, dayInside, separate], { today: TODAY });

    expect(contributing.map((l) => l.id)).toEqual(['s']);
    expect(excluded.map((e) => `${e.logId}:${e.reason}`).sort()).toEqual([`d:${EXCLUSION_REASONS.OVERLAP}`, `w:${EXCLUSION_REASONS.OVERLAP}`]);
    expect(excluded.find((e) => e.logId === 'd').conflictsWith).toEqual(['w']);
    expect([...dates.keys()]).toEqual(['2026-11-20']);
  });

  it('every covered date appears exactly once across many logs', () => {
    const logs = [litersLog('a', 'week', '2026-11-01', 7), litersLog('b', 'week', '2026-11-08', 7), litersLog('c', 'day', '2026-11-15', 1), litersLog('d', 'day', '2026-11-16', 1)];
    const { dates } = buildCoverage(logs, { today: TODAY });
    const expectedDays = 7 + 7 + 1 + 1;
    expect(dates.size).toBe(expectedDays);
    expect(new Set(dates.keys()).size).toBe(expectedDays);
  });

  it('is deterministic regardless of the order the logs are given in', () => {
    const logs = [litersLog('a', 'week', '2026-11-01', 7), litersLog('b', 'day', '2026-11-10', 2)];
    const forward = buildCoverage(logs, { today: TODAY });
    const backward = buildCoverage([...logs].reverse(), { today: TODAY });
    expect([...forward.dates]).toEqual([...backward.dates].sort(([x], [y]) => (x < y ? -1 : 1)));
  });
});

describe('summarizeDates', () => {
  it('returns null average for no dates instead of NaN', () => {
    expect(summarizeDates([])).toEqual({ coveredDays: 0, totalLiters: 0, averageDailyLiters: null });
  });
});
