import { VALIDATION_LIMITS as LIMITS } from '@/lib/constants';
import { CALC_TYPES, REQUIRED_ACTIVITY_IDS, getActivityDefinition, isActivityId } from './activityDefinitions';
import { calculateLiters, dailyEquivalent, sumLiters } from './calculations';
import { ERROR_CODES as E } from './errorCodes';
import { getCompleteness } from './logCompleteness';
import { findOverlaps, isPeriodType, periodLengthDays, validatePeriod } from './periodValidation';

// Log shape (independent of any database; Phase 4 maps it to consumption_logs / consumption_entries):
//   {
//     id: string,                          caller-supplied (a uuid later)
//     periodType: 'day' | 'week',
//     periodStart: 'YYYY-MM-DD',
//     periodEnd: 'YYYY-MM-DD',             day: = start.  week: = start + 6
//     status: 'draft' | 'complete',        what the user asked for; verified here, never trusted
//     householdSize?: integer,             snapshot, used for per-member figures later
//     entries: [{ activityId, occurrences, durationMinutes, rateUsed, estimatedLiters }]
//   }
// Only ANSWERED activities have an entry. A missing entry means "not answered yet".

export const LOG_STATUS = Object.freeze({ DRAFT: 'draft', COMPLETE: 'complete' });

const LITERS_TOLERANCE = 1e-6;
const isNumber = (v) => typeof v === 'number' && Number.isFinite(v);
const isNil = (v) => v === null || v === undefined;

/** Validates one entry against its period type. Returns an array of errors (empty = valid). */
export function validateEntry(entry, { periodType } = {}) {
  const errors = [];
  const activityId = entry?.activityId;
  const push = (code, extra = {}) => errors.push({ code, activityId, ...extra });

  if (!isActivityId(activityId)) return [{ code: E.ACTIVITY_UNKNOWN, activityId }];
  const definition = getActivityDefinition(activityId);

  // Occurrences: the TOTAL number of times in the whole period.
  const days = isPeriodType(periodType) ? periodLengthDays(periodType) : 1;
  const maxOccurrences = LIMITS.MAX_OCCURRENCES_PER_DAY * days;
  const { occurrences } = entry;
  let occurrencesValid = false;

  if (isNil(occurrences)) push(E.OCCURRENCES_MISSING, { field: 'occurrences' });
  else if (!isNumber(occurrences)) push(E.OCCURRENCES_INVALID, { field: 'occurrences' });
  else if (occurrences < 0) push(E.OCCURRENCES_NEGATIVE, { field: 'occurrences' });
  else if (!Number.isInteger(occurrences)) push(E.OCCURRENCES_NOT_INTEGER, { field: 'occurrences' });
  else if (occurrences > maxOccurrences) push(E.OCCURRENCES_TOO_LARGE, { field: 'occurrences', params: { max: maxOccurrences } });
  else occurrencesValid = true;

  // Duration (one occurrence): flow activities with occurrences > 0 only. Zero use needs no duration.
  const { durationMinutes } = entry;
  if (definition.calcType === CALC_TYPES.FLOW && occurrencesValid && occurrences > 0) {
    if (isNil(durationMinutes)) push(E.DURATION_MISSING, { field: 'durationMinutes' });
    else if (!isNumber(durationMinutes)) push(E.DURATION_INVALID, { field: 'durationMinutes' });
    else if (durationMinutes < 0) push(E.DURATION_NEGATIVE, { field: 'durationMinutes' });
    else if (durationMinutes === 0) push(E.DURATION_ZERO, { field: 'durationMinutes' });
    else if (durationMinutes > LIMITS.MAX_DURATION_MINUTES) {
      push(E.DURATION_TOO_LARGE, { field: 'durationMinutes', params: { max: LIMITS.MAX_DURATION_MINUTES } });
    }
  } else if (!isNil(durationMinutes)) {
    push(E.DURATION_NOT_APPLICABLE, { field: 'durationMinutes' });
  }

  // Rate snapshot.
  const maxRate = definition.calcType === CALC_TYPES.FLOW ? LIMITS.MAX_FLOW_LPM : LIMITS.MAX_LITERS_PER_CYCLE;
  if (!isNumber(entry.rateUsed) || entry.rateUsed <= 0) push(E.RATE_INVALID, { field: 'rateUsed' });
  else if (entry.rateUsed > maxRate) push(E.RATE_TOO_LARGE, { field: 'rateUsed', params: { max: maxRate } });

  // The stored liters must equal what the canonical engine computes from the inputs.
  if (errors.length === 0) {
    const expected =
      occurrences === 0
        ? 0
        : calculateLiters({ calcType: definition.calcType, rate: entry.rateUsed, occurrences, durationMinutes });
    if (!isNumber(entry.estimatedLiters) || Math.abs(entry.estimatedLiters - expected) > LITERS_TOLERANCE * Math.max(1, expected)) {
      push(E.LITERS_MISMATCH, { field: 'estimatedLiters' });
    }
  }
  return errors;
}

