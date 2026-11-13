import { describe, expect, it } from 'vitest';
import { ANSWER_STATUS } from '../domain/logBuilder';
import { close, REV3_DAY_ANSWERS, REV3_WEEK_ANSWERS, TODAY } from '../domain/testHelpers';
import { buildFormLog, calculatorReducer, createInitialState, evaluateForm, hasEnteredData } from './calculatorReducer';

const run = (actions, state = createInitialState()) => actions.reduce(calculatorReducer, state);
const start = { type: 'SET_PERIOD_START', periodStart: '2026-11-03' };
const answer = (activityId, field, value) => ({ type: 'SET_ANSWER', activityId, field, value });
const fillAll = (answers) =>
  Object.entries(answers).flatMap(([id, a]) => [answer(id, 'occurrences', a.occurrences), ...(a.durationMinutes === undefined ? [] : [answer(id, 'durationMinutes', a.durationMinutes)])]);

describe('period comes first', () => {
  it('ignores answers until a period start date is chosen', () => {
    const state = run([answer('shower', 'occurrences', 3), { type: 'MARK_NONE', activityId: 'faucet' }]);
    expect(state.answers).toEqual({});
  });

  it('accepts answers once the period is chosen', () => {
    const state = run([start, answer('shower', 'occurrences', '3')]);
    expect(state.answers.shower.occurrences).toBe('3');
  });
});

describe('explicit zero ("no use")', () => {
  it('MARK_NONE records a real zero answer, which evaluation counts as answered', () => {
    const state = run([start, { type: 'MARK_NONE', activityId: 'plant_watering' }]);
    expect(state.answers.plant_watering).toEqual({ occurrences: 0, durationMinutes: null });
    const { build } = evaluateForm(state, { today: TODAY });
    expect(build.perActivity.plant_watering.status).toBe(ANSWER_STATUS.ANSWERED);
    expect(build.perActivity.shower.status).toBe(ANSWER_STATUS.UNANSWERED);
    expect(build.answeredCount).toBe(1);
  });

  it('CLEAR_ANSWER returns an activity to unanswered', () => {
    const state = run([start, { type: 'MARK_NONE', activityId: 'plant_watering' }, { type: 'CLEAR_ANSWER', activityId: 'plant_watering' }]);
    expect(evaluateForm(state, { today: TODAY }).build.answeredCount).toBe(0);
  });

  it('hasEnteredData sees an explicit zero but not blanks', () => {
    expect(hasEnteredData({ shower: { occurrences: '', durationMinutes: '' } })).toBe(false);
    expect(hasEnteredData({ shower: { occurrences: 0 } })).toBe(true);
    expect(hasEnteredData({})).toBe(false);
  });
});

describe('switching between day and week', () => {
  it('switches immediately when nothing has been entered', () => {
    const state = run([{ type: 'SET_PERIOD_TYPE', periodType: 'week' }]);
    expect(state.periodType).toBe('week');
    expect(state.pendingPeriodChange).toBeNull();
  });

  it('asks for confirmation when values exist, and changes nothing yet', () => {
    const before = run([start, answer('shower', 'occurrences', '4')]);
    const state = calculatorReducer(before, { type: 'SET_PERIOD_TYPE', periodType: 'week' });
    expect(state.pendingPeriodChange).toBe('week');
    expect(state.periodType).toBe('day');
    expect(state.answers).toEqual(before.answers);
  });

  it('after confirmation applies the new type and CLEARS the values (never converts them)', () => {
    const state = run([start, answer('shower', 'occurrences', '4'), { type: 'SET_PERIOD_TYPE', periodType: 'week' }, { type: 'CONFIRM_PERIOD_CHANGE' }]);
    expect(state.periodType).toBe('week');
    expect(state.answers).toEqual({});
    expect(state.pendingPeriodChange).toBeNull();
  });

  it('cancelling keeps the type and the values', () => {
    const state = run([start, answer('shower', 'occurrences', '4'), { type: 'SET_PERIOD_TYPE', periodType: 'week' }, { type: 'CANCEL_PERIOD_CHANGE' }]);
    expect(state.periodType).toBe('day');
    expect(state.answers.shower.occurrences).toBe('4');
    expect(state.pendingPeriodChange).toBeNull();
  });

  it('ignores a no-op or invalid type change', () => {
    const state = createInitialState();
    expect(calculatorReducer(state, { type: 'SET_PERIOD_TYPE', periodType: 'day' })).toBe(state);
    expect(calculatorReducer(state, { type: 'SET_PERIOD_TYPE', periodType: 'month' })).toBe(state);
    expect(calculatorReducer(state, { type: 'CONFIRM_PERIOD_CHANGE' })).toBe(state);
  });
});

