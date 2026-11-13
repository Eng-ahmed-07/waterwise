import { WEEK_LENGTH_DAYS } from '@/lib/constants';
import { ERROR_CODES } from './errorCodes';
import { addDays, isValidISODate } from './dates';

export const PERIOD_TYPES = Object.freeze({ DAY: 'day', WEEK: 'week' });

export const isPeriodType = (value) => value === PERIOD_TYPES.DAY || value === PERIOD_TYPES.WEEK;

/** 1 for a day log, 7 for a week log. */
export function periodLengthDays(periodType) {
  if (periodType === PERIOD_TYPES.DAY) return 1;
  if (periodType === PERIOD_TYPES.WEEK) return WEEK_LENGTH_DAYS;
  throw new RangeError(`Unknown period type: ${String(periodType)}`);
}

/** Last date of a period that starts on `periodStart` (a week is 7 consecutive dates, any weekday). */
export function computePeriodEnd(periodType, periodStart) {
  return addDays(periodStart, periodLengthDays(periodType) - 1);
}

function assertToday(today) {
  if (!isValidISODate(today)) throw new TypeError(`"today" must be a valid YYYY-MM-DD date, received: ${String(today)}`);
}

/**
 * Validates a reporting period. Returns an array of errors (empty = valid).
 *  - a day log is exactly one date, a week log is exactly 7 consecutive dates
 *  - a period must have ENDED: periodEnd <= today. The "last 7 days" shortcut (ending today) is
 *    allowed; tomorrow, or a week still running into the future, is rejected (Revision 3: "a log
 *    cannot end in the future"). This applies to drafts as well as complete logs.
 * `today` is passed in so the rule is deterministic and testable.
 */
export function validatePeriod({ periodType, periodStart, periodEnd } = {}, { today }) {
  assertToday(today);
  const errors = [];

  if (!isPeriodType(periodType)) errors.push({ code: ERROR_CODES.PERIOD_TYPE_INVALID, field: 'periodType' });
  if (!isValidISODate(periodStart)) errors.push({ code: ERROR_CODES.DATE_INVALID, field: 'periodStart' });
  if (!isValidISODate(periodEnd)) errors.push({ code: ERROR_CODES.DATE_INVALID, field: 'periodEnd' });
  if (errors.length > 0) return errors;

  const expectedEnd = computePeriodEnd(periodType, periodStart);
  if (periodEnd !== expectedEnd) {
    errors.push({ code: ERROR_CODES.PERIOD_LENGTH_MISMATCH, field: 'periodEnd', params: { expectedEnd } });
  }
  if (periodEnd > today || periodStart > today) {
    errors.push({ code: ERROR_CODES.PERIOD_IN_FUTURE, field: 'periodEnd' });
  }
  return errors;
}

/** True when two inclusive date ranges share at least one date. */
export const rangesOverlap = (aStart, aEnd, bStart, bEnd) => aStart <= bEnd && bStart <= aEnd;

/**
 * Logs whose dates collide with `period`. Drafts count too (a draft occupies its dates, Revision 3).
 * `ignoreLogId` lets a log be edited without conflicting with its own stored version.
 */
export function findOverlaps(period, logs, { ignoreLogId } = {}) {
  if (!isValidISODate(period?.periodStart) || !isValidISODate(period?.periodEnd)) return [];
  return logs.filter(
    (other) =>
      (ignoreLogId === undefined || other.id !== ignoreLogId) &&
      isValidISODate(other.periodStart) &&
      isValidISODate(other.periodEnd) &&
      rangesOverlap(period.periodStart, period.periodEnd, other.periodStart, other.periodEnd),
  );
}
