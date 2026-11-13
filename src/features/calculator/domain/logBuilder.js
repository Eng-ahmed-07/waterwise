import { ACTIVITY_DEFINITIONS, CALC_TYPES } from './activityDefinitions';
import { calculateLiters } from './calculations';
import { isValidISODate } from './dates';
import { ERROR_CODES as E } from './errorCodes';
import { INPUT_STATUS, parseNumericInput } from '@/lib/numberInput';
import { LOG_STATUS, validateEntry, validateLog } from './logValidation';
import { computePeriodEnd, isPeriodType } from './periodValidation';

/** Per-activity answer state shown by the form. */
export const ANSWER_STATUS = Object.freeze({ UNANSWERED: 'unanswered', ANSWERED: 'answered', INVALID: 'invalid' });

/**
 * Turns raw form answers into a log. This is where "unanswered" and "zero" are kept apart:
 *   answers = { [activityId]: { occurrences: '' | '0' | '4' | 4, durationMinutes: '' | '6' | 6 } }
 *   occurrences empty  -> UNANSWERED: NO entry is created (never silently becomes 0)
 *   occurrences 0      -> ANSWERED with an explicit zero entry
 *   anything else      -> validated; errors make the activity INVALID (and it is not answered)
 * Entries are built only for answered activities, using the canonical engine's validation.
 *
 * `finalize: true` asks for a COMPLETE log; the central validator then refuses it
 * (COMPLETE_STATUS_MISMATCH) unless all six activities are answered.
 *
 * Returns { log, perActivity, answeredCount, requiredCount, validation, errors, canFinalize }.
 */
export function buildLogFromAnswers(
  { id, periodType, periodStart, answers = {}, assumptions, householdSize, finalize = false },
  { today, existingLogs = [] },
) {
  const perActivity = {};
  const entries = [];

  for (const { id: activityId, calcType } of ACTIVITY_DEFINITIONS) {
    const raw = answers[activityId] ?? {};
    const occurrences = parseNumericInput(raw.occurrences);

    if (occurrences.status === INPUT_STATUS.EMPTY) {
      perActivity[activityId] = { status: ANSWER_STATUS.UNANSWERED, errors: [] };
      continue;
    }
    if (occurrences.status === INPUT_STATUS.INVALID) {
      perActivity[activityId] = {
        status: ANSWER_STATUS.INVALID,
        errors: [{ code: E.OCCURRENCES_INVALID, activityId, field: 'occurrences' }],
      };
      continue;
    }

    const duration = parseNumericInput(raw.durationMinutes);
    if (duration.status === INPUT_STATUS.INVALID && calcType === CALC_TYPES.FLOW && occurrences.value > 0) {
      perActivity[activityId] = {
        status: ANSWER_STATUS.INVALID,
        errors: [{ code: E.DURATION_INVALID, activityId, field: 'durationMinutes' }],
      };
      continue;
    }

    // Duration only matters for a flow activity that actually happened. Otherwise it is dropped.
    const usesDuration = calcType === CALC_TYPES.FLOW && occurrences.value > 0;
    const candidate = {
      activityId,
      occurrences: occurrences.value,
      durationMinutes: usesDuration ? duration.value : null,
      rateUsed: assumptions?.[activityId]?.rate,
      estimatedLiters: 0,
    };

    // Compute liters only when the inputs are usable; validateEntry reports why otherwise.
    try {
      candidate.estimatedLiters =
        candidate.occurrences === 0
          ? 0
          : calculateLiters({ calcType, rate: candidate.rateUsed, occurrences: candidate.occurrences, durationMinutes: candidate.durationMinutes });
    } catch {
      candidate.estimatedLiters = 0;
    }

    const entryErrors = validateEntry(candidate, { periodType });
    if (entryErrors.length > 0) {
      perActivity[activityId] = { status: ANSWER_STATUS.INVALID, errors: entryErrors };
    } else {
      perActivity[activityId] = { status: ANSWER_STATUS.ANSWERED, errors: [] };
      entries.push(candidate);
    }
  }

  const validPeriod = isPeriodType(periodType) && isValidISODate(periodStart);
  const log = {
    id,
    periodType,
    periodStart,
    periodEnd: validPeriod ? computePeriodEnd(periodType, periodStart) : null,
    status: finalize ? LOG_STATUS.COMPLETE : LOG_STATUS.DRAFT,
    ...(householdSize === undefined || householdSize === null ? {} : { householdSize }),
    entries,
  };

  const validation = validateLog(log, { today, existingLogs });
  const activityErrors = Object.values(perActivity).flatMap((a) => a.errors);
  const answeredCount = Object.values(perActivity).filter((a) => a.status === ANSWER_STATUS.ANSWERED).length;
  const requiredCount = ACTIVITY_DEFINITIONS.length;

  // Could this be saved as a complete log right now? (drives the "save as complete" button)
  const asComplete = finalize ? validation : validateLog({ ...log, status: LOG_STATUS.COMPLETE }, { today, existingLogs });

  return {
    log,
    perActivity,
    answeredCount,
    requiredCount,
    validation,
    errors: [...validation.errors, ...activityErrors],
    canFinalize: activityErrors.length === 0 && asComplete.isComplete,
  };
}
