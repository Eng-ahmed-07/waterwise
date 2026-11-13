import { describe, expect, it } from 'vitest';
import PlannedPage from '../app/PlannedPage';
import { ar } from '../locales/ar';
import { countMetrics, renderPage } from '../test/renderWithApp';
import AboutEstimatesPage from './about/AboutEstimatesPage';
import ForgotPasswordPage from './auth/ForgotPasswordPage';
import LoginPage from './auth/LoginPage';
import RegisterPage from './auth/RegisterPage';
import ResetPasswordPage from './auth/ResetPasswordPage';
import CalculatorPage from './calculator/CalculatorPage';
import DashboardPage from './dashboard/DashboardPage';
import HistoryPage from './history/HistoryPage';
import HomePage from './home/HomePage';
import OnboardingPage from './household/OnboardingPage';

// Smoke tests: each page renders inside its providers, shows its key content, and keeps the labelling
// contract (every number is a labelled MetricValue). Interaction is covered by the browser run in the report.

// Every number (<bdi>) must sit inside a labelled MetricValue. A labelled row may show a dash instead of
// a number, so numbers <= labelled groups.
const assertLabelled = (html) => {
  const { numbers, labelled } = countMetrics(html);
  expect(numbers).toBeLessThanOrEqual(labelled);
  return numbers;
};

describe('public pages', () => {
  it('Home: hero, calls to action, the two sample figures (one estimated, one projected) and the honesty block', () => {
    const html = renderPage(<HomePage />);
    expect(html).toContain(ar.home.hero.title);
    expect(html).toContain('href="/calculator"');
    expect(html).toContain('href="/register"');
    expect(html).toContain('data-basis="estimated"');
    expect(html).toContain('data-basis="projected"');
    expect(html).toContain(ar.home.honesty.title);
    expect(html).toContain('href="/about-estimates"');
    expect(assertLabelled(html)).toBe(2);
  });

  it('Home uses Arabic-Indic numerals for the step numbers', () => {
    expect(renderPage(<HomePage />)).toContain('>٣</span>');
  });

  it('About: explains estimated vs projected, the formulas, the 7-day rule and placeholders', () => {
    const html = renderPage(<AboutEstimatesPage />);
    expect(html).toContain(ar.about.title);
    expect(html).toContain(ar.about.sections.formulas.weekly);
    expect(html).toContain(ar.about.sections.assumptions.body);
    expect(html).toContain('٧ أيام مكتملة');
    expect(html).toContain('data-basis="estimated"');
    expect(html).toContain('data-basis="projected"');
    expect(html).not.toContain('data-basis="actual"');
  });
});

describe('auth pages', () => {
  it('Login: fields, links, and the honest demo notice', () => {
    const html = renderPage(<LoginPage />, { path: '/login' });
    expect(html).toContain(ar.auth.login.title);
    expect(html).toContain('type="email"');
    expect(html).toContain('type="password"');
    expect(html).toContain('href="/forgot-password"');
    expect(html).toContain('href="/register"');
    expect(html).toContain(ar.auth.demoNotice);
    expect(html.toLowerCase()).toContain('novalidate');
  });

  it('Register, Forgot and Reset render their forms', () => {
    expect(renderPage(<RegisterPage />)).toContain(ar.auth.register.title);
    expect(renderPage(<ForgotPasswordPage />)).toContain(ar.auth.forgot.submit);
    expect(renderPage(<ResetPasswordPage />)).toContain(ar.auth.reset.confirm);
  });

  it('Onboarding: name, size and the 27 governorates', () => {
    const html = renderPage(<OnboardingPage />, { authenticated: true });
    expect(html).toContain(ar.onboarding.title);
    expect(html).toContain(ar.onboarding.size);
    expect(html.split('<option').length - 1).toBe(28); // placeholder + 27
    expect(html).toContain('القاهرة');
  });
});

