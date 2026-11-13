import { describe, expect, it } from 'vitest';
import { ERROR_CODES as E } from './errorCodes';
import { confirmPeriodReset, requestPeriodReset } from './periodReset';
import { litersLog } from './testHelpers';

const week = litersLog('w', 'week', '2026-11-05', 4);
const dayA = litersLog('a', 'day', '2026-11-20', 1);
const dayB = litersLog('b', 'day', '2026-11-21', 1);
const stored = Object.freeze([week, dayA, dayB]);

describe('period reset: step 1, identify and request confirmation', () => {
  it('names exactly which period would be affected, without removing anything', () => {
    const result = requestPeriodReset(stored, { periodType: 'week', periodStart: '2026-11-05' });
    expect(result.ok).toBe(true);
    expect(result.confirmation).toEqual({ logId: 'w', periodType: 'week', periodStart: '2026-11-05', periodEnd: '2026-11-11', status: 'complete', entryCount: 6 });
    expect(stored).toHaveLength(3);
  });

  it('matches the period type as well as the start date', () => {
    expect(requestPeriodReset(stored, { periodType: 'day', periodStart: '2026-11-05' }).ok).toBe(false);
    expect(requestPeriodReset(stored, { periodType: 'week', periodStart: '2026-11-20' }).ok).toBe(false);
  });

  it('reports LOG_NOT_FOUND when nothing is stored for that period', () => {
    expect(requestPeriodReset(stored, { periodType: 'day', periodStart: '2026-01-01' }).errors[0].code).toBe(E.LOG_NOT_FOUND);
  });
});

describe('period reset: step 2, confirmed deletion', () => {
  it('removes only the confirmed period and returns a new array', () => {
    const { confirmation } = requestPeriodReset(stored, { periodType: 'day', periodStart: '2026-11-20' });
    const result = confirmPeriodReset(stored, confirmation);
    expect(result.ok).toBe(true);
    expect(result.logs.map((l) => l.id)).toEqual(['w', 'b']);
    expect(result.removed.id).toBe('a');
    expect(stored).toHaveLength(3);
  });

  it('never deletes anything without a confirmation', () => {
    for (const missing of [undefined, null, {}, 'yes', true]) {
      const result = confirmPeriodReset(stored, missing);
      expect(result.ok).toBe(false);
      expect(result.errors[0].code).toBe(E.CONFIRMATION_REQUIRED);
      expect(result.logs).toBe(stored);
    }
  });

  it('refuses if the log no longer matches the confirmed period, so a different period is never deleted', () => {
    const { confirmation } = requestPeriodReset(stored, { periodType: 'day', periodStart: '2026-11-20' });
    const moved = stored.map((l) => (l.id === 'a' ? { ...l, periodStart: '2026-11-25', periodEnd: '2026-11-25' } : l));
    const result = confirmPeriodReset(moved, confirmation);
    expect(result.ok).toBe(false);
    expect(result.errors[0].code).toBe(E.RESET_TARGET_MISMATCH);
    expect(result.logs).toBe(moved);
  });

  it('refuses if the log was already deleted', () => {
    const { confirmation } = requestPeriodReset(stored, { periodType: 'day', periodStart: '2026-11-20' });
    const gone = stored.filter((l) => l.id !== 'a');
    expect(confirmPeriodReset(gone, confirmation).errors[0].code).toBe(E.LOG_NOT_FOUND);
  });

  it('leaves the remaining logs valid for projections (integrity preserved)', () => {
    const { confirmation } = requestPeriodReset(stored, { periodType: 'week', periodStart: '2026-11-05' });
    const { logs } = confirmPeriodReset(stored, confirmation);
    expect(logs.every((l) => l.entries.length === 6)).toBe(true);
  });
});
