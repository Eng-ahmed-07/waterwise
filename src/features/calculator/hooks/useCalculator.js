import { useMemo, useReducer } from 'react';
import { todayISO } from '../domain/dates';
import { PROJECTION_MODES } from '../domain/monthlyProjection';
import { calculatorReducer, createInitialState, evaluateForm } from './calculatorReducer';

/**
 * React binding for the calculator domain. All rules live in the pure reducer and domain modules;
 * this hook only holds state and exposes actions. `today` is injectable for tests.
 *
 *   const { state, evaluation, actions } = useCalculator({ mode: 'guest' });
 *   evaluation.build.answeredCount  -> "٤ من ٦ أنشطة مُجابة"
 *   evaluation.outlook              -> monthly projection result (null until the log is complete)
 *
 * Show every number from `evaluation` through <MetricValue basis="estimated|projected" />.
 */
export function useCalculator({ today: todayOverride, mode = PROJECTION_MODES.GUEST, existingLogs, initialAssumptions } = {}) {
  const today = todayOverride ?? todayISO();
  const [state, dispatch] = useReducer(calculatorReducer, { assumptions: initialAssumptions }, createInitialState);

  const evaluation = useMemo(
    () => evaluateForm(state, { today, mode, existingLogs }),
    [state, today, mode, existingLogs],
  );

  const actions = useMemo(
    () => ({
      setPeriodStart: (periodStart) => dispatch({ type: 'SET_PERIOD_START', periodStart }),
      setPeriodType: (periodType) => dispatch({ type: 'SET_PERIOD_TYPE', periodType }),
      confirmPeriodChange: () => dispatch({ type: 'CONFIRM_PERIOD_CHANGE' }),
      cancelPeriodChange: () => dispatch({ type: 'CANCEL_PERIOD_CHANGE' }),
      setAnswer: (activityId, field, value) => dispatch({ type: 'SET_ANSWER', activityId, field, value }),
      markNone: (activityId) => dispatch({ type: 'MARK_NONE', activityId }),
      clearAnswer: (activityId) => dispatch({ type: 'CLEAR_ANSWER', activityId }),
      setAssumption: (activityId, rate) => dispatch({ type: 'SET_ASSUMPTION', activityId, rate }),
      resetAssumption: (activityId) => dispatch({ type: 'RESET_ASSUMPTION', activityId }),
      resetAssumptions: () => dispatch({ type: 'RESET_ASSUMPTIONS' }),
      clearForm: () => dispatch({ type: 'CLEAR_FORM' }),
      setHouseholdSize: (householdSize) => dispatch({ type: 'SET_HOUSEHOLD_SIZE', householdSize }),
      requestReset: () => dispatch({ type: 'REQUEST_RESET' }),
      confirmReset: () => dispatch({ type: 'CONFIRM_RESET' }),
      cancelReset: () => dispatch({ type: 'CANCEL_RESET' }),
    }),
    [],
  );

  return { state, evaluation, actions };
}
