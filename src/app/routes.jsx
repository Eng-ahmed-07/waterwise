import { AdaptiveLayout } from '@/components/layout/AdaptiveLayout';
import { AppShell } from '@/components/layout/AppShell';
import { PublicLayout } from '@/components/layout/PublicLayout';
import AboutEstimatesPage from '@/features/about/AboutEstimatesPage';
import ForgotPasswordPage from '@/features/auth/ForgotPasswordPage';
import LoginPage from '@/features/auth/LoginPage';
import RegisterPage from '@/features/auth/RegisterPage';
import ResetPasswordPage from '@/features/auth/ResetPasswordPage';
import CalculatorPage from '@/features/calculator/CalculatorPage';
import DashboardPage from '@/features/dashboard/DashboardPage';
import HistoryPage from '@/features/history/HistoryPage';
import HomePage from '@/features/home/HomePage';
import OnboardingPage from '@/features/household/OnboardingPage';
import { GuestRoute, OnboardingGuard, OnboardingPageGuard, ProtectedRoute } from './guards/guards';
import NotFoundPage from './NotFoundPage';
import PlannedPage from './PlannedPage';

/**
 * The approved sitemap (Phase 0, Revision 3) as plain route objects, so tests can read it.
 * Layout and guard routes have no path; they wrap their children.
 * Sitemap pages that arrive in a later phase use PlannedPage (recommendations, reports, profile, settings).
 */
export const routes = [
  // Public pages with the public navbar
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },

  // Open to everyone: the layout matches the visitor (guest navbar or signed-in shell)
  {
    element: <AdaptiveLayout />,
    children: [
      { path: '/calculator', element: <CalculatorPage /> },
      { path: '/about-estimates', element: <AboutEstimatesPage /> },
    ],
  },

  // Guests only
  {
    element: <GuestRoute />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
          { path: '/forgot-password', element: <ForgotPasswordPage /> },
        ],
      },
    ],
  },

  // Signed-in only
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <OnboardingPageGuard />,
        children: [{ element: <PublicLayout />, children: [{ path: '/onboarding', element: <OnboardingPage /> }] }],
      },
      {
        element: <OnboardingGuard />,
        children: [
          {
            element: <AppShell />,
            children: [
              { path: '/dashboard', element: <DashboardPage /> },
              { path: '/history', element: <HistoryPage /> },
              { path: '/recommendations', element: <PlannedPage labelKey="recommendations" /> },
              { path: '/reports', element: <PlannedPage labelKey="reports" /> },
              { path: '/reports/:id', element: <PlannedPage labelKey="reports" /> },
              { path: '/profile', element: <PlannedPage labelKey="profile" /> },
              { path: '/settings', element: <PlannedPage labelKey="settings" /> },
            ],
          },
        ],
      },
    ],
  },

  // Dev-only component showcase. import.meta.env.DEV is replaced at build time, so this entry and
  // its lazy import are removed from the production bundle.
  ...(import.meta.env.DEV ? [{ path: '/dev/ui', lazy: () => import('@/features/dev-ui/UiShowcase') }] : []),
];
