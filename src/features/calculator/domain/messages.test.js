import { describe, expect, it } from 'vitest';
import { ar } from '@/locales/ar';
import { ERROR_CODES } from './errorCodes';
import { describeError, describePeriod, describeProjection } from './messages';
import { calculateMonthlyProjection } from './monthlyProjection';
import { litersLog, makeLog, REV3_DAY_ANSWERS, TODAY } from './testHelpers';

describe('Arabic messages for domain errors', () => {
  it('has a message for EVERY error code the domain can return (no raw codes reach the UI)', () => {
    for (const code of Object.values(ERROR_CODES)) {
      expect(typeof ar.calculator.errors[code]).not.toBe('undefined');
    }
  });

  it('has no message without a matching code (no stale strings)', () => {
    const codes = new Set(Object.values(ERROR_CODES));
    for (const key of Object.keys(ar.calculator.errors)) expect(codes.has(key)).toBe(true);
  });

  it('formats numbers in params with the app numerals', () => {
    const message = describeError({ code: ERROR_CODES.OCCURRENCES_TOO_LARGE, params: { max: 350 } });
    expect(message).toContain('٣٥٠');
    expect(describeError({ code: ERROR_CODES.HOUSEHOLD_SIZE_INVALID, params: { min: 1, max: 30 } })).toContain('٣٠');
  });

  it('returns plain strings for codes without params', () => {
    expect(describeError({ code: ERROR_CODES.LOG_OVERLAP })).toBe(ar.calculator.errors.LOG_OVERLAP);
  });

  it('throws on an unknown code instead of showing nothing', () => {
    expect(() => describeError({ code: 'NOPE' })).toThrow(RangeError);
  });
});

describe('period names', () => {
  it('names a day by its date', () => {
    expect(describePeriod({ periodType: 'day', periodStart: '2026-11-03', periodEnd: '2026-11-03' })).toBe('يوم ٣ نوفمبر ٢٠٢٦');
  });

  it('names a week by its first and last date', () => {
    expect(describePeriod({ periodType: 'week', periodStart: '2026-11-05', periodEnd: '2026-11-11' })).toBe('الأسبوع من ٥ نوفمبر ٢٠٢٦ إلى ١١ نوفمبر ٢٠٢٦');
  });
});

describe('projection explanations', () => {
  const run = (logs, month = '2026-11') => describeProjection(calculateMonthlyProjection({ logs, month, today: TODAY }));

  it('insufficient data: explains the shortfall in Arabic numerals and gives no formula', () => {
    const text = run([litersLog('a', 'day', '2026-11-01', 1), litersLog('b', 'day', '2026-11-02', 1)]);
    expect(text.summary).toContain('٢ من ٧');
    expect(text.remaining).toBe('المتبقي: ٥');
    expect(text.formula).toBeNull();
  });

  it('partial coverage: states how many complete days it is built from, with the visible formula', () => {
    const text = run([litersLog('w', 'week', '2026-11-05', 14)]);
    expect(text.summary).toContain('٧');
    expect(text.formula).toBe(ar.calculator.projection.formulaWholeMonth);
    expect(text.remaining).toBeNull();
  });

  it('fully covered: says it is a total, not a projection', () => {
    const weeks = ['2026-02-01', '2026-02-08', '2026-02-15', '2026-02-22'].map((d, i) => litersLog(`w${i}`, 'week', d, 14));
    const text = run(weeks, '2026-02');
    expect(text.summary).toBe(ar.calculator.projection.fullyCovered);
    expect(text.formula).toBeNull();
  });

  it('reports excluded drafts', () => {
    const draft = makeLog({ id: 'd', periodStart: '2026-11-01', answers: REV3_DAY_ANSWERS, complete: false });
    expect(run([draft]).excluded).toBe('سجلات غير مُدرجة في الحساب: ١');
    expect(run([]).excluded).toBeNull();
  });
});
