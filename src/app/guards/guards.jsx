import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router-dom';
import { useMockApp } from '@/features/mock/MockAppProvider';
import { redirectForGuestOnly, redirectForOnboardingGuard, redirectForOnboardingPage, redirectForProtected } from './accessRules';

// Route guards (Phase 0 sitemap rules). They read the mock session today; Phase 5 swaps the source
// for real auth without changing the rules in accessRules.js.

function Gate({ to }) {
  return to ? <Navigate to={to} replace /> : <Outlet />;
}

/** Signed-out -> /login?returnTo=... */
export function ProtectedRoute() {
  const { isAuthenticated } = useMockApp();
  const { pathname, search } = useLocation();
  return <Gate to={redirectForProtected({ isAuthenticated, pathname, search })} />;
}

/** Signed in without a household -> /onboarding */
export function OnboardingGuard() {
  const { household } = useMockApp();
  return <Gate to={redirectForOnboardingGuard({ hasHousehold: Boolean(household) })} />;
}

/** Onboarding page: skip it if the household already exists. */
export function OnboardingPageGuard() {
  const { household } = useMockApp();
  return <Gate to={redirectForOnboardingPage({ hasHousehold: Boolean(household) })} />;
}

/** Login / register: once signed in, continue to returnTo or the dashboard. */
export function GuestRoute() {
  const { isAuthenticated } = useMockApp();
  const [params] = useSearchParams();
  return <Gate to={redirectForGuestOnly({ isAuthenticated, returnTo: params.get('returnTo') })} />;
}
