import { describe, expect, it } from 'vitest';
import { ACTIVITY_DEFINITIONS, ACTIVITY_IDS, CALC_TYPES, REQUIRED_ACTIVITY_IDS, createDefaultAssumptions, getActivityDefinition, PLACEHOLDER_ASSUMPTIONS } from './activityDefinitions';
import { calculateEntry, calculateLiters, dailyEquivalent, roundLiters, sumLiters } from './calculations';
import { ASSUMPTIONS, close } from './testHelpers';

describe('the six approved activities', () => {
  it('are exactly shower, faucet, dishwashing, plant_watering, washing_machine, house_cleaning', () => {
    expect(REQUIRED_ACTIVITY_IDS).toEqual(['shower', 'faucet', 'dishwashing', 'plant_watering', 'washing_machine', 'house_cleaning']);
    expect(ACTIVITY_DEFINITIONS).toHaveLength(6);
  });

  it('classifies four as flow-based and two as appliance/per-session (Revision 2, section 6)', () => {
    const flow = ACTIVITY_DEFINITIONS.filter((a) => a.calcType === CALC_TYPES.FLOW).map((a) => a.id);
    const appliance = ACTIVITY_DEFINITIONS.filter((a) => a.calcType === CALC_TYPES.APPLIANCE).map((a) => a.id);
    expect(flow).toEqual(['shower', 'faucet', 'dishwashing', 'plant_watering']);
    expect(appliance).toEqual(['washing_machine', 'house_cleaning']);
  });

  it('rejects unknown activity ids', () => {
    expect(() => getActivityDefinition('dishwasher_machine')).toThrow(RangeError);
  });

  it('flags every default rate as a placeholder, never as an official value', () => {
    for (const id of REQUIRED_ACTIVITY_IDS) expect(PLACEHOLDER_ASSUMPTIONS[id].isPlaceholder).toBe(true);
  });

  it('hands out independent copies of the assumptions (editing one cannot change the defaults)', () => {
    const copy = createDefaultAssumptions();
    copy.shower.rate = 99;
    expect(PLACEHOLDER_ASSUMPTIONS.shower.rate).toBe(8);
    expect(createDefaultAssumptions().shower.rate).toBe(8);
  });
});

describe('canonical engine: flow activities', () => {
  it('liters = flow_lpm x duration_minutes x occurrences', () => {
    expect(calculateLiters({ calcType: 'flow', rate: 8, durationMinutes: 6, occurrences: 4 })).toBe(192);
    expect(calculateLiters({ calcType: 'flow', rate: 6, durationMinutes: 2, occurrences: 6 })).toBe(72);
  });

  it('handles fractional minutes', () => {
    expect(calculateLiters({ calcType: 'flow', rate: 8, durationMinutes: 7.5, occurrences: 2 })).toBe(120);
  });
});

describe('canonical engine: appliance activities', () => {
  it('liters = liters_per_cycle x occurrences, and ignores any duration', () => {
    expect(calculateLiters({ calcType: 'appliance', rate: 50, occurrences: 3 })).toBe(150);
    expect(calculateLiters({ calcType: 'appliance', rate: 50, occurrences: 3, durationMinutes: 999 })).toBe(150);
  });
});

describe('frequency semantics: occurrences are always the period TOTAL', () => {
  it('daily: 4 showers today are 4 occurrences', () => {
    expect(calculateEntry({ activityId: 'shower', occurrences: 4, durationMinutes: 6 }, ASSUMPTIONS).estimatedLiters).toBe(192);
  });

  it('weekly: 28 showers in the week are 28 occurrences, NOT 28 x 7', () => {
    const weekly = calculateEntry({ activityId: 'shower', occurrences: 28, durationMinutes: 6 }, ASSUMPTIONS);
    expect(weekly.estimatedLiters).toBe(1344); // 8 x 6 x 28
    expect(weekly.estimatedLiters).not.toBe(9408); // the double-counting trap: 1344 x 7
  });

  it('the same formula serves day and week: only the occurrence total differs', () => {
    const day = calculateEntry({ activityId: 'washing_machine', occurrences: 1 }, ASSUMPTIONS);
    const week = calculateEntry({ activityId: 'washing_machine', occurrences: 4 }, ASSUMPTIONS);
    expect(week.estimatedLiters).toBe(4 * day.estimatedLiters);
  });

  it('a weekly total becomes a daily equivalent only by dividing by 7', () => {
    expect(dailyEquivalent(3648, 7)).toBe(3648 / 7);
    expect(close(dailyEquivalent(3648, 7), 521.142857142857)).toBe(true);
    expect(dailyEquivalent(494, 1)).toBe(494);
  });

  it('rejects an invalid number of days', () => {
    expect(() => dailyEquivalent(100, 0)).toThrow(RangeError);
    expect(() => dailyEquivalent(100, 1.5)).toThrow(RangeError);
  });
});

describe('explicit zero', () => {
  it('zero occurrences is a real answer: 0 liters and no duration, for flow and appliance alike', () => {
    expect(calculateEntry({ activityId: 'plant_watering', occurrences: 0 }, ASSUMPTIONS)).toEqual({
      activityId: 'plant_watering',
      occurrences: 0,
      durationMinutes: null,
      rateUsed: 10,
      estimatedLiters: 0,
    });
    expect(calculateEntry({ activityId: 'house_cleaning', occurrences: 0 }, ASSUMPTIONS).estimatedLiters).toBe(0);
  });

  it('ignores a duration typed alongside zero occurrences', () => {
    expect(calculateEntry({ activityId: 'shower', occurrences: 0, durationMinutes: 8 }, ASSUMPTIONS).durationMinutes).toBeNull();
  });
});

describe('entry snapshots', () => {
  it('stores the rate used so later assumption edits cannot rewrite history', () => {
    const before = calculateEntry({ activityId: 'shower', occurrences: 1, durationMinutes: 10 }, ASSUMPTIONS);
    const edited = { ...ASSUMPTIONS, shower: { rate: 4, isPlaceholder: false } };
    const after = calculateEntry({ activityId: 'shower', occurrences: 1, durationMinutes: 10 }, edited);
    expect(before.rateUsed).toBe(8);
    expect(before.estimatedLiters).toBe(80);
    expect(after.rateUsed).toBe(4);
    expect(after.estimatedLiters).toBe(40);
  });

  it('throws when an assumption is missing instead of guessing', () => {
    expect(() => calculateEntry({ activityId: 'shower', occurrences: 1, durationMinutes: 5 }, {})).toThrow(RangeError);
  });
});

describe('engine safety', () => {
  it('rejects negative, non-finite and missing numbers instead of returning NaN', () => {
    const base = { calcType: 'flow', rate: 8, durationMinutes: 6, occurrences: 4 };
    expect(() => calculateLiters({ ...base, occurrences: -1 })).toThrow(RangeError);
    expect(() => calculateLiters({ ...base, durationMinutes: -1 })).toThrow(RangeError);
    expect(() => calculateLiters({ ...base, rate: NaN })).toThrow(RangeError);
    expect(() => calculateLiters({ ...base, durationMinutes: undefined })).toThrow(RangeError);
    expect(() => calculateLiters({ ...base, occurrences: '4' })).toThrow(RangeError);
    expect(() => calculateLiters({ ...base, calcType: 'other' })).toThrow(RangeError);
  });

  it('removes floating-point noise', () => {
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(sumLiters([0.1, 0.2])).toBe(0.3);
    expect(roundLiters(3647.9999999999995)).toBe(3648);
  });
});