/**
 * Validates a whole log (period, entries, uniqueness, overlap, size, status) and reports completeness.
 *
 * Returns { errors, isValid, completeness, isComplete, status, totalLiters, dailyEquivalentLiters,
 *           partialSubtotalLiters }.
 *  - isValid:    no errors. A partly filled draft is VALID: it is just not complete.
 *  - isComplete: valid AND declared "complete" AND all six activities answered with valid entries.
 *  - totalLiters / dailyEquivalentLiters exist ONLY for a complete log. A draft only exposes
 *    partialSubtotalLiters, which must never feed any total, average or projection.
 * Declaring "complete" without all six answered is an error (COMPLETE_STATUS_MISMATCH): the flag is
 * checked here, never trusted.
 */
export function validateLog(log, { today, existingLogs = [] }) {
  if (!log || typeof log !== 'object') throw new TypeError('validateLog expects a log object.');
  const errors = [...validatePeriod(log, { today })];

  if (log.status !== LOG_STATUS.DRAFT && log.status !== LOG_STATUS.COMPLETE) errors.push({ code: E.STATUS_INVALID, field: 'status' });

  if (!isNil(log.householdSize)) {
    const size = log.householdSize;
    if (!Number.isInteger(size) || size < LIMITS.MIN_HOUSEHOLD_SIZE || size > LIMITS.MAX_HOUSEHOLD_SIZE) {
      errors.push({
        code: E.HOUSEHOLD_SIZE_INVALID,
        field: 'householdSize',
        params: { min: LIMITS.MIN_HOUSEHOLD_SIZE, max: LIMITS.MAX_HOUSEHOLD_SIZE },
      });
    }
  }

  // Entries: unique per activity, each valid.
  const validEntries = [];
  if (!Array.isArray(log.entries)) {
    errors.push({ code: E.ENTRIES_INVALID, field: 'entries' });
  } else {
    const seen = new Set();
    for (const entry of log.entries) {
      const entryErrors = validateEntry(entry, { periodType: log.periodType });
      if (seen.has(entry?.activityId)) {
        entryErrors.unshift({ code: E.ACTIVITY_DUPLICATE, activityId: entry.activityId });
      }
      seen.add(entry?.activityId);
      if (entryErrors.length === 0) validEntries.push(entry);
      errors.push(...entryErrors);
    }
  }

  // Overlap with any other log (drafts included). Own stored version is ignored when editing.
  for (const other of findOverlaps(log, existingLogs, { ignoreLogId: log.id })) {
    errors.push({ code: E.LOG_OVERLAP, field: 'periodStart', params: { withLogId: other.id } });
  }

  const completeness = getCompleteness(validEntries);
  if (log.status === LOG_STATUS.COMPLETE && !completeness.isComplete) {
    errors.push({ code: E.COMPLETE_STATUS_MISMATCH, field: 'status', params: { missing: completeness.missingIds } });
  }

  const isValid = errors.length === 0;
  const isComplete = isValid && log.status === LOG_STATUS.COMPLETE && completeness.isComplete;
  const subtotal = sumLiters(validEntries.map((e) => e.estimatedLiters));

  return {
    errors,
    isValid,
    completeness,
    isComplete,
    status: isComplete ? LOG_STATUS.COMPLETE : LOG_STATUS.DRAFT,
    totalLiters: isComplete ? subtotal : null,
    dailyEquivalentLiters: isComplete ? dailyEquivalent(subtotal, periodLengthDays(log.periodType)) : null,
    partialSubtotalLiters: isComplete ? null : subtotal,
  };
}

/**
 * Adds or replaces a log (matched by id) and returns a NEW array, or refuses without changing
 * anything. Every edit is re-validated against all OTHER logs, so changing a period can never
 * create an overlap. { ok: true, logs } or { ok: false, errors, logs: <unchanged> }.
 */
export function upsertLog(logs, log, { today }) {
  if (typeof log?.id !== 'string' || log.id === '') return { ok: false, errors: [{ code: E.LOG_ID_MISSING }], logs };

  const { errors, isValid } = validateLog(log, { today, existingLogs: logs });
  if (!isValid) return { ok: false, errors, logs };

  const exists = logs.some((other) => other.id === log.id);
  return { ok: true, errors: [], logs: exists ? logs.map((other) => (other.id === log.id ? log : other)) : [...logs, log] };
}

/** Validates one editable rate (liters/minute or liters per cycle/session). Returns an array of errors. */
export function validateRate(activityId, rate) {
  const maxRate = getActivityDefinition(activityId).calcType === CALC_TYPES.FLOW ? LIMITS.MAX_FLOW_LPM : LIMITS.MAX_LITERS_PER_CYCLE;
  if (isNil(rate)) return [{ code: E.ASSUMPTION_MISSING, activityId }];
  if (!isNumber(rate) || rate <= 0) return [{ code: E.RATE_INVALID, activityId }];
  if (rate > maxRate) return [{ code: E.RATE_TOO_LARGE, activityId, params: { max: maxRate } }];
  return [];
}

/** Validates editable assumptions (rate per activity). Returns an array of errors. */
export function validateAssumptions(assumptions) {
  return REQUIRED_ACTIVITY_IDS.flatMap((activityId) => validateRate(activityId, assumptions?.[activityId]?.rate));
}
