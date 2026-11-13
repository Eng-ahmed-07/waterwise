import { describe, expect, it } from 'vitest';
import { ACTIVITY_IDS } from './activityDefinitions';
import { ANSWER_STATUS, buildLogFromAnswers } from './logBuilder';
import { getCompleteness } from './logCompleteness';
import { LOG_STATUS, validateAssumptions, validateEntry, validateLog } from './logValidation';
import { ERROR_CODES as E } from './errorCodes';
import { ASSUMPTIONS, makeLog, REV3_DAY_ANSWERS, REV3_WEEK_ANSWERS, TODAY, ZERO_ANSWERS } from './testHelpers';

const build = (answers, extra = {}) =>
  buildLogFromAnswers({ id: 'x', periodType: 'day', periodStart: '2026-11-03', answers, assumptions: ASSUMPTIONS, ...extra }, { today: TODAY });
const codes = (errors) => errors.map((e) => e.code);

describe('unanswered is NOT zero', () => {
  it('creates no entry for a blank activity, and never defaults it to 0', () => {
    const { log, perActivity, answeredCount } = build({ shower: { occurrences: '', durationMinutes: '' }, faucet: { occurrences: 2, durationMinutes: 3 } });
    expect(answeredCount).toBe(1);
    expect(log.entries.map((e) => e.activityId)).toEqual(['faucet']);
    expect(perActivity.shower.status).toBe(ANSWER_STATUS.UNANSWERED);
    expect(perActivity.washing_machine.status).toBe(ANSWER_STATUS.UNANSWERED);
  });

  it('records an explicit zero as an ANSWERED entry with 0 liters', () => {
    const { log, perActivity } = build({ shower: { occurrences: '0' } });
    expect(perActivity.shower.status).toBe(ANSWER_STATUS.ANSWERED);
    expect(log.entries).toEqual([{ activityId: 'shower', occurrences: 0, durationMinutes: null, rateUsed: 8, estimatedLiters: 0 }]);
  });

  it('counts zero as answered but blank as not answered in completeness', () => {
    const zero = getCompleteness([{ activityId: 'shower', occurrences: 0 }]);
    const none = getCompleteness([]);
    expect(zero.answeredCount).toBe(1);
    expect(none.answeredCount).toBe(0);
    expect(zero.missingIds).toHaveLength(5);
  });

  it('ignores entries whose occurrences are null, undefined, NaN or negative', () => {
    expect(getCompleteness([{ activityId: 'shower', occurrences: null }, { activityId: 'faucet', occurrences: undefined }, { activityId: 'dishwashing', occurrences: NaN }, { activityId: 'plant_watering', occurrences: -1 }]).answeredCount).toBe(0);
  });
});

describe('complete vs draft', () => {
  it('a log with all six activities answered (zeros included) is COMPLETE', () => {
    const result = build(REV3_DAY_ANSWERS, { finalize: true });
    expect(result.validation.isComplete).toBe(true);
    expect(result.validation.status).toBe(LOG_STATUS.COMPLETE);
    expect(result.validation.completeness.answeredCount).toBe(6);
    expect(result.validation.totalLiters).toBe(494);
    expect(result.canFinalize).toBe(true);
  });

  it('an all-zero day is a legitimate complete log with 0 liters', () => {
    const result = build(ZERO_ANSWERS, { finalize: true });
    expect(result.validation.isComplete).toBe(true);
    expect(result.validation.totalLiters).toBe(0);
  });

  it('a partially filled log is a valid DRAFT with only a partial subtotal', () => {
    const result = build({ shower: { occurrences: 4, durationMinutes: 6 }, faucet: { occurrences: 6, durationMinutes: 2 } });
    expect(result.validation.isValid).toBe(true);
    expect(result.validation.isComplete).toBe(false);
    expect(result.validation.status).toBe(LOG_STATUS.DRAFT);
    expect(result.validation.completeness.missingIds).toEqual(['dishwashing', 'plant_watering', 'washing_machine', 'house_cleaning']);
    expect(result.validation.partialSubtotalLiters).toBe(264);
    expect(result.validation.totalLiters).toBeNull();
    expect(result.validation.dailyEquivalentLiters).toBeNull();
    expect(result.canFinalize).toBe(false);
  });

  it('refuses to save a log as complete when any activity is unanswered (central check, not UI-only)', () => {
    const { errors, log } = build({ shower: { occurrences: 0 }, faucet: { occurrences: 0 } }, { finalize: true });
    expect(codes(errors)).toContain(E.COMPLETE_STATUS_MISMATCH);
    expect(log.status).toBe('complete');
  });

  it('cannot be tricked by a hand-built log that claims "complete" with five entries', () => {
    const fiveEntries = makeLog({ id: 'a', periodStart: '2026-11-03', answers: REV3_DAY_ANSWERS }).entries.slice(0, 5);
    const claim = { id: 'a', periodType: 'day', periodStart: '2026-11-03', periodEnd: '2026-11-03', status: 'complete', entries: fiveEntries };
    const result = validateLog(claim, { today: TODAY });
    expect(result.isComplete).toBe(false);
    expect(codes(result.errors)).toContain(E.COMPLETE_STATUS_MISMATCH);
    expect(result.totalLiters).toBeNull();
  });

  it('a draft with all six answered stays a draft unless completion is requested', () => {
    const result = build(REV3_DAY_ANSWERS);
    expect(result.validation.isComplete).toBe(false);
    expect(result.canFinalize).toBe(true);
  });

  it('weekly totals produce the daily equivalent total / 7', () => {
    const result = build(REV3_WEEK_ANSWERS, { periodType: 'week', periodStart: '2026-11-05', finalize: true });
    expect(result.validation.totalLiters).toBe(3648);
    expect(result.validation.dailyEquivalentLiters).toBe(3648 / 7);
  });
});

