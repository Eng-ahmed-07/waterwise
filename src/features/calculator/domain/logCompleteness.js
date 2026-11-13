import { REQUIRED_ACTIVITY_IDS } from './activityDefinitions';

// Completeness is decided HERE, centrally, never by UI checks. An activity is "answered" when it
// has an entry with a real number of occurrences. Zero IS an answer ("no use"). A missing entry is
// NOT zero: it stays unanswered and the log stays a draft. Nothing is ever defaulted to zero.

export const isAnsweredEntry = (entry) =>
  Boolean(entry) && typeof entry.occurrences === 'number' && Number.isFinite(entry.occurrences) && entry.occurrences >= 0;

export function getCompleteness(entries = []) {
  const answered = new Set(
    entries.filter((entry) => REQUIRED_ACTIVITY_IDS.includes(entry?.activityId) && isAnsweredEntry(entry)).map((e) => e.activityId),
  );
  const answeredIds = REQUIRED_ACTIVITY_IDS.filter((id) => answered.has(id));
  const missingIds = REQUIRED_ACTIVITY_IDS.filter((id) => !answered.has(id));

  return {
    requiredCount: REQUIRED_ACTIVITY_IDS.length,
    answeredCount: answeredIds.length,
    answeredIds,
    missingIds,
    isComplete: missingIds.length === 0,
  };
}
