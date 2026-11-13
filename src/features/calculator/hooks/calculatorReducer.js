import { buildLogFromAnswers } from '../domain/logBuilder';
import { calculateMonthlyProjection, PROJECTION_MODES } from '../domain/monthlyProjection';
import { PLACEHOLDER_ASSUMPTIONS, createDefaultAssumptions } from '../domain/activityDefinitions';
import { isValidISODate, monthOf } from '../domain/dates';
import { computePeriodEnd, isPeriodType } from '../domain/periodValidation';
import { INPUT_STATUS, parseNumericInput } from '@/lib/numberInput';

// Pure calculator form state (no React). Rules from Phase 0 Revision 3:
//  - Period comes FIRST: no answer can be entered until a period start date is chosen.
//  - Switching day <-> week after entering values asks for confirmation and then CLEARS the form.
//    Values are never converted automatically (a day count and a week total mean different things).
//  - Resetting entered data asks for confirmation and names the exact period affected.

export function createInitialState({ assumptions = createDefaultAssumptions(), periodType = 'day' } = {}) {
  return {
    periodType,
    periodStart: null,
    answers: {}, // { [activityId]: { occurrences, durationMinutes } } raw form values
    assumptions,
    householdSize: null,
    pendingPeriodChange: null, // a period type waiting for the user's confirmation, or null
    pendingReset: null, // { periodType, periodStart, periodEnd } waiting for confirmation, or null
  };
}

/** True when any answer field holds something (including an explicit zero). */
export const hasEnteredData = (answers) =>
  Object.values(answers).some((a) =>
    [a?.occurrences, a?.durationMinutes].some((v) => parseNumericInput(v).status !== INPUT_STATUS.EMPTY),
  );

export function calculatorReducer(state, action) {
  switch (action.type) {
    case 'SET_PERIOD_START':
      // Changing the start date moves the period but keeps the (same-type) values.
      return { ...state, periodStart: action.periodStart };

    case 'SET_PERIOD_TYPE': {
      if (!isPeriodType(action.periodType) || action.periodType === state.periodType) return state;
      if (hasEnteredData(state.answers)) return { ...state, pendingPeriodChange: action.periodType };
      return { ...state, periodType: action.periodType };
    }
    case 'CONFIRM_PERIOD_CHANGE':
      if (!state.pendingPeriodChange) return state;
      return { ...state, periodType: state.pendingPeriodChange, answers: {}, pendingPeriodChange: null };
    case 'CANCEL_PERIOD_CHANGE':
      return { ...state, pendingPeriodChange: null };

    case 'SET_ANSWER': {
      if (!state.periodStart) return state; // period first
      const previous = state.answers[action.activityId] ?? {};
      return { ...state, answers: { ...state.answers, [action.activityId]: { ...previous, [action.field]: action.value } } };
    }
    case 'MARK_NONE': // explicit "no use": a real answer of zero, not a blank
      if (!state.periodStart) return state;
      return { ...state, answers: { ...state.answers, [action.activityId]: { occurrences: 0, durationMinutes: null } } };
    case 'CLEAR_ANSWER': {
      const { [action.activityId]: _removed, ...rest } = state.answers;
      return { ...state, answers: rest };
    }

    case 'CLEAR_FORM': // after a successful save: empty answers, keep period, assumptions, household size
      return { ...state, answers: {}, pendingPeriodChange: null, pendingReset: null };

    case 'SET_ASSUMPTION':
      return {
        ...state,
        assumptions: { ...state.assumptions, [action.activityId]: { rate: action.rate, isPlaceholder: false } },
      };
    case 'RESET_ASSUMPTION': // one activity back to its placeholder default
      return { ...state, assumptions: { ...state.assumptions, [action.activityId]: { ...PLACEHOLDER_ASSUMPTIONS[action.activityId] } } };
    case 'RESET_ASSUMPTIONS':
      return { ...state, assumptions: createDefaultAssumptions() };

    case 'SET_HOUSEHOLD_SIZE':
      return { ...state, householdSize: action.householdSize };

    case 'REQUEST_RESET': {
      // Nothing entered, or no period chosen: there is nothing to delete, so no dialog is needed.
      if (!hasEnteredData(state.answers) || !isValidISODate(state.periodStart)) return state;
      return {
        ...state,
        pendingReset: {
          periodType: state.periodType,
          periodStart: state.periodStart,
          periodEnd: computePeriodEnd(state.periodType, state.periodStart),
        },
      };
    }
    case 'CONFIRM_RESET': {
      if (!state.pendingReset) return state;
      // Only reset if the confirmation still refers to the period currently on screen.
      const { periodType, periodStart } = state.pendingReset;
      if (periodType !== state.periodType || periodStart !== state.periodStart) return { ...state, pendingReset: null };
      return { ...state, answers: {}, pendingReset: null };
    }
    case 'CANCEL_RESET':
      return { ...state, pendingReset: null };

    default:
      return state;
  }
}

/** Builds a log from the form state through the domain (the single place that maps form -> log). */
export function buildFormLog(state, { today, existingLogs = [], finalize = false, id = 'draft-form' }) {
  return buildLogFromAnswers(
    {
      id,
      periodType: state.periodType,
      periodStart: state.periodStart,
      answers: state.answers,
      assumptions: state.assumptions,
      householdSize: state.householdSize ?? undefined,
      finalize,
    },
    { today, existingLogs },
  );
}

/**
 * Derives everything the UI needs from the form state, using the domain layer only.
 *  - build:             per-activity status, answered count, errors, canFinalize, partial subtotal
 *  - completeLog:       a COMPLETE log when all six are validly answered, else null
 *  - completeValidation: its validation (totalLiters, dailyEquivalentLiters), else null
 *  - outlook:           monthly estimate/projection from complete logs only, else null
 * `mode` 'guest' (default) uses the guest rules; `existingLogs` are the user's stored logs.
 */
export function evaluateForm(state, { today, mode = PROJECTION_MODES.GUEST, existingLogs = [], logId = 'draft-form' }) {
  const build = buildFormLog(state, { today, existingLogs, id: logId });
  const final = build.canFinalize ? buildFormLog(state, { today, existingLogs, id: logId, finalize: true }) : null;
  const completeLog = final ? final.log : null;
  const outlook = completeLog
    ? calculateMonthlyProjection({
        logs: mode === PROJECTION_MODES.GUEST ? [completeLog] : [...existingLogs.filter((l) => l.id !== logId), completeLog],
        month: monthOf(completeLog.periodEnd),
        today,
        mode,
      })
    : null;

  return { build, completeLog, completeValidation: final ? final.validation : null, outlook };
}