describe('reset confirmation names the exact period', () => {
  const filled = [start, answer('shower', 'occurrences', '4')];

  it('does nothing when there is no data or no period (nothing to delete)', () => {
    const empty = createInitialState();
    expect(calculatorReducer(empty, { type: 'REQUEST_RESET' })).toBe(empty);
    const noData = run([start]);
    expect(calculatorReducer(noData, { type: 'REQUEST_RESET' })).toBe(noData);
  });

  it('requests confirmation with the period being reset, and deletes nothing yet', () => {
    const state = run([...filled, { type: 'REQUEST_RESET' }]);
    expect(state.pendingReset).toEqual({ periodType: 'day', periodStart: '2026-11-03', periodEnd: '2026-11-03' });
    expect(state.answers.shower.occurrences).toBe('4');
  });

  it('names the whole seven-day span for a week', () => {
    const state = run([{ type: 'SET_PERIOD_TYPE', periodType: 'week' }, start, answer('shower', 'occurrences', '4'), { type: 'REQUEST_RESET' }]);
    expect(state.pendingReset).toEqual({ periodType: 'week', periodStart: '2026-11-03', periodEnd: '2026-11-09' });
  });

  it('clears the answers only after confirmation', () => {
    const state = run([...filled, { type: 'REQUEST_RESET' }, { type: 'CONFIRM_RESET' }]);
    expect(state.answers).toEqual({});
    expect(state.pendingReset).toBeNull();
    expect(state.periodStart).toBe('2026-11-03');
  });

  it('cancelling keeps everything', () => {
    const state = run([...filled, { type: 'REQUEST_RESET' }, { type: 'CANCEL_RESET' }]);
    expect(state.answers.shower.occurrences).toBe('4');
    expect(state.pendingReset).toBeNull();
  });

  it('a stale confirmation for a different period does NOT reset the period now on screen', () => {
    const pending = run([...filled, { type: 'REQUEST_RESET' }]);
    const moved = calculatorReducer(pending, { type: 'SET_PERIOD_START', periodStart: '2026-11-10' });
    const state = calculatorReducer(moved, { type: 'CONFIRM_RESET' });
    expect(state.answers.shower.occurrences).toBe('4');
    expect(state.pendingReset).toBeNull();
  });
});

describe('assumptions', () => {
  it('editing an assumption marks it as no longer a placeholder and changes new calculations only', () => {
    const state = run([start, answer('shower', 'occurrences', '1'), answer('shower', 'durationMinutes', '10')]);
    const before = evaluateForm(state, { today: TODAY }).build.log.entries[0];
    const edited = calculatorReducer(state, { type: 'SET_ASSUMPTION', activityId: 'shower', rate: 4 });
    const after = evaluateForm(edited, { today: TODAY }).build.log.entries[0];
    expect(edited.assumptions.shower).toEqual({ rate: 4, isPlaceholder: false });
    expect([before.rateUsed, before.estimatedLiters]).toEqual([8, 80]);
    expect([after.rateUsed, after.estimatedLiters]).toEqual([4, 40]);
  });

  it('resets assumptions to the placeholder defaults', () => {
    const state = run([{ type: 'SET_ASSUMPTION', activityId: 'shower', rate: 4 }, { type: 'RESET_ASSUMPTIONS' }]);
    expect(state.assumptions.shower).toEqual({ rate: 8, isPlaceholder: true });
  });
});

