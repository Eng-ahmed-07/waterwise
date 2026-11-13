// MOCK DATA for the Phase 3 static UI. Replaced by Supabase queries in Phase 5.
// Logs are built through the REAL domain (buildLogFromAnswers), so every figure on the dashboard
// and history pages comes from the same engine and validation as production data will.
import { createDefaultAssumptions } from '@/features/calculator/domain/activityDefinitions';
import { addDays } from '@/features/calculator/domain/dates';
import { buildLogFromAnswers } from '@/features/calculator/domain/logBuilder';

// Small seeded generator: the same "random" numbers on every load, so the demo is stable.
function seeded(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const between = (r, min, max) => min + Math.floor(r() * (max - min + 1));

function dayAnswers(r) {
  return {
    shower: { occurrences: between(r, 2, 5), durationMinutes: between(r, 4, 9) },
    faucet: { occurrences: between(r, 4, 8), durationMinutes: between(r, 1, 3) },
    dishwashing: { occurrences: between(r, 2, 3), durationMinutes: between(r, 6, 12) },
    plant_watering: r() < 0.4 ? { occurrences: 1, durationMinutes: between(r, 5, 10) } : { occurrences: 0 },
    washing_machine: { occurrences: r() < 0.5 ? 1 : 0 },
    house_cleaning: { occurrences: r() < 0.3 ? 1 : 0 },
  };
}

function weekAnswers(r) {
  return {
    shower: { occurrences: between(r, 20, 28), durationMinutes: between(r, 5, 8) },
    faucet: { occurrences: between(r, 30, 45), durationMinutes: between(r, 1, 3) },
    dishwashing: { occurrences: between(r, 14, 21), durationMinutes: between(r, 7, 11) },
    plant_watering: { occurrences: between(r, 2, 4), durationMinutes: between(r, 5, 10) },
    washing_machine: { occurrences: between(r, 3, 5) },
    house_cleaning: { occurrences: between(r, 1, 3) },
  };
}

/**
 * A realistic mix relative to `today`: eight complete days with gaps, one complete week, and two
 * drafts. (Days-ago offsets: complete 1,2,3,5,6,8,9,12; drafts 4 and 10; week from 20 to 14 days ago.)
 */
export function buildMockLogs(today) {
  const r = seeded(20260);
  const assumptions = createDefaultAssumptions();
  const logs = [];
  const add = (spec) => {
    const result = buildLogFromAnswers(
      { assumptions, finalize: spec.complete, id: spec.id, periodType: spec.periodType, periodStart: spec.periodStart, answers: spec.answers },
      { today, existingLogs: logs },
    );
    if (result.validation.isValid) logs.push(result.log);
  };

  add({ id: 'mock-week-1', periodType: 'week', periodStart: addDays(today, -20), complete: true, answers: weekAnswers(r) });
  for (const ago of [12, 9, 8, 6, 5, 3, 2, 1]) {
    add({ id: `mock-day-${ago}`, periodType: 'day', periodStart: addDays(today, -ago), complete: true, answers: dayAnswers(r) });
  }
  for (const ago of [10, 4]) {
    const full = dayAnswers(r);
    add({ id: `mock-draft-${ago}`, periodType: 'day', periodStart: addDays(today, -ago), complete: false, answers: { shower: full.shower, faucet: full.faucet } });
  }
  return logs;
}
