import { describe, expect, it } from 'vitest';
import { ERROR_CODES as E } from './errorCodes';
import { LOG_STATUS, upsertLog, validateLog } from './logValidation';
import { computePeriodEnd, findOverlaps, periodLengthDays, rangesOverlap, validatePeriod } from './periodValidation';
import { makeLog, TODAY } from './testHelpers';

const codes = (errors) => errors.map((e) => e.code);
const period = (periodType, periodStart, periodEnd) => ({ periodType, periodStart, periodEnd });

describe('period shape', () => {
  it('a day is one date, a week is exactly seven consecutive dates', () => {
    expect(periodLengthDays('day')).toBe(1);
    expect(periodLengthDays('week')).toBe(7);
    expect(computePeriodEnd('day', '2026-11-03')).toBe('2026-11-03');
    expect(computePeriodEnd('week', '2026-11-05')).toBe('2026-11-11');
    expect(computePeriodEnd('week', '2026-01-29')).toBe('2026-02-04');
    expect(computePeriodEnd('week', '2028-02-26')).toBe('2028-03-03'); // across a leap day
  });

  it('weeks may start on any weekday', () => {
    for (const start of ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07']) {
      expect(validatePeriod(period('week', start, computePeriodEnd('week', start)), { today: TODAY })).toEqual([]);
    }
  });

  it('rejects a week that is not exactly seven days and a day that spans two', () => {
    expect(codes(validatePeriod(period('week', '2026-11-05', '2026-11-10'), { today: TODAY }))).toContain(E.PERIOD_LENGTH_MISMATCH);
    expect(codes(validatePeriod(period('week', '2026-11-05', '2026-11-12'), { today: TODAY }))).toContain(E.PERIOD_LENGTH_MISMATCH);
    expect(codes(validatePeriod(period('day', '2026-11-05', '2026-11-06'), { today: TODAY }))).toContain(E.PERIOD_LENGTH_MISMATCH);
  });

  it('rejects invalid period types and invalid dates', () => {
    expect(codes(validatePeriod(period('month', '2026-11-01', '2026-11-30'), { today: TODAY }))).toContain(E.PERIOD_TYPE_INVALID);
    expect(codes(validatePeriod(period('day', '2026-02-30', '2026-02-30'), { today: TODAY }))).toContain(E.DATE_INVALID);
    expect(codes(validatePeriod(period('day', '2026-11-05', undefined), { today: TODAY }))).toContain(E.DATE_INVALID);
    expect(codes(validatePeriod({}, { today: TODAY }))).toContain(E.PERIOD_TYPE_INVALID);
  });

  it('requires a valid "today" (programmer error, not user error)', () => {
    expect(() => validatePeriod(period('day', '2026-11-05', '2026-11-05'), { today: 'soon' })).toThrow(TypeError);
  });
});

describe('future and unended periods', () => {
  it('accepts a day log for today and for the past', () => {
    expect(validatePeriod(period('day', '2026-11-30', '2026-11-30'), { today: TODAY })).toEqual([]);
    expect(validatePeriod(period('day', '2026-01-01', '2026-01-01'), { today: TODAY })).toEqual([]);
  });

  it('rejects a day log for tomorrow', () => {
    expect(codes(validatePeriod(period('day', '2026-12-01', '2026-12-01'), { today: TODAY }))).toEqual([E.PERIOD_IN_FUTURE]);
  });

  it('accepts a week that ends today (the "last 7 days" shortcut)', () => {
    expect(validatePeriod(period('week', '2026-11-24', '2026-11-30'), { today: TODAY })).toEqual([]);
  });

  it('rejects a week that has not ended yet, even if it has already started', () => {
    expect(codes(validatePeriod(period('week', '2026-11-25', '2026-12-01'), { today: TODAY }))).toContain(E.PERIOD_IN_FUTURE);
    expect(codes(validatePeriod(period('week', '2026-11-30', '2026-12-06'), { today: TODAY }))).toContain(E.PERIOD_IN_FUTURE);
  });

  it('applies to drafts too: a draft cannot be saved for an unended period', () => {
    const draft = makeLog({ id: 'a', periodStart: '2026-12-01', complete: false, today: '2026-12-01' });
    expect(codes(validateLog(draft, { today: TODAY }).errors)).toContain(E.PERIOD_IN_FUTURE);
  });

  it('a complete weekly log for an unended week is rejected', () => {
    const week = makeLog({ id: 'w', periodType: 'week', periodStart: '2026-11-25', today: '2026-12-31' });
    const result = validateLog(week, { today: TODAY });
    expect(result.isComplete).toBe(false);
    expect(codes(result.errors)).toContain(E.PERIOD_IN_FUTURE);
  });
});

