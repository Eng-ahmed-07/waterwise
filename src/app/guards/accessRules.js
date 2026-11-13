// Pure routing rules (no React), so they are easy to test. The guard components in guards.jsx
// only apply the answer. Each function returns a path to redirect to, or null to allow.

/** Only same-site paths are allowed as a post-login destination (blocks open redirects). */
export function safeReturnTo(value, fallback = '/dashboard') {
  if (typeof value !== 'string') return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\') || /[\u0000-\u001f]/.test(value)) return fallback;
  if (value.startsWith('/login') || value.startsWith('/register')) return fallback;
  return value;
}

/** Signed-out visitors to a protected page go to login, remembering where they wanted to go. */
export function redirectForProtected({ isAuthenticated, pathname, search = '' }) {
  if (isAuthenticated) return null;
  return `/login?returnTo=${encodeURIComponent(`${pathname}${search}`)}`;
}

/** Signed in but no household yet: finish onboarding first. */
export function redirectForOnboardingGuard({ hasHousehold }) {
  return hasHousehold ? null : '/onboarding';
}

/** The onboarding page itself is only for accounts that still need it. */
export function redirectForOnboardingPage({ hasHousehold }) {
  return hasHousehold ? '/dashboard' : null;
}

/**
 * Login and register are for guests only. Once signed in, go where the person was heading
 * (a safe returnTo) or to the dashboard. A new account without a household is then sent on to
 * onboarding by redirectForOnboardingGuard, so login and register need no navigation code of their own.
 */
export function redirectForGuestOnly({ isAuthenticated, returnTo }) {
  return isAuthenticated ? safeReturnTo(returnTo) : null;
}