describe('evaluateForm: guest results', () => {
  it('has no complete log and no outlook while activities are unanswered', () => {
    const state = run([start, answer('shower', 'occurrences', '4'), answer('shower', 'durationMinutes', '6')]);
    const { build, completeLog, outlook } = evaluateForm(state, { today: TODAY });
    expect(build.answeredCount).toBe(1);
    expect(completeLog).toBeNull();
    expect(outlook).toBeNull();
  });

  it('a complete guest DAY gives the daily estimate but no projection', () => {
    const state = run([start, ...fillAll(REV3_DAY_ANSWERS)]);
    const { completeLog, outlook } = evaluateForm(state, { today: TODAY });
    expect(completeLog.status).toBe('complete');
    expect(outlook.status).toBe('insufficient_data');
    expect(outlook.averageDailyLiters).toBe(494);
    expect(outlook.monthlyTotalLiters).toBeNull();
  });

  it('a complete guest WEEK gives a projection', () => {
    const state = run([{ type: 'SET_PERIOD_TYPE', periodType: 'week' }, { type: 'SET_PERIOD_START', periodStart: '2026-11-05' }, ...fillAll(REV3_WEEK_ANSWERS)]);
    const { completeLog, outlook } = evaluateForm(state, { today: TODAY });
    expect(completeLog.periodEnd).toBe('2026-11-11');
    expect(outlook.status).toBe('partial_coverage');
    expect(close(outlook.monthlyTotalLiters, (3648 / 7) * 30, 1e-5)).toBe(true);
    expect(outlook.monthlyTotalBasis).toBe('projected');
  });

  it('refuses a period that has not ended', () => {
    const state = run([{ type: 'SET_PERIOD_START', periodStart: '2026-12-05' }, ...fillAll(REV3_DAY_ANSWERS)]);
    const { build, completeLog } = evaluateForm(state, { today: TODAY });
    expect(build.canFinalize).toBe(false);
    expect(completeLog).toBeNull();
  });
});

describe('clearing and per-assumption reset', () => {
  it('CLEAR_FORM empties the answers but keeps the period, assumptions and household size', () => {
    const state = run([start, { type: 'SET_HOUSEHOLD_SIZE', householdSize: 4 }, { type: 'SET_ASSUMPTION', activityId: 'shower', rate: 5 }, answer('shower', 'occurrences', '2'), { type: 'CLEAR_FORM' }]);
    expect(state.answers).toEqual({});
    expect(state.periodStart).toBe('2026-11-03');
    expect(state.householdSize).toBe(4);
    expect(state.assumptions.shower.rate).toBe(5);
  });

  it('RESET_ASSUMPTION restores one activity and leaves the others edited', () => {
    const state = run([
      { type: 'SET_ASSUMPTION', activityId: 'shower', rate: 5 },
      { type: 'SET_ASSUMPTION', activityId: 'faucet', rate: 3 },
      { type: 'RESET_ASSUMPTION', activityId: 'shower' },
    ]);
    expect(state.assumptions.shower).toEqual({ rate: 8, isPlaceholder: true });
    expect(state.assumptions.faucet).toEqual({ rate: 3, isPlaceholder: false });
  });
});

describe('buildFormLog and evaluateForm share one builder', () => {
  it('finalize flag produces a complete or draft log from the same form state', () => {
    const state = run([start, ...fillAll(REV3_DAY_ANSWERS)]);
    expect(buildFormLog(state, { today: TODAY }).log.status).toBe('draft');
    const final = buildFormLog(state, { today: TODAY, finalize: true, id: 'abc' });
    expect(final.log.status).toBe('complete');
    expect(final.log.id).toBe('abc');
    expect(final.validation.totalLiters).toBe(494);
  });

  it('evaluateForm exposes the complete log totals', () => {
    const state = run([start, ...fillAll(REV3_DAY_ANSWERS)]);
    const { completeValidation } = evaluateForm(state, { today: TODAY });
    expect(completeValidation.totalLiters).toBe(494);
    expect(completeValidation.dailyEquivalentLiters).toBe(494);
    expect(evaluateForm(run([start]), { today: TODAY }).completeValidation).toBeNull();
  });
});