describe('overlap detection', () => {
  it('detects shared dates between inclusive ranges and ignores touching ones', () => {
    expect(rangesOverlap('2026-11-01', '2026-11-07', '2026-11-07', '2026-11-13')).toBe(true);
    expect(rangesOverlap('2026-11-01', '2026-11-07', '2026-11-08', '2026-11-14')).toBe(false);
  });

  it('rejects two daily logs for the same date', () => {
    const existing = [makeLog({ id: 'a', periodStart: '2026-11-10' })];
    const duplicate = makeLog({ id: 'b', periodStart: '2026-11-10' });
    const result = validateLog(duplicate, { today: TODAY, existingLogs: existing });
    expect(codes(result.errors)).toContain(E.LOG_OVERLAP);
    expect(result.isValid).toBe(false);
    expect(result.isComplete).toBe(false);
  });

  it('allows different daily logs on adjacent dates', () => {
    const existing = [makeLog({ id: 'a', periodStart: '2026-11-10' })];
    expect(validateLog(makeLog({ id: 'b', periodStart: '2026-11-11' }), { today: TODAY, existingLogs: existing }).isValid).toBe(true);
  });

  it('rejects a daily log that falls inside an existing weekly log (Revision 3: Nov 8 inside Nov 5-11)', () => {
    const existing = [makeLog({ id: 'w', periodType: 'week', periodStart: '2026-11-05' })];
    const result = validateLog(makeLog({ id: 'd', periodStart: '2026-11-08' }), { today: TODAY, existingLogs: existing });
    expect(codes(result.errors)).toContain(E.LOG_OVERLAP);
    expect(result.errors[0].params.withLogId).toBe('w');
  });

  it('rejects a weekly log that contains an existing daily log, at either end of the week', () => {
    const existing = [makeLog({ id: 'd', periodStart: '2026-11-11' })];
    expect(validateLog(makeLog({ id: 'w1', periodType: 'week', periodStart: '2026-11-05' }), { today: TODAY, existingLogs: existing }).isValid).toBe(false);
    expect(validateLog(makeLog({ id: 'w2', periodType: 'week', periodStart: '2026-11-11' }), { today: TODAY, existingLogs: existing }).isValid).toBe(false);
    expect(validateLog(makeLog({ id: 'w3', periodType: 'week', periodStart: '2026-11-12' }), { today: TODAY, existingLogs: existing }).isValid).toBe(true);
  });

  it('rejects partially overlapping weekly logs', () => {
    const existing = [makeLog({ id: 'w', periodType: 'week', periodStart: '2026-11-05' })];
    expect(validateLog(makeLog({ id: 'x', periodType: 'week', periodStart: '2026-11-09' }), { today: TODAY, existingLogs: existing }).isValid).toBe(false);
    expect(validateLog(makeLog({ id: 'y', periodType: 'week', periodStart: '2026-11-12' }), { today: TODAY, existingLogs: existing }).isValid).toBe(true);
  });

  it('drafts occupy their dates too', () => {
    const draft = makeLog({ id: 'draft', periodStart: '2026-11-10', complete: false });
    expect(draft.status).toBe(LOG_STATUS.DRAFT);
    expect(validateLog(makeLog({ id: 'b', periodStart: '2026-11-10' }), { today: TODAY, existingLogs: [draft] }).isValid).toBe(false);
  });

  it('a log never conflicts with its own stored version', () => {
    const log = makeLog({ id: 'a', periodStart: '2026-11-10' });
    expect(validateLog(log, { today: TODAY, existingLogs: [log] }).isValid).toBe(true);
    expect(findOverlaps(log, [log], { ignoreLogId: 'a' })).toEqual([]);
    expect(findOverlaps(log, [log])).toHaveLength(1);
  });
});

