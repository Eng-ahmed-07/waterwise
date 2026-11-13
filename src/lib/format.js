import { NUMERAL_SYSTEM } from './constants';
import { UNIT_FRACTION_DIGITS, isUnit } from './units';
import { ar } from '../locales/ar';

// arab -> Arabic-Indic digits, latn -> Western digits (the same value renders as ١٥٬٥٣٢٫٥ or 15,532.5).
const NUMERAL_LOCALES = {
  arab: 'ar-EG-u-nu-arab',
  latn: 'ar-EG-u-nu-latn',
};

const formatterCache = new Map();

function getFormatter(numerals, fractionDigits) {
  const key = `${numerals}:${fractionDigits}`;
  let formatter = formatterCache.get(key);
  if (!formatter) {
    const locale = NUMERAL_LOCALES[numerals];
    if (!locale) throw new RangeError(`Unknown numeral system: ${numerals}`);
    formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: fractionDigits,
    });
    formatterCache.set(key, formatter);
  }
  return formatter;
}

/**
 * Formats a number for display.
 * formatNumber(15532.5, { fractionDigits: 2 }) -> '١٥٬٥٣٢٫٥' (arab) or '15,532.5' (latn)
 */
export function formatNumber(value, { fractionDigits = 0, numerals = NUMERAL_SYSTEM } = {}) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`formatNumber expects a finite number, received: ${String(value)}`);
  }
  // Avoid showing "-٠" for values that round to zero.
  const threshold = 0.5 * 10 ** -fractionDigits;
  const safe = Math.abs(value) < threshold ? 0 : value;
  return getFormatter(numerals, fractionDigits).format(safe);
}

/**
 * Formats a quantity with its unit, returned in two parts so the UI can style them separately.
 * It does NOT convert units: pass the value already expressed in `unit`.
 * formatQuantity(15.5325, 'cubicMeter') -> { number: '١٥٫٥٣', unitLabel: 'م³', unit: 'cubicMeter' }
 */
export function formatQuantity(value, unit, { fractionDigits, numerals } = {}) {
  if (!isUnit(unit)) throw new RangeError(`Unknown unit: ${String(unit)}`);
  const digits = fractionDigits ?? UNIT_FRACTION_DIGITS[unit];
  return {
    number: formatNumber(value, { fractionDigits: digits, numerals }),
    unitLabel: ar.units[unit],
    unit,
  };
}

const dateFormatterCache = new Map();

function getDateFormatter(numerals, kind) {
  const key = `${numerals}:${kind}`;
  let formatter = dateFormatterCache.get(key);
  if (!formatter) {
    const locale = NUMERAL_LOCALES[numerals];
    if (!locale) throw new RangeError(`Unknown numeral system: ${numerals}`);
    const options = kind === 'month' ? { month: 'long', year: 'numeric' } : { day: 'numeric', month: 'long', year: 'numeric' };
    // UTC on purpose: calendar dates are stored as 'YYYY-MM-DD' strings with no time zone,
    // so formatting must never shift them by the viewer's offset.
    formatter = new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' });
    dateFormatterCache.set(key, formatter);
  }
  return formatter;
}

/** Formats a calendar date string ('2026-11-03') for display. Gregorian calendar, no time-zone shift. */
export function formatDate(isoDate, { numerals = NUMERAL_SYSTEM } = {}) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) throw new TypeError(`formatDate expects 'YYYY-MM-DD', received: ${String(isoDate)}`);
  const ms = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return getDateFormatter(numerals, 'date').format(new Date(ms));
}

/** Formats a month string ('2026-02') for display. */
export function formatMonth(isoMonth, { numerals = NUMERAL_SYSTEM } = {}) {
  const match = /^(\d{4})-(\d{2})$/.exec(isoMonth);
  if (!match) throw new TypeError(`formatMonth expects 'YYYY-MM', received: ${String(isoMonth)}`);
  const ms = Date.UTC(Number(match[1]), Number(match[2]) - 1, 1);
  return getDateFormatter(numerals, 'month').format(new Date(ms));
}
