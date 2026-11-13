import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, CheckIcon, Input, MetricValue, Select, useToast } from '@/components/ui';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { ResetPeriodDialog } from '@/features/calculator/components/ResetPeriodDialog';
import { describeError, describePeriod } from '@/features/calculator/domain/messages';
import { requestPeriodReset } from '@/features/calculator/domain/periodReset';
import { validateLog } from '@/features/calculator/domain/logValidation';
import { useMockApp } from '@/features/mock/MockAppProvider';
import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/format';
import { ar } from '@/locales/ar';

const EMPTY_FILTERS = { from: '', to: '', type: 'all', status: 'all' };

/** A log overlaps the filter range if it shares at least one date with it. */
const inRange = (log, { from, to }) => (!from || log.periodEnd >= from) && (!to || log.periodStart <= to);

function StatusChip({ status }) {
  const complete = status === 'complete';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        complete ? 'border-secondary-700 bg-secondary-50 text-secondary-900' : 'border-amber-700 bg-amber-100 text-amber-800',
      )}
    >
      {complete && <CheckIcon className="size-3.5" />}
      {ar.calculator.status[status]}
    </span>
  );
}

function LogRow({ log, today, onDelete }) {
  const validation = validateLog(log, { today });
  const isComplete = validation.isComplete;

  return (
    <li>
      <Card as="article" className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <StatusChip status={isComplete ? 'complete' : 'draft'} />
            <span className="rounded-full border border-line-strong px-2.5 py-0.5 text-xs font-semibold text-ink-muted">{ar.calculator.periodTypes[log.periodType]}</span>
            <h2 className="text-base font-semibold text-ink">{describePeriod(log)}</h2>
          </div>
          <Button variant="secondary" size="sm" onClick={() => onDelete(log)}>
            {ar.history.delete}
          </Button>
        </div>

        <div className="mt-3 border-t border-line pt-3">
          {isComplete ? (
            <>
              <MetricValue variant="row" label={ar.history.total} value={validation.totalLiters} unit="liter" basis="estimated" />
              {log.periodType === 'week' && <p className="mt-1 text-xs text-ink-muted">{ar.calculatorPage.results.weekNote}</p>}
            </>
          ) : (
            <>
              <MetricValue variant="row" label={ar.history.draftSubtotal} value={validation.partialSubtotalLiters} unit="liter" basis="estimated" />
              <p className="mt-1 text-xs text-ink-muted">{ar.calculator.progress(formatNumber(validation.completeness.answeredCount), formatNumber(validation.completeness.requiredCount))}</p>
            </>
          )}
        </div>
      </Card>
    </li>
  );
}

/** History (mock data): filter by dates, type and status; delete a period after confirming exactly which one. */
export default function HistoryPage() {
  const { logs, today, deleteLog } = useMockApp();
  const toast = useToast();
  const t = ar.history;
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [pending, setPending] = useState(null);

  const visible = useMemo(
    () =>
      logs
        .filter((log) => inRange(log, filters))
        .filter((log) => filters.type === 'all' || log.periodType === filters.type)
        .filter((log) => {
          if (filters.status === 'all') return true;
          const isComplete = validateLog(log, { today }).isComplete;
          return filters.status === 'complete' ? isComplete : !isComplete;
        })
        .sort((a, b) => (a.periodStart < b.periodStart ? 1 : -1)),
    [logs, filters, today],
  );

  const set = (field) => (event) => setFilters((current) => ({ ...current, [field]: event.target.value }));
  const isFiltered = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);

  const askToDelete = (log) => {
    const result = requestPeriodReset(logs, { periodType: log.periodType, periodStart: log.periodStart });
    if (result.ok) setPending(result.confirmation);
    else toast.error(describeError(result.errors[0]));
  };

  const confirmDelete = () => {
    const result = deleteLog(pending);
    setPending(null);
    if (result.ok) toast.success(t.deleted);
    else toast.error(describeError(result.errors[0]));
  };

  return (
    <PageContainer className="py-8">
      <PageHeader
        title={t.title}
        description={t.description}
        actions={
          <Button as={Link} to="/calculator" size="sm">
            {t.addNew}
          </Button>
        }
      />

      <Card as="section" className="mb-6 p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input type="date" label={t.filters.from} value={filters.from} onChange={set('from')} />
          <Input type="date" label={t.filters.to} value={filters.to} onChange={set('to')} />
          <Select
            label={t.filters.type}
            value={filters.type}
            onChange={set('type')}
            options={[
              { value: 'all', label: t.filters.all },
              { value: 'day', label: ar.calculator.periodTypes.day },
              { value: 'week', label: ar.calculator.periodTypes.week },
            ]}
          />
          <Select
            label={t.filters.status}
            value={filters.status}
            onChange={set('status')}
            options={[
              { value: 'all', label: t.filters.all },
              { value: 'complete', label: ar.calculator.status.complete },
              { value: 'draft', label: ar.calculator.status.draft },
            ]}
          />
        </div>
        {isFiltered && (
          <Button variant="ghost" size="sm" className="mt-3" onClick={() => setFilters(EMPTY_FILTERS)}>
            {t.filters.clear}
          </Button>
        )}
      </Card>

      <p className="mb-3 text-sm text-ink-muted" aria-live="polite">
        {t.count({ count: formatNumber(visible.length) })}
      </p>

      {visible.length === 0 ? (
        <Card>
          <p className="text-ink-muted">{logs.length === 0 ? t.emptyAll : t.emptyFiltered}</p>
        </Card>
      ) : (
        <ul className="grid gap-3">
          {visible.map((log) => (
            <LogRow key={log.id} log={log} today={today} onDelete={askToDelete} />
          ))}
        </ul>
      )}

      <ResetPeriodDialog period={pending} onConfirm={confirmDelete} onCancel={() => setPending(null)} />
    </PageContainer>
  );
}
