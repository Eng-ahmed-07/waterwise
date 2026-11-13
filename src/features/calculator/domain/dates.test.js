import { describe, expect, it } from 'vitest';
import { addDays, daysInMonth, diffDays, eachDate, isValidISODate, isValidMonth, lastNDaysStart, monthDates, monthOf, todayISO } from './dates';

describe('calendar dates', () => {
  it('validates real calendar dates only', () => {
    expect(isValidISODate('2026-11-03')).toBe(true);
    expect(isValidISODate('2028-02-29')).toBe(true); // leap day
    expect(isValidISODate('2026-02-29')).toBe(false);
    expect(isValidISODate('2026-02-30')).toBe(false);
    expect(isValidISODate('2026-13-01')).toBe(false);
    expect(isValidISODate('2026-1-1')).toBe(false);
    expect(isValidISODate('')).toBe(false);
    expect(isValidISODate(undefined)).toBe(false);
    expect(isValidISODate(20261103)).toBe(false);
  });

  it('validates months', () => {
    expect(isValidMonth('2026-11')).toBe(true);
    expect(isValidMonth('2026-13')).toBe(false);
    expect(isValidMonth('2026-11-03')).toBe(false);
  });

  it('adds days across month, year and leap boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-11-05', 6)).toBe('2026-11-11');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('is immune to daylight-saving changes (UTC arithmetic)', () => {
    // Egypt changes clocks in spring and autumn: a "day" must still be exactly one calendar date.
    for (const date of ['2026-04-23', '2026-04-24', '2026-04-25', '2026-10-29', '2026-10-30', '2026-10-31']) {
      expect(diffDays(date, addDays(date, 1))).toBe(1);
    }
  });

  it('counts days in a month', () => {
    expect(daysInMonth('2026-02')).toBe(28);
    expect(daysInMonth('2028-02')).toBe(29);
    expect(daysInMonth('2026-11')).toBe(30);
    expect(daysInMonth('2026-12')).toBe(31);
    expect(() => daysInMonth('2026-00')).toThrow(TypeError);
  });

  it('lists every date of a range and of a month', () => {
    expect(eachDate('2026-01-29', '2026-02-04')).toEqual(['2026-01-29', '2026-01-30', '2026-01-31', '2026-02-01', '2026-02-02', '2026-02-03', '2026-02-04']);
    expect(eachDate('2026-11-05', '2026-11-04')).toEqual([]);
    expect(monthDates('2026-02')).toHaveLength(28);
    expect(monthDates('2026-02')[0]).toBe('2026-02-01');
    expect(monthOf('2026-11-30')).toBe('2026-11');
  });

  it('computes the "last 7 days" start and today in local time', () => {
    expect(lastNDaysStart('2026-11-30', 7)).toBe('2026-11-24');
    expect(todayISO(new Date(2026, 10, 8, 23, 59))).toBe('2026-11-08');
    expect(todayISO(new Date(2026, 0, 1, 0, 0))).toBe('2026-01-01');
  });

  it('throws on invalid input instead of returning garbage', () => {
    expect(() => addDays('nope', 1)).toThrow(TypeError);
  });
});
