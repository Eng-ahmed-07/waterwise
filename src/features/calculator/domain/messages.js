import { formatDate, formatNumber } from '@/lib/format';
import { ar } from '@/locales/ar';
import { PROJECTION_STATUS } from './monthlyProjection';

// Turns domain codes into Arabic text. The sentences live in locales/ar.js; this file only picks
// them and formats numbers and dates (Arabic-Indic digits by default).

const fmt = (params = {}) =>
  Object.fromEntries(Object.entries(params).map(([key, value]) => [key, typeof value === 'number' ? formatNumber(value) : value]));

/** Arabic message for a domain error { code, params }. Throws for an unknown code (a bug, not user data). */
export function describeError(error) {
  const message = ar.calculator.errors[error?.code];
  if (message === undefined) throw new RangeError(`No Arabic message for error code: ${String(error?.code)}`);
  return typeof message === 'function' ? message(fmt(error.params)) : message;
}

/** "يوم ٣ نوفمبر ٢٠٢٦" or "الأسبوع من ... إلى ...". Used wherever a period must be named exactly. */
export function describePeriod({ periodType, periodStart, periodEnd }) {
  return periodType === 'week'
    ? ar.calculator.period.week({ start: formatDate(periodStart), end: formatDate(periodEnd) })
    : ar.calculator.period.day({ date: formatDate(periodStart) });
}

/** Arabic explanation for a calculateMonthlyProjection result: { summary, formula, remaining, excluded }. */
export function describeProjection(result) {
  const text = ar.calculator.projection;
  const numbers = fmt(result.explanation.params);

  const summary =
    result.status === PROJECTION_STATUS.INSUFFICIENT_DATA
      ? text.insufficient(numbers)
      : result.status === PROJECTION_STATUS.FULLY_COVERED
        ? text.fullyCovered
        : text.partial(numbers);

  return {
    summary,
    formula: result.calculation.formulaKey ? text[result.calculation.formulaKey] : null,
    remaining: result.status === PROJECTION_STATUS.INSUFFICIENT_DATA ? text.remaining(numbers) : null,
    excluded: result.draftLogsExcluded > 0 ? text.excludedLogs({ count: formatNumber(result.draftLogsExcluded) }) : null,
  };
}
