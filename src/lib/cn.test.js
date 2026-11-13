import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('joins truthy class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });
  it('skips falsy values', () => {
    expect(cn('a', false, null, undefined, '', 0, 'b')).toBe('a b');
  });
  it('flattens nested arrays', () => {
    expect(cn('a', ['b', [false, 'c']], 'd')).toBe('a b c d');
  });
  it('returns an empty string when nothing is passed', () => {
    expect(cn()).toBe('');
  });
});
