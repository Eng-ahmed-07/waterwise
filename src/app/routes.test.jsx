import { describe, expect, it } from 'vitest';
import { GuestRoute, OnboardingGuard, OnboardingPageGuard, ProtectedRoute } from './guards/guards';
import { routes } from './routes';

// The route table must match the approved sitemap (Phase 0, Revision 3) and put every private page
// behind the right guards.

function collect(nodes, ancestors = []) {
  return nodes.flatMap((node) => {
    const chain = node.element ? [...ancestors, node.element.type] : ancestors;
    const own = node.path ? [{ path: node.path, chain }] : [];
    return [...own, ...(node.children ? collect(node.children, chain) : [])];
  });
}

const entries = collect(routes);
const byPath = Object.fromEntries(entries.map((e) => [e.path, e.chain]));

const PUBLIC_PATHS = ['/', '/calculator', '/about-estimates', '/login', '/register', '/forgot-password', '/reset-password', '*'];
const PROTECTED_PATHS = ['/onboarding', '/dashboard', '/history', '/recommendations', '/reports', '/reports/:id', '/profile', '/settings'];

describe('route table', () => {
  it('contains every page of the approved sitemap (and nothing else but the dev showcase)', () => {
    const expected = [...PUBLIC_PATHS, ...PROTECTED_PATHS].sort();
    const actual = entries.map((e) => e.path).filter((p) => p !== '/dev/ui').sort();
    expect(actual).toEqual(expected);
  });

  it('puts every private page behind ProtectedRoute', () => {
    for (const path of PROTECTED_PATHS) expect(byPath[path]).toContain(ProtectedRoute);
  });

  it('requires a household for the app pages, and only for them', () => {
    for (const path of PROTECTED_PATHS.filter((p) => p !== '/onboarding')) expect(byPath[path]).toContain(OnboardingGuard);
    expect(byPath['/onboarding']).not.toContain(OnboardingGuard);
    expect(byPath['/onboarding']).toContain(OnboardingPageGuard);
  });

  it('keeps login, register and forgot-password for guests only', () => {
    for (const path of ['/login', '/register', '/forgot-password']) expect(byPath[path]).toContain(GuestRoute);
  });

  it('leaves the calculator, methodology, home and password reset open to everyone', () => {
    for (const path of ['/', '/calculator', '/about-estimates', '/reset-password']) {
      expect(byPath[path]).not.toContain(ProtectedRoute);
      expect(byPath[path]).not.toContain(GuestRoute);
    }
  });
});
