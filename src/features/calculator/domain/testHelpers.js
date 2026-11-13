// Shared builders for tests. Not imported by application code.
import { ACTIVITY_IDS, createDefaultAssumptions } from './activityDefinitions';
import { buildLogFromAnswers } from './logBuilder';

export const TODAY = '2026-11-30';
export const ASSUMPTIONS = createDefaultAssumptions(); // shower 8, faucet 6, dishwashing 6, plants 10 L/min; washer 50 L/cycle; cleaning 20 L/session

/** Approved Revision 3 example, day log (Nov 3): 494 L. */
export const REV3_DAY_ANSWERS = {
  shower: { occurrences: 4, durationMinutes: 6 },
  faucet: { occurrences: 6, durationMinutes: 2 },
  dishwashing: { occurrences: 3, durationMinutes: 10 },
  plant_watering: { occurrences: 0 },
  washing_machine: { occurrences: 1 },
  house_cleaning: { occurrences: 0 },
};

/** Approved Revision 3 example, week log (Nov 5-11): 3,648 L. Counts are TOTALS for the week. */
export const REV3_WEEK_ANSWERS = {
  shower: { occurrences: 28, durationMinutes: 6 },
  faucet: { occurrences: 42, durationMinutes: 2 },
  dishwashing: { occurrences: 21, durationMinutes: 10 },
  plant_watering: { occurrences: 3, durationMinutes: 10 },
  washing_machine: { occurrences: 4 },
  house_cleaning: { occurrences: 2 },
};

/** All six activities answered "no use". */
export const ZERO_ANSWERS = Object.fromEntries(Object.values(ACTIVITY_IDS).map((id) => [id, { occurrences: 0 }]));

/** Builds a log through the real builder. complete=true requests a COMPLETE log (still verified centrally). */
export function makeLog({ id, periodType = 'day', periodStart, answers = ZERO_ANSWERS, complete = true, today = TODAY, assumptions = ASSUMPTIONS, householdSize }) {
  return buildLogFromAnswers({ id, periodType, periodStart, answers, assumptions, finalize: complete, householdSize }, { today }).log;
}

/** A complete log whose total is exactly 50 x cycles liters (only the washing machine is non-zero). */
export const litersLog = (id, periodType, periodStart, cycles, options = {}) =>
  makeLog({ id, periodType, periodStart, answers: { ...ZERO_ANSWERS, washing_machine: { occurrences: cycles } }, ...options });

export const close = (a, b, epsilon = 1e-9) => Math.abs(a - b) <= epsilon;

/** Reducer actions that fill the calculator form from an answers object (used by UI tests). */
export const answerActions = (answers) =>
  Object.entries(answers).flatMap(([activityId, a]) => [
    { type: 'SET_ANSWER', activityId, field: 'occurrences', value: a.occurrences },
    ...(a.durationMinutes === undefined ? [] : [{ type: 'SET_ANSWER', activityId, field: 'durationMinutes', value: a.durationMinutes }]),
  ]);
