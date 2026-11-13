// App-wide constants. Values here are product decisions or configuration, not consumption benchmarks.

export const APP_NAME = 'WaterWise';

/**
 * Numeral system for displayed numbers.
 *  'arab' -> ١٢٣  (Arabic-Indic, default for the Arabic-first UI)
 *  'latn' -> 123  (Western digits)
 * Change it here to switch the whole app. See lib/format.js.
 */
export const NUMERAL_SYSTEM = 'arab';

/**
 * Feature flags that protect approved Phase 0 rules.
 * actualBasis: the "actual" (فعلي) basis is reserved for future meter readings.
 * While false, no figure can be labelled "actual" anywhere in the UI (see lib/basis.js).
 */
export const FEATURES = Object.freeze({
  actualBasis: false,
});

/**
 * Minimum number of COMPLETE covered days in a month before a monthly projection is shown.
 * This is a product rule to avoid misleading output, NOT a scientific threshold
 * (Phase 0, Revision 3, section C). It is consumed by Phase 2 calculator logic.
 */
export const MIN_COMPLETE_DAYS_FOR_PROJECTION = 7;

/** A weekly log covers exactly this many consecutive calendar days (Phase 0, Revision 3). */
export const WEEK_LENGTH_DAYS = 7;

/**
 * Input sanity limits (Phase 2). These are TYPO GUARDS, not consumption benchmarks and not
 * claims about what is normal for an Egyptian household: they only stop obviously mistyped
 * values (e.g. 5000 showers) from entering the calculation. Adjust here, in one place.
 */
export const VALIDATION_LIMITS = Object.freeze({
  /** Longest single occurrence a person can enter, in minutes. */
  MAX_DURATION_MINUTES: 180,
  /** Most occurrences of one activity in ONE day. A weekly log allows this x 7 for the whole week. */
  MAX_OCCURRENCES_PER_DAY: 50,
  /** Largest editable flow-rate assumption, liters per minute. */
  MAX_FLOW_LPM: 100,
  /** Largest editable per-cycle / per-session assumption, liters. */
  MAX_LITERS_PER_CYCLE: 1000,
  /** Household size range (Phase 0 schema: size between 1 and 30). */
  MIN_HOUSEHOLD_SIZE: 1,
  MAX_HOUSEHOLD_SIZE: 30,
});
