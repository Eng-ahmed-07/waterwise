import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, CoverageNote, MetricValue } from '@/components/ui';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { ActivityBreakdownList } from '@/features/calculator/components/ActivityBreakdownList';
import { OutlookTile } from '@/features/calculator/components/OutlookTile';
import { calculateDashboardMetrics } from '@/features/calculator/domain/dashboardMetrics';
import { formatDate, formatNumber } from '@/lib/format';
import { useMockApp } from '@/features/mock/MockAppProvider';
import { ar } from '@/locales/ar';

/**
 * Dashboard (mock data in Phase 3). Every figure comes from calculateDashboardMetrics, which uses
 * COMPLETE logs only. Each number is shown through MetricValue with its basis; the monthly figure is
 * a projection only when enough complete days exist, otherwise an explanation is shown instead.
 */
export default function DashboardPage() {
  const { logs, household, today } = useMockApp();
  const t = ar.dashboard;
  const metrics = useMemo(() => calculateDashboardMetrics({ logs, today, householdSize: household?.size }), [logs, today, household?.size]);
  const { latest, week, monthToDate, recent, perMemberDailyLiters, breakdown, outlook } = metrics;

  const description = household ? t.householdLine({ name: household.name, size: formatNumber(household.size) }) : undefined;
  const addButton = (
    <Button as={Link} to="/calculator" size="sm">
      {ar.calculatorPage.results.addDay}
    </Button>
  );

  if (!latest) {
    return (
      <PageContainer className="py-8">
        <PageHeader title={t.title} description={description} />
        <Card title={t.emptyTitle} className="max-w-xl">
          <p className="text-ink-muted">{t.emptyBody}</p>
          <Button as={Link} to="/calculator" className="mt-5">
            {t.startCalculator}
          </Button>
          {metrics.draftLogsExcluded > 0 && (
            <p className="mt-4 text-sm text-ink-muted">{ar.calculator.projection.excludedLogs({ count: formatNumber(metrics.draftLogsExcluded) })}</p>
          )}
        </Card>
      </PageContainer>
    );
  }

  const isWeekLatest = latest.periodType === 'week';

  return (
    <PageContainer className="py-8">
      <PageHeader title={t.title} description={description} actions={addButton} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricValue label={isWeekLatest ? t.latestWeek : t.latestDay} value={latest.dailyEquivalentLiters} unit="literPerDay" basis="estimated">
          <p className="text-xs text-ink-muted">
            {isWeekLatest ? `${ar.calculatorPage.results.weekNote} · ` : ''}
            {formatDate(latest.periodEnd)}
          </p>
        </MetricValue>

        <MetricValue label={t.weekSum} value={week.coveredDays > 0 ? week.totalLiters : null} unit="liter" basis="estimated">
          <CoverageNote covered={week.coveredDays} total={week.windowDays} />
        </MetricValue>

        <MetricValue label={t.monthToDate} value={monthToDate.coveredDays > 0 ? monthToDate.totalLiters : null} unit="liter" basis="estimated">
          <CoverageNote covered={monthToDate.coveredDays} total={monthToDate.daysInMonth} />
        </MetricValue>

        <MetricValue label={t.perMember} value={perMemberDailyLiters} unit="literPerPersonDay" basis="estimated">
          {perMemberDailyLiters === null && <p className="text-xs text-ink-muted">{t.perMemberMissing}</p>}
        </MetricValue>

        <div className="sm:col-span-2 xl:col-span-2">
          <OutlookTile outlook={outlook} />
        </div>
      </div>

      <Card as="section" title={t.topActivities} description={t.topActivitiesNote({ days: formatNumber(recent.coveredDays) })} className="mt-6">
        <ActivityBreakdownList breakdown={breakdown} />
      </Card>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-muted">
        <p>{ar.notices.estimateNotMeasurement}</p>
        {metrics.draftLogsExcluded > 0 && (
          <p>
            {ar.calculator.projection.excludedLogs({ count: formatNumber(metrics.draftLogsExcluded) })}{' '}
            <Link to="/history" className="font-semibold text-primary-700 underline underline-offset-4">
              {t.finishDrafts}
            </Link>
          </p>
        )}
      </div>
    </PageContainer>
  );
}
