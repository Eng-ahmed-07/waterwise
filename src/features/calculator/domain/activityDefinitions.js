// The six approved activities (Phase 0, Revision 2 section 6). Identifiers are stable: they will
// become `activities.code` in the database (Phase 4), so never rename them.
//
//   shower, faucet, dishwashing, plant_watering  -> flow-based:   minutes x times
//   washing_machine                              -> appliance:    cycles
//   house_cleaning                               -> appliance-style, counted per session
//                                                   ("dishwashing" means by hand: no dishwasher machine)
//
// Arabic names and labels are in locales/ar.js (calculator.activities.<id>).

export const CALC_TYPES = Object.freeze({ FLOW: 'flow', APPLIANCE: 'appliance' });

export const ACTIVITY_IDS = Object.freeze({
  SHOWER: 'shower',
  FAUCET: 'faucet',
  DISHWASHING: 'dishwashing',
  PLANT_WATERING: 'plant_watering',
  WASHING_MACHINE: 'washing_machine',
  HOUSE_CLEANING: 'house_cleaning',
});

/** In display order. rateUnitKey selects the unit label in ar.calculator.rateUnits. */
export const ACTIVITY_DEFINITIONS = Object.freeze(
  [
    { id: ACTIVITY_IDS.SHOWER, calcType: CALC_TYPES.FLOW, rateUnitKey: 'literPerMinute' },
    { id: ACTIVITY_IDS.FAUCET, calcType: CALC_TYPES.FLOW, rateUnitKey: 'literPerMinute' },
    { id: ACTIVITY_IDS.DISHWASHING, calcType: CALC_TYPES.FLOW, rateUnitKey: 'literPerMinute' },
    { id: ACTIVITY_IDS.PLANT_WATERING, calcType: CALC_TYPES.FLOW, rateUnitKey: 'literPerMinute' },
    { id: ACTIVITY_IDS.WASHING_MACHINE, calcType: CALC_TYPES.APPLIANCE, rateUnitKey: 'literPerCycle' },
    { id: ACTIVITY_IDS.HOUSE_CLEANING, calcType: CALC_TYPES.APPLIANCE, rateUnitKey: 'literPerSession' },
  ].map((definition, index) => Object.freeze({ ...definition, sortOrder: index + 1 })),
);

/** A log is complete only when ALL of these have been answered (zero counts as an answer). */
export const REQUIRED_ACTIVITY_IDS = Object.freeze(ACTIVITY_DEFINITIONS.map((a) => a.id));

const BY_ID = new Map(ACTIVITY_DEFINITIONS.map((a) => [a.id, a]));

export const isActivityId = (value) => BY_ID.has(value);

export function getActivityDefinition(id) {
  const definition = BY_ID.get(id);
  if (!definition) throw new RangeError(`Unknown activity id: ${String(id)}`);
  return definition;
}

/**
 * PLACEHOLDER assumptions: `rate` is liters per minute for flow activities and liters per cycle /
 * session for the others. These numbers are the ILLUSTRATIVE values used in the approved
 * Revision 3 worked example. They are NOT measured values and NOT official Egyptian benchmarks
 * (Phase 0 rule 9). Every one is flagged isPlaceholder and is meant to be edited by the user.
 * Set isPlaceholder to false only after a value is verified and its source documented.
 */
export const PLACEHOLDER_ASSUMPTIONS = Object.freeze({
  [ACTIVITY_IDS.SHOWER]: Object.freeze({ rate: 8, isPlaceholder: true }),
  [ACTIVITY_IDS.FAUCET]: Object.freeze({ rate: 6, isPlaceholder: true }),
  [ACTIVITY_IDS.DISHWASHING]: Object.freeze({ rate: 6, isPlaceholder: true }),
  [ACTIVITY_IDS.PLANT_WATERING]: Object.freeze({ rate: 10, isPlaceholder: true }),
  [ACTIVITY_IDS.WASHING_MACHINE]: Object.freeze({ rate: 50, isPlaceholder: true }),
  [ACTIVITY_IDS.HOUSE_CLEANING]: Object.freeze({ rate: 20, isPlaceholder: true }),
});

/** A fresh, editable copy of the placeholder assumptions. */
export function createDefaultAssumptions() {
  return Object.fromEntries(Object.entries(PLACEHOLDER_ASSUMPTIONS).map(([id, a]) => [id, { ...a }]));
}