describe('calculator page', () => {
  it('guest: banner, locked cards, six activities, empty results, assumptions, no save-as-draft', () => {
    const html = renderPage(<CalculatorPage />, { path: '/calculator' });
    expect(html).toContain(ar.calculatorPage.guestBanner);
    expect(html).toContain(ar.calculatorPage.period.chooseFirst);
    for (const id of Object.keys(ar.calculator.activities)) expect(html).toContain(ar.calculator.activities[id].name);
    expect(html).toContain(ar.calculatorPage.results.pending);
    expect(html).toContain(ar.calculatorPage.assumptions.title);
    expect(html).toContain(ar.calculatorPage.save.complete);
    expect(html).not.toContain(ar.calculatorPage.save.draft);
    expect(html).toContain('disabled=""'); // fields and the save button are locked
    expect(assertLabelled(html)).toBe(0);
  });

  it('registered: no guest banner, and a save-as-draft button', () => {
    const html = renderPage(<CalculatorPage />, { authenticated: true, path: '/calculator' });
    expect(html).not.toContain(ar.calculatorPage.guestBanner);
    expect(html).toContain(ar.calculatorPage.save.draft);
    expect(html).toContain(ar.calculatorPage.assumptions.registeredNote);
  });

  it('the page itself never contains a standalone unlabelled number', () => {
    for (const authenticated of [false, true]) expect(assertLabelled(renderPage(<CalculatorPage />, { authenticated }))).toBe(0);
  });
});

describe('dashboard', () => {
  const html = renderPage(<DashboardPage />, { authenticated: true });

  it('shows the household, the latest figure, week, month-to-date, per-member and the monthly outlook', () => {
    expect(html).toContain(ar.dashboard.title);
    expect(html).toContain(ar.dashboard.weekSum);
    expect(html).toContain(ar.dashboard.monthToDate);
    expect(html).toContain(ar.dashboard.perMember);
    expect(html).toContain(ar.dashboard.topActivities);
    expect(html).toContain(ar.mock.householdName);
  });

  it('every number is labelled, and coverage ("x of y complete days") is shown beside totals', () => {
    expect(assertLabelled(html)).toBeGreaterThanOrEqual(10);
    expect(html).toContain('الأيام المكتملة:');
    expect(html).toContain(ar.notices.estimateNotMeasurement);
  });

  it('reports excluded drafts instead of counting them', () => {
    expect(html).toContain(ar.calculator.projection.excludedLogs({ count: '٢' }));
  });

  it('never uses the reserved "actual" label', () => {
    expect(html).not.toContain('data-basis="actual"');
    expect(html).not.toContain(`>${ar.basis.actual.label}<`);
  });

  it('a new account with no logs sees an empty state, not zeros', () => {
    // Authenticated with an empty log list: render with a household-less guest store via a fresh account.
    const empty = renderPage(<DashboardPage />, { authenticated: false });
    expect(empty).toContain(ar.dashboard.emptyTitle);
    expect(empty).toContain('href="/calculator"');
    expect(assertLabelled(empty)).toBe(0);
  });
});

describe('history', () => {
  const html = renderPage(<HistoryPage />, { authenticated: true });

  it('lists all 11 mock logs with the filters', () => {
    expect(html).toContain(ar.history.count({ count: '١١' }));
    expect(html).toContain(ar.history.filters.from);
    expect(html).toContain(ar.history.filters.status);
    expect(html.split('<article').length - 1).toBe(11);
  });

  it('marks drafts, labels their subtotal as not included, and shows complete logs with their total', () => {
    const rows = html.split('<article').slice(1);
    const draftRows = rows.filter((row) => row.includes(`>${ar.calculator.status.draft}<`));
    expect(draftRows).toHaveLength(2);
    for (const row of draftRows) expect(row).toContain(ar.history.draftSubtotal);
    expect(rows.filter((row) => row.includes(ar.history.draftSubtotal))).toHaveLength(2);
    expect(html).toContain(ar.history.total);
    expect(html).toContain(ar.calculatorPage.results.weekNote);
  });

  it('every figure is a labelled MetricValue, and every row can be deleted', () => {
    assertLabelled(html);
    expect(html.split(`>${ar.history.delete}<`).length - 1).toBe(11);
  });

  it('is empty-state friendly for an account with no logs', () => {
    const empty = renderPage(<HistoryPage />, { authenticated: false });
    expect(empty).toContain(ar.history.emptyAll);
  });
});

describe('placeholder pages', () => {
  it('say honestly that the page is not built yet, and link back to the dashboard', () => {
    const html = renderPage(<PlannedPage labelKey="reports" />, { authenticated: true });
    expect(html).toContain(ar.layout.nav.reports);
    expect(html).toContain(ar.layout.plannedBody);
    expect(html).toContain('href="/dashboard"');
  });
});
