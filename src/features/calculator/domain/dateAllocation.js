import { dailyEquivalent, roundLiters } from './calculations';
import { eachDate } from './dates';
import { LOG_STATUS, validateLog } from './logValidation';
import { findOverlaps, periodLengthDays } from './periodValidation';

// Which logs may contribute to ANY metric or projection, and on which calendar dates.
// Contribute = declared complete + fully valid + not overlapping another contributing log.
// Everything else is excluded and REPORTED (never silently dropped).

export const EXCLUSION_REASONS = Object.freeze({
  DRAFT: 'draft', // not complete: partial subtotals never enter any total
  INVALID: 'invalid', // claims to be complete but fails central validation
  OVERLAP: 'overlap', // shares a date with another complete log
});

/**
 * Splits logs into contributing and excluded. When two complete logs overlap, BOTH are excluded:
 * the engine will not guess which one is right. (The database prevents overlaps in Phase 4; this is
 * the defensive guarantee that a date is never counted twice.)
 */
export function selectContributingLogs(logs, { today }) {
  const excluded = [];
  const candidates = [];

  for (const log of logs) {
    if (log.status !== LOG_STATUS.COMPLETE) {
      excluded.push({ logId: log.id, reason: EXCLUSION_REASONS.DRAFT });
      continue;
    }
    const result = validateLog(log, { today });
    if (result.isComplete) candidates.push(log);
    else excluded.push({ logId: log.id, reason: EXCLUSION_REASONS.INVALID, errorCodes: result.errors.map((e) => e.code) });
  }

  const contributing = [];
  for (const log of candidates) {
    const conflicts = findOverlaps(log, candidates, { ignoreLogId: log.id }).map((other) => other.id);
    if (conflicts.length > 0) excluded.push({ logId: log.id, reason: EXCLUSION_REASONS.OVERLAP, conflictsWith: conflicts });
    else contributing.push(log);
  }
  return { contributing, excluded };
}

/**
 * Spreads a complete log over its individual calendar dates: each date receives the log's
 * DAILY EQUIVALENT (weekly total / 7; a day log is its own single date). The weekly total is never
 * assigned to the start date and never multiplied by 7.
 * Returns [{ date, liters, logId, periodType }].
 */
export function allocateLogToDates(log, totalLiters) {
  const perDay = dailyEquivalent(totalLiters, periodLengthDays(log.periodType));
  return eachDate(log.periodStart, log.periodEnd).map((date) => ({ date, liters: perDay, logId: log.id, periodType: log.periodType }));
}

/**
 * Builds the date -> consumption map from complete, valid, non-overlapping logs only.
 * { dates: Map<'YYYY-MM-DD', { liters, logId, periodType }>, contributing, excluded }
 * Throws if a date would be counted twice (an internal invariant: cannot happen after the
 * overlap exclusion above, so a throw means a bug, not bad user data).
 */
export function buildCoverage(logs, { today }) {
  const { contributing, excluded } = selectContributingLogs(logs, { today });
  const dates = new Map();

  for (const log of contributing) {
    const { totalLiters } = validateLog(log, { today });
    for (const { date, liters, logId, periodType } of allocateLogToDates(log, totalLiters)) {
      if (dates.has(date)) throw new Error(`Invariant violated: ${date} would be counted twice (logs ${dates.get(date).logId} and ${logId}).`);
      dates.set(date, { liters, logId, periodType });
    }
  }
  return { dates, contributing, excluded };
}

/** Totals over a set of covered dates: { coveredDays, totalLiters, averageDailyLiters (null if no days) }. */
export function summarizeDates(entries) {
  const list = [...entries];
  const totalLiters = roundLiters(list.reduce((sum, { liters }) => sum + liters, 0));
  return {
    coveredDays: list.length,
    totalLiters,
    averageDailyLiters: list.length > 0 ? totalLiters / list.length : null,
  };
}
