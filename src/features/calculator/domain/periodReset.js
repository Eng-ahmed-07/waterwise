import { ERROR_CODES as E } from './errorCodes';

// Period-first reset of a STORED log, in two steps so nothing is deleted by accident:
//   1. requestPeriodReset(logs, { periodType, periodStart }) -> a confirmation describing exactly
//      which period would be removed. The UI shows it (see ResetPeriodDialog) and waits.
//   2. confirmPeriodReset(logs, confirmation) -> removes ONLY the log that still matches that
//      period. Without a confirmation, or if the log no longer matches, nothing is removed.
// Pure functions: they return a new array and never mutate the input.

export function requestPeriodReset(logs, { periodType, periodStart }) {
  const log = logs.find((l) => l.periodType === periodType && l.periodStart === periodStart);
  if (!log) return { ok: false, errors: [{ code: E.LOG_NOT_FOUND }] };

  return {
    ok: true,
    confirmation: {
      logId: log.id,
      periodType: log.periodType,
      periodStart: log.periodStart,
      periodEnd: log.periodEnd,
      status: log.status,
      entryCount: log.entries?.length ?? 0,
    },
  };
}

export function confirmPeriodReset(logs, confirmation) {
  if (!confirmation || typeof confirmation !== 'object' || !confirmation.logId) {
    return { ok: false, errors: [{ code: E.CONFIRMATION_REQUIRED }], logs };
  }
  const log = logs.find((l) => l.id === confirmation.logId);
  if (!log) return { ok: false, errors: [{ code: E.LOG_NOT_FOUND }], logs };

  const sameTarget =
    log.periodType === confirmation.periodType &&
    log.periodStart === confirmation.periodStart &&
    log.periodEnd === confirmation.periodEnd;
  if (!sameTarget) return { ok: false, errors: [{ code: E.RESET_TARGET_MISMATCH }], logs };

  return { ok: true, errors: [], logs: logs.filter((l) => l.id !== log.id), removed: log };
}
