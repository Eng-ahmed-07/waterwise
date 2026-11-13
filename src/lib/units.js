// Units used for displayed quantities. Liters are the primary unit; cubic meters are for
// monthly-scale figures (Phase 0). Labels live in locales/ar.js under `units`.

export const UNITS = Object.freeze({
  LITER: 'liter',
  CUBIC_METER: 'cubicMeter',
  LITER_PER_DAY: 'literPerDay',
  LITER_PER_PERSON_DAY: 'literPerPersonDay',
});

export const UNIT_LIST = Object.freeze(Object.values(UNITS));

/**
 * Default display precision per unit. Whole liters are used on purpose: estimates should not
 * look more precise than they are. Cubic meters keep 2 decimals so monthly figures stay readable.
 */
export const UNIT_FRACTION_DIGITS = Object.freeze({
  [UNITS.LITER]: 0,
  [UNITS.CUBIC_METER]: 2,
  [UNITS.LITER_PER_DAY]: 0,
  [UNITS.LITER_PER_PERSON_DAY]: 0,
});

export function isUnit(value) {
  return UNIT_LIST.includes(value);
}
