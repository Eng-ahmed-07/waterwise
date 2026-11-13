import { CALC_TYPES, getActivityDefinition } from './activityDefinitions';

// THE canonical calculation engine. Every activity, every period type and every caller (guest or
// registered, form or stored log) goes through calculateLiters. There is no other formula.
//
//   flow:      liters = flow_lpm x duration_minutes x occurrences
//   appliance: liters = liters_per_cycle x occurrences
//
// `occurrences` is ALWAYS the total number of times in the log's whole period. A weekly log's
// occurrences are the week's total: it is never multiplied by 7. Only dailyEquivalent() divides.

const FLOAT_NOISE = 1e6;

/** Removes binary floating-point noise (e.g. 3647.9999999999995 -> 3648) without hiding real precision. */
export const roundLiters = (value) => Math.round(value * FLOAT_NOISE) / FLOAT_NOISE;

function assertNonNegativeNumber(name, value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite number >= 0, received: ${String(value)}`);
  }
}

/** Liters for one activity over one reporting period. Throws on invalid numbers: validate first. */
export function calculateLiters({ calcType, rate, occurrences, durationMinutes }) {
  assertNonNegativeNumber('rate', rate);
  assertNonNegativeNumber('occurrences', occurrences);

  if (calcType === CALC_TYPES.FLOW) {
    assertNonNegativeNumber('durationMinutes', durationMinutes);
    return roundLiters(rate * durationMinutes * occurrences);
  }
  if (calcType === CALC_TYPES.APPLIANCE) {
    return roundLiters(rate * occurrences);
  }
  throw new RangeError(`Unknown calcType: ${String(calcType)}`);
}

/**
 * Builds a stored log entry from answered inputs:
 *   { activityId, occurrences, durationMinutes, rateUsed, estimatedLiters }
 * `rateUsed` snapshots the assumption, so later assumption edits never rewrite history.
 * An explicit zero (occurrences = 0) is a real answer: it yields 0 liters and no duration.
 */
export function calculateEntry({ activityId, occurrences, durationMinutes = null }, assumptions) {
  const definition = getActivityDefinition(activityId);
  const rate = assumptions?.[activityId]?.rate;
  if (typeof rate !== 'number') throw new RangeError(`No assumption for activity: ${activityId}`);

  const usesDuration = definition.calcType === CALC_TYPES.FLOW && occurrences > 0;
  const estimatedLiters =
    occurrences === 0
      ? 0
      : calculateLiters({ calcType: definition.calcType, rate, occurrences, durationMinutes });

  return {
    activityId,
    occurrences,
    durationMinutes: usesDuration ? durationMinutes : null,
    rateUsed: rate,
    estimatedLiters,
  };
}

export function sumLiters(values) {
  return roundLiters(values.reduce((sum, value) => sum + value, 0));
}

/** Average liters per calendar day of a period (1 for a day log, 7 for a week log). */
export function dailyEquivalent(totalLiters, daysInPeriod) {
  if (!Number.isInteger(daysInPeriod) || daysInPeriod < 1) {
    throw new RangeError(`daysInPeriod must be a positive integer, received: ${String(daysInPeriod)}`);
  }
  return totalLiters / daysInPeriod;
}

/** Cubic meters for monthly-scale figures (Phase 0: 1 m3 = 1000 liters). Display conversion only. */
export const litersToCubicMeters = (liters) => liters / 1000;
