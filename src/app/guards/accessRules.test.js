import { describe, expect, it } from 'vitest';
import { redirectForGuestOnly, redirectForOnboardingGuard, redirectForOnboardingPage, redirectForProtected, safeReturnTo } from './accessRules';

describe('safeReturnTo (blocks open redirects)', () => {
  it('allows ordinary same-site paths, with query strings', () => {
    expect(safeReturnTo('/history')).toBe('/history');
    expect(safeReturnTo('/calculator?x=1')).toBe('/calculator?x=1');
    expect(safeReturnTo('/reports/42')).toBe('/reports/42');
  });

  it('rejects other sites, protocol-relative URLs and script URLs', () => {
    for (const bad of ['https://evil.example', '//evil.example', '/\\evil.example', 'javascript:alert(1)', 'evil.example', '', '  /history']) {
      expect(safeReturnTo(bad)).toBe('/dashboard');
    }
  });

  it('rejects non-strings and control characters', () => {
    for (const bad of [null, undefined, 42, {}, [], '/ok\nSet-Cookie: x']) expect(safeReturnTo(bad)).toBe('/dashboard');
  });

  it('never bounces back into login or register', () => {
    expect(safeReturnTo('/login')).toBe('/dashboard');
    expect(safeReturnTo('/register?x=1')).toBe('/dashboard');
  });

  it('accepts a custom fallback', () => {
    expect(safeReturnTo('//x', '/')).toBe('/');
  });
});

describe('route rules from the approved sitemap', () => {
  it('signed-out visitors to a protected page go to login, remembering the page and its query', () => {
    expect(redirectForProtected({ isAuthenticated: false, pathname: '/history', search: '?from=2026-11-01' })).toBe('/login?returnTo=%2Fhistory%3Ffrom%3D2026-11-01');
    expect(redirectForProtected({ isAuthenticated: false, pathname: '/dashboard' })).toBe('/login?returnTo=%2Fdashboard');
    expect(redirectForProtected({ isAuthenticated: true, pathname: '/dashboard' })).toBeNull();
  });

  it('a signed-in account without a household is sent to onboarding', () => {
    expect(redirectForOnboardingGuard({ hasHousehold: false })).toBe('/onboarding');
    expect(redirectForOnboardingGuard({ hasHousehold: true })).toBeNull();
  });

  it('the onboarding page is skipped once the household exists', () => {
    expect(redirectForOnboardingPage({ hasHousehold: true })).toBe('/dashboard');
    expect(redirectForOnboardingPage({ hasHousehold: false })).toBeNull();
  });

  it('login and register redirect signed-in users to a safe returnTo or the dashboard', () => {
    expect(redirectForGuestOnly({ isAuthenticated: true })).toBe('/dashboard');
    expect(redirectForGuestOnly({ isAuthenticated: true, returnTo: '/history' })).toBe('/history');
    expect(redirectForGuestOnly({ isAuthenticated: true, returnTo: '//evil.example' })).toBe('/dashboard');
    expect(redirectForGuestOnly({ isAuthenticated: false, returnTo: '/history' })).toBeNull();
  });
});
