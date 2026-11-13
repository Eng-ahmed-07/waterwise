import { describe, expect, it } from 'vitest';
import { BASIS, BASIS_LIST, isBasis, resolveBasis } from './basis';
import { FEATURES } from './constants';

describe('basis contract', () => {
  it('defines exactly the three approved bases', () => {
    expect(BASIS_LIST).toEqual(['estimated', 'projected', 'actual']);
  });

  it('keeps the "actual" basis disabled in the MVP', () => {
    expect(FEATURES.actualBasis).toBe(false);
  });

  it('recognises valid bases only', () => {
    expect(isBasis('estimated')).toBe(true);
    expect(isBasis('projected')).toBe(true);
    expect(isBasis('monthly')).toBe(false);
    expect(isBasis(undefined)).toBe(false);
  });

  it('accepts estimated and projected', () => {
    expect(resolveBasis('estimated', { strict: true })).toEqual({ ok: true, basis: 'estimated', error: null });
    expect(resolveBasis('projected', { strict: true }).ok).toBe(true);
  });

  it('strict mode throws on a missing basis', () => {
    expect(() => resolveBasis(undefined, { strict: true })).toThrow(/Missing required "basis"/);
    expect(() => resolveBasis(null, { strict: true })).toThrow(/Missing required "basis"/);
  });

  it('strict mode throws on an invalid basis', () => {
    expect(() => resolveBasis('monthly', { strict: true })).toThrow(/Invalid basis/);
  });

  it('non-strict mode fails closed instead of throwing', () => {
    const result = resolveBasis(undefined, { strict: false });
    expect(result.ok).toBe(false);
    expect(result.basis).toBeNull();
  });

  it('rejects "actual" while the feature is disabled', () => {
    expect(() => resolveBasis(BASIS.ACTUAL, { strict: true })).toThrow(/reserved for future meter readings/);
    expect(resolveBasis(BASIS.ACTUAL, { strict: false }).ok).toBe(false);
  });

  it('allows "actual" only when explicitly enabled (future meter readings)', () => {
    expect(resolveBasis(BASIS.ACTUAL, { strict: true, allowActual: true }).ok).toBe(true);
  });
});
