import { Button, Card, Input, SegmentedControl } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { ar } from '@/locales/ar';
import { isValidISODate, lastNDaysStart } from '../domain/dates';
import { computePeriodEnd, isPeriodType } from '../domain/periodValidation';

/**
 * Step 1 of the calculator: choose a day or a 7-day week, then its date. Period comes FIRST:
 * the activity cards stay locked until a date is chosen.
 * For a week the date is the FIRST day, so the latest allowed start is today - 6 (the week must have ended).
 * `errors` are already-translated messages for this section (overlap, future period ...).
 */
export function PeriodPicker({ periodType, periodStart, today, errors = [], onTypeChange, onStartChange }) {
  const t = ar.calculatorPage.period;
  const isWeek = periodType === 'week';
  const maxStart = isWeek ? lastNDaysStart(today, 7) : today;
  const end = isPeriodType(periodType) && isValidISODate(periodStart) ? computePeriodEnd(periodType, periodStart) : null;

  return (
    <Card title={t.title}>
      <div className="grid gap-4 sm:grid-cols-2">
        <SegmentedControl
          legend={t.typeLabel}
          value={periodType}
          onChange={onTypeChange}
          options={[
            { value: 'day', label: ar.calculator.periodTypes.day },
            { value: 'week', label: ar.calculator.periodTypes.week },
          ]}
        />
        <div>
          <Input
            type="date"
            label={isWeek ? t.weekDate : t.dayDate}
            value={periodStart ?? ''}
            max={maxStart}
            onChange={(event) => onStartChange(event.target.value || null)}
            error={errors[0]}
          />
          <Button variant="ghost" size="sm" className="mt-1.5" onClick={() => onStartChange(isWeek ? lastNDaysStart(today, 7) : today)}>
            {isWeek ? t.useLast7 : t.useToday}
          </Button>
        </div>
      </div>
      <p className="mt-3 text-sm text-ink-muted">{isWeek ? t.weekHint : t.dayHint}</p>
      {end && isWeek && <p className="mt-1 text-sm font-medium text-ink">{t.weekEnds({ end: formatDate(end) })}</p>}
      {!periodStart && <p className="mt-1 text-sm font-medium text-primary-800">{t.chooseFirst}</p>}
    </Card>
  );
}

