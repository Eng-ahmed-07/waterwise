import { describe, expect, it } from 'vitest';
import { formatDate, formatMonth, formatNumber, formatQuantity } from './format';
import { UNITS } from './units';

describe('formatNumber', () => {
  it('formats with Arabic-Indic numerals', () => {
    expect(formatNumber(4142, { numerals: 'arab' })).toBe('٤٬١٤٢');
    expect(formatNumber(15532.5, { fractionDigits: 2, numerals: 'arab' })).toBe('١٥٬٥٣٢٫٥');
  });

  it('formats with Western numerals when configured', () => {
    expect(formatNumber(4142, { numerals: 'latn' })).toBe('4,142');
    expect(formatNumber(15532.5, { fractionDigits: 2, numerals: 'latn' })).toBe('15,532.5');
  });

  it('defaults to the configured numeral system (Arabic-Indic)', () => {
    expect(formatNumber(8)).toBe('٨');
  });

  it('rounds to the requested precision', () => {
    expect(formatNumber(517.75, { numerals: 'latn' })).toBe('518');
    expect(formatNumber(129.4375, { fractionDigits: 2, numerals: 'latn' })).toBe('129.44');
  });

  it('never shows a negative zero', () => {
    expect(formatNumber(-0, { numerals: 'latn' })).toBe('0');
    expect(formatNumber(-0.2, { numerals: 'latn' })).toBe('0');
  });

  it('rejects non-numbers instead of printing garbage', () => {
    expect(() => formatNumber(NaN)).toThrow(TypeError);
    expect(() => formatNumber(Infinity)).toThrow(TypeError);
    expect(() => formatNumber('12')).toThrow(TypeError);
    expect(() => formatNumber(undefined)).toThrow(TypeError);
  });

  it('rejects an unknown numeral system', () => {
    expect(() => formatNumber(1, { numerals: 'xx' })).toThrow(RangeError);
  });
});

describe('formatQuantity', () => {
  it('uses whole liters by default (estimates should not look falsely precise)', () => {
    expect(formatQuantity(494, UNITS.LITER, { numerals: 'latn' })).toEqual({ number: '494', unitLabel: 'لتر', unit: 'liter' });
    expect(formatQuantity(4142, UNITS.LITER, { numerals: 'latn' }).number).toBe('4,142');
  });

  it('uses two decimals for cubic meters (the approved Revision 3 example: 15.53 m3)', () => {
    const q = formatQuantity(15.5325, UNITS.CUBIC_METER, { numerals: 'latn' });
    expect(q.number).toBe('15.53');
    expect(q.unitLabel).toBe('م³');
  });

  it('labels per-day and per-person units', () => {
    expect(formatQuantity(517.75, UNITS.LITER_PER_DAY, { numerals: 'latn' }).unitLabel).toBe('لتر/يوم');
    expect(formatQuantity(129.44, UNITS.LITER_PER_PERSON_DAY, { numerals: 'latn' }).number).toBe('129');
    expect(formatQuantity(129.44, UNITS.LITER_PER_PERSON_DAY, { numerals: 'latn' }).unitLabel).toBe('لتر/فرد/يوم');
  });

  it('allows a precision override', () => {
    expect(formatQuantity(517.75, UNITS.LITER_PER_DAY, { fractionDigits: 2, numerals: 'latn' }).number).toBe('517.75');
  });

  it('does not convert units (liters stay liters)', () => {
    expect(formatQuantity(15532.5, UNITS.LITER, { numerals: 'latn' }).number).toBe('15,533');
  });

  it('rejects an unknown unit', () => {
    expect(() => formatQuantity(1, 'gallon')).toThrow(RangeError);
  });
});

describe('formatDate and formatMonth', () => {
  it('formats a calendar date in Arabic with the configured numerals', () => {
    expect(formatDate('2026-11-03', { numerals: 'latn' })).toBe('3 نوفمبر 2026');
    expect(formatDate('2026-11-03', { numerals: 'arab' })).toBe('٣ نوفمبر ٢٠٢٦');
  });

  it('never shifts the date by the viewer\'s time zone', () => {
    expect(formatDate('2026-01-01', { numerals: 'latn' })).toBe('1 يناير 2026');
    expect(formatDate('2026-12-31', { numerals: 'latn' })).toBe('31 ديسمبر 2026');
    expect(formatDate('2028-02-29', { numerals: 'latn' })).toBe('29 فبراير 2028');
  });

  it('formats a month', () => {
    expect(formatMonth('2026-02', { numerals: 'latn' })).toBe('فبراير 2026');
    expect(formatMonth('2026-11', { numerals: 'arab' })).toBe('نوفمبر ٢٠٢٦');
  });

  it('rejects malformed input', () => {
    expect(() => formatDate('2026-11-3')).toThrow(TypeError);
    expect(() => formatDate(undefined)).toThrow(TypeError);
    expect(() => formatMonth('2026-11-03')).toThrow(TypeError);
  });
});