describe('duplicate activities', () => {
  it('rejects a log with the same activity twice', () => {
    const log = makeLog({ id: 'a', periodStart: '2026-11-03', answers: ZERO_ANSWERS });
    const duplicated = { ...log, entries: [...log.entries, { ...log.entries[0] }] };
    const result = validateLog(duplicated, { today: TODAY });
    expect(codes(result.errors)).toContain(E.ACTIVITY_DUPLICATE);
    expect(result.isValid).toBe(false);
    expect(result.isComplete).toBe(false);
  });

  it('rejects an unknown activity id', () => {
    const log = makeLog({ id: 'a', periodStart: '2026-11-03', answers: ZERO_ANSWERS });
    const result = validateLog({ ...log, entries: [...log.entries, { activityId: 'dishwasher_machine', occurrences: 1 }] }, { today: TODAY });
    expect(codes(result.errors)).toContain(E.ACTIVITY_UNKNOWN);
  });
});

describe('invalid and excessive input', () => {
  const entry = (overrides) => ({ activityId: 'shower', occurrences: 2, durationMinutes: 5, rateUsed: 8, estimatedLiters: 80, ...overrides });
  const day = { periodType: 'day' };
  const week = { periodType: 'week' };

  it('accepts a valid flow entry', () => {
    expect(validateEntry(entry(), day)).toEqual([]);
  });

  it('flags missing, invalid and negative occurrences', () => {
    expect(codes(validateEntry(entry({ occurrences: undefined }), day))).toContain(E.OCCURRENCES_MISSING);
    expect(codes(validateEntry(entry({ occurrences: null }), day))).toContain(E.OCCURRENCES_MISSING);
    expect(codes(validateEntry(entry({ occurrences: 'two' }), day))).toContain(E.OCCURRENCES_INVALID);
    expect(codes(validateEntry(entry({ occurrences: NaN }), day))).toContain(E.OCCURRENCES_INVALID);
    expect(codes(validateEntry(entry({ occurrences: -1 }), day))).toContain(E.OCCURRENCES_NEGATIVE);
  });

  it('requires whole-number occurrences (counts of times/cycles)', () => {
    expect(codes(validateEntry(entry({ occurrences: 1.5 }), day))).toContain(E.OCCURRENCES_NOT_INTEGER);
  });

  it('flags excessive occurrences with the limit, and scales the limit for a week', () => {
    const tooManyDay = validateEntry(entry({ occurrences: 51 }), day);
    expect(codes(tooManyDay)).toContain(E.OCCURRENCES_TOO_LARGE);
    expect(tooManyDay[0].params.max).toBe(50);
    expect(codes(validateEntry(entry({ occurrences: 51, estimatedLiters: 2040 }), week))).not.toContain(E.OCCURRENCES_TOO_LARGE);
    expect(codes(validateEntry(entry({ occurrences: 351 }), week))).toContain(E.OCCURRENCES_TOO_LARGE);
  });

  it('flags missing, invalid, negative, zero and excessive durations on flow activities', () => {
    expect(codes(validateEntry(entry({ durationMinutes: null }), day))).toContain(E.DURATION_MISSING);
    expect(codes(validateEntry(entry({ durationMinutes: 'x' }), day))).toContain(E.DURATION_INVALID);
    expect(codes(validateEntry(entry({ durationMinutes: -5 }), day))).toContain(E.DURATION_NEGATIVE);
    expect(codes(validateEntry(entry({ durationMinutes: 0 }), day))).toContain(E.DURATION_ZERO);
    expect(codes(validateEntry(entry({ durationMinutes: 181 }), day))).toContain(E.DURATION_TOO_LARGE);
  });

  it('does not require a duration for zero occurrences, but forbids one on appliances', () => {
    expect(validateEntry(entry({ occurrences: 0, durationMinutes: null, estimatedLiters: 0 }), day)).toEqual([]);
    expect(codes(validateEntry(entry({ occurrences: 0, durationMinutes: 5, estimatedLiters: 0 }), day))).toContain(E.DURATION_NOT_APPLICABLE);
    const appliance = { activityId: 'washing_machine', occurrences: 1, durationMinutes: 30, rateUsed: 50, estimatedLiters: 50 };
    expect(codes(validateEntry(appliance, day))).toContain(E.DURATION_NOT_APPLICABLE);
  });

  it('flags an invalid or excessive rate snapshot', () => {
    expect(codes(validateEntry(entry({ rateUsed: 0 }), day))).toContain(E.RATE_INVALID);
    expect(codes(validateEntry(entry({ rateUsed: -3 }), day))).toContain(E.RATE_INVALID);
    expect(codes(validateEntry(entry({ rateUsed: 101 }), day))).toContain(E.RATE_TOO_LARGE);
    expect(codes(validateEntry({ activityId: 'washing_machine', occurrences: 1, durationMinutes: null, rateUsed: 1001, estimatedLiters: 1001 }, day))).toContain(E.RATE_TOO_LARGE);
  });

  it('catches stored liters that disagree with the canonical engine', () => {
    expect(codes(validateEntry(entry({ estimatedLiters: 81 }), day))).toContain(E.LITERS_MISMATCH);
    expect(codes(validateEntry(entry({ estimatedLiters: 'many' }), day))).toContain(E.LITERS_MISMATCH);
  });

  it('turns bad form input into per-activity errors, never into numbers', () => {
    const { perActivity, log } = build({
      shower: { occurrences: 'abc' },
      faucet: { occurrences: -2, durationMinutes: 3 },
      dishwashing: { occurrences: 3, durationMinutes: '' },
      plant_watering: { occurrences: 3, durationMinutes: '0' },
      washing_machine: { occurrences: 1000 },
      house_cleaning: { occurrences: 2.5 },
    });
    expect(Object.values(perActivity).every((a) => a.status === ANSWER_STATUS.INVALID)).toBe(true);
    expect(codes(perActivity.shower.errors)).toEqual([E.OCCURRENCES_INVALID]);
    expect(codes(perActivity.faucet.errors)).toContain(E.OCCURRENCES_NEGATIVE);
    expect(codes(perActivity.dishwashing.errors)).toContain(E.DURATION_MISSING);
    expect(codes(perActivity.plant_watering.errors)).toContain(E.DURATION_ZERO);
    expect(codes(perActivity.washing_machine.errors)).toContain(E.OCCURRENCES_TOO_LARGE);
    expect(codes(perActivity.house_cleaning.errors)).toContain(E.OCCURRENCES_NOT_INTEGER);
    expect(log.entries).toHaveLength(0);
  });

  it('accepts Arabic-Indic digits typed into the form', () => {
    const { perActivity, log } = build({ shower: { occurrences: '\u0662', durationMinutes: '\u0665' } });
    expect(perActivity.shower.status).toBe(ANSWER_STATUS.ANSWERED);
    expect(log.entries[0].estimatedLiters).toBe(80);
  });

  it('validates household size when given', () => {
    expect(codes(validateLog({ ...makeLog({ id: 'a', periodStart: '2026-11-03' }), householdSize: 0 }, { today: TODAY }).errors)).toContain(E.HOUSEHOLD_SIZE_INVALID);
    expect(codes(validateLog({ ...makeLog({ id: 'a', periodStart: '2026-11-03' }), householdSize: 31 }, { today: TODAY }).errors)).toContain(E.HOUSEHOLD_SIZE_INVALID);
    expect(codes(validateLog({ ...makeLog({ id: 'a', periodStart: '2026-11-03' }), householdSize: 2.5 }, { today: TODAY }).errors)).toContain(E.HOUSEHOLD_SIZE_INVALID);
    expect(validateLog({ ...makeLog({ id: 'a', periodStart: '2026-11-03' }), householdSize: 4 }, { today: TODAY }).isValid).toBe(true);
  });

  it('rejects invalid status values and non-array entries', () => {
    const log = makeLog({ id: 'a', periodStart: '2026-11-03' });
    expect(codes(validateLog({ ...log, status: 'done' }, { today: TODAY }).errors)).toContain(E.STATUS_INVALID);
    expect(codes(validateLog({ ...log, entries: 'x' }, { today: TODAY }).errors)).toContain(E.ENTRIES_INVALID);
  });
});

describe('assumption validation (editable rates)', () => {
  it('accepts the placeholder assumptions', () => {
    expect(validateAssumptions(ASSUMPTIONS)).toEqual([]);
  });

  it('rejects missing, zero, negative, non-numeric and excessive rates', () => {
    const bad = { ...ASSUMPTIONS, shower: { rate: 0 }, faucet: { rate: -1 }, dishwashing: { rate: 'a' }, plant_watering: { rate: 101 }, washing_machine: { rate: 1001 } };
    delete bad.house_cleaning;
    const found = validateAssumptions(bad).map((e) => `${e.activityId}:${e.code}`);
    expect(found).toContain(`shower:${E.RATE_INVALID}`);
    expect(found).toContain(`faucet:${E.RATE_INVALID}`);
    expect(found).toContain(`dishwashing:${E.RATE_INVALID}`);
    expect(found).toContain(`plant_watering:${E.RATE_TOO_LARGE}`);
    expect(found).toContain(`washing_machine:${E.RATE_TOO_LARGE}`);
    expect(found).toContain(`house_cleaning:${E.ASSUMPTION_MISSING}`);
    expect(ACTIVITY_IDS.SHOWER).toBe('shower');
  });
});