describe('editing keeps data integrity (upsertLog)', () => {
  const week = makeLog({ id: 'w', periodType: 'week', periodStart: '2026-11-05' });
  const day = makeLog({ id: 'd', periodStart: '2026-11-20' });
  const stored = Object.freeze([week, day]);

  it('adds a valid new log without mutating the input array', () => {
    const result = upsertLog(stored, makeLog({ id: 'n', periodStart: '2026-11-25' }), { today: TODAY });
    expect(result.ok).toBe(true);
    expect(result.logs).toHaveLength(3);
    expect(stored).toHaveLength(2);
  });

  it('edits a log in place (same period) and replaces it by id', () => {
    const edited = makeLog({ id: 'd', periodStart: '2026-11-20', householdSize: 5 });
    const result = upsertLog(stored, edited, { today: TODAY });
    expect(result.ok).toBe(true);
    expect(result.logs).toHaveLength(2);
    expect(result.logs.find((l) => l.id === 'd').householdSize).toBe(5);
  });

  it('refuses to MOVE a log onto another log\'s dates, and leaves everything unchanged', () => {
    const moved = makeLog({ id: 'd', periodStart: '2026-11-08' }); // lands inside the Nov 5-11 week
    const result = upsertLog(stored, moved, { today: TODAY });
    expect(result.ok).toBe(false);
    expect(codes(result.errors)).toContain(E.LOG_OVERLAP);
    expect(result.logs).toBe(stored);
  });

  it('refuses to turn a daily log into a weekly one that would overlap', () => {
    const grown = makeLog({ id: 'd', periodType: 'week', periodStart: '2026-11-14' }); // Nov 14-20 vs week Nov 5-11 is fine
    expect(upsertLog(stored, grown, { today: TODAY }).ok).toBe(true);
    const overlapping = makeLog({ id: 'd', periodType: 'week', periodStart: '2026-11-11' });
    expect(upsertLog(stored, overlapping, { today: TODAY }).ok).toBe(false);
  });

  it('revalidates completeness on edit: a log edited into an incomplete state cannot stay "complete"', () => {
    const broken = { ...day, entries: day.entries.slice(0, 4) };
    const result = upsertLog(stored, broken, { today: TODAY });
    expect(result.ok).toBe(false);
    expect(codes(result.errors)).toContain(E.COMPLETE_STATUS_MISMATCH);
  });

  it('revalidates totals on edit: tampered liters are rejected', () => {
    const tampered = { ...day, entries: day.entries.map((e, i) => (i === 4 ? { ...e, occurrences: 3 } : e)) };
    expect(codes(upsertLog(stored, tampered, { today: TODAY }).errors)).toContain(E.LITERS_MISMATCH);
  });

  it('revalidates uniqueness on edit', () => {
    const duplicated = { ...day, entries: [...day.entries, day.entries[0]] };
    expect(codes(upsertLog(stored, duplicated, { today: TODAY }).errors)).toContain(E.ACTIVITY_DUPLICATE);
  });

  it('requires an id', () => {
    const noId = { ...day, id: undefined };
    expect(codes(upsertLog(stored, noId, { today: TODAY }).errors)).toEqual([E.LOG_ID_MISSING]);
  });
});
