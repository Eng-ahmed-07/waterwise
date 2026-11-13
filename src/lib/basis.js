import { FEATURES } from './constants';

/**
 * The three bases of every displayed figure (Phase 0 labelling contract, section 4):
 *  estimated -> computed from the household's entered habits x assumptions   (تقديري)
 *  projected -> an extrapolation, e.g. daily average x days in month         (متوقع)
 *  actual    -> derived only from real meter readings. RESERVED: not available in the MVP.
 * Estimates and projections are never mixed in one total.
 */
export const BASIS = Object.freeze({
  ESTIMATED: 'estimated',
  PROJECTED: 'projected',
  ACTUAL: 'actual',
});

export const BASIS_LIST = Object.freeze(Object.values(BASIS));

export function isBasis(value) {
  return BASIS_LIST.includes(value);
}

/**
 * Validates a basis value.
 *
 * strict = true  (development): throws on a missing or invalid basis, so an unlabelled number
 *                                can never ship by accident.
 * strict = false (production):  never throws; returns { ok: false } so the caller can FAIL CLOSED
 *                                (hide the number instead of showing it unlabelled).
 *
 * "actual" is rejected unless allowActual is true. It stays false until meter readings exist.
 */
export function resolveBasis(basis, { strict = false, allowActual = FEATURES.actualBasis } = {}) {
  let error = null;
  if (basis === undefined || basis === null) {
    error = 'Missing required "basis". Use "estimated" or "projected".';
  } else if (!isBasis(basis)) {
    error = `Invalid basis "${String(basis)}". Expected one of: ${BASIS_LIST.join(', ')}.`;
  } else if (basis === BASIS.ACTUAL && !allowActual) {
    error = 'Basis "actual" is reserved for future meter readings and is disabled in the MVP.';
  }

  if (error) {
    if (strict) throw new Error(error);
    return { ok: false, basis: null, error };
  }
  return { ok: true, basis, error: null };
}
