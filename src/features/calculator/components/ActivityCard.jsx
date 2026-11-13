import { AlertIcon, Button, Card, CheckIcon, NumberField } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/format';
import { ar } from '@/locales/ar';
import { CALC_TYPES } from '../domain/activityDefinitions';
import { describeError } from '../domain/messages';
import { ANSWER_STATUS } from '../domain/logBuilder';

const isZero = (value) => value === 0 || (typeof value === 'string' && value.trim() !== '' && Number(value) === 0);

/**
 * One of the six activities. Blank is "not answered"; "لا استخدام" records an explicit zero.
 * The card never shows a computed liters figure: results are shown only through MetricValue
 * in the results panel (Phase 0 labelling contract).
 *
 * `state` is { status, errors } from buildLogFromAnswers().perActivity[id].
 */
export function ActivityCard({ definition, periodType, answer = {}, state, assumption, disabled, onChange, onNone, onClear }) {
  const text = ar.calculatorPage.activity;
  const names = ar.calculator.activities[definition.id];
  const isFlow = definition.calcType === CALC_TYPES.FLOW;
  const noUsage = isZero(answer.occurrences);
  const unit = ar.calculator.rateUnits[definition.rateUnitKey];
  const messages = (field) => state.errors.filter((e) => e.field === field).map(describeError).join(' ');
  const answered = state.status === ANSWER_STATUS.ANSWERED;

  const chip = (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        answered ? 'border-secondary-700 bg-secondary-50 text-secondary-900' : 'border-line-strong bg-surface text-ink-muted',
      )}
    >
      {answered && <CheckIcon className="size-3.5" />}
      {answered ? text.answered : text.unanswered}
    </span>
  );

  return (
    <Card
      as="section"
      title={names.name}
      titleAs="h3"
      description={text.rateLine({ rate: formatNumber(assumption.rate, { fractionDigits: 2 }), unit })}
      action={chip}
      className={cn('p-4 sm:p-5', disabled && 'opacity-60')}
      aria-disabled={disabled || undefined}
    >
      {noUsage ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-ink-muted">{text.noUsageBody}</p>
          <Button variant="ghost" size="sm" onClick={onClear} disabled={disabled}>
            {text.edit}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          <NumberField
            label={periodType === 'week' ? names.occurrencesWeek : names.occurrencesDay}
            value={answer.occurrences ?? ''}
            onChange={(value) => onChange('occurrences', value)}
            disabled={disabled}
            error={messages('occurrences')}
            incrementLabel={text.increase}
            decrementLabel={text.decrease}
          />
          {isFlow && (
            <NumberField
              label={ar.calculator.durationLabel}
              value={answer.durationMinutes ?? ''}
              onChange={(value) => onChange('durationMinutes', value)}
              disabled={disabled}
              error={messages('durationMinutes')}
              incrementLabel={text.increase}
              decrementLabel={text.decrease}
            />
          )}
          <Button variant="secondary" size="sm" onClick={onNone} disabled={disabled} aria-pressed={false} className="justify-self-start">
            {ar.calculator.noUsage}
          </Button>
        </div>
      )}
      {state.errors.some((e) => !['occurrences', 'durationMinutes'].includes(e.field)) && (
        <p className="mt-3 flex items-start gap-1.5 text-xs font-medium text-danger-700">
          <AlertIcon className="mt-0.5 size-4 shrink-0" />
          <span>{state.errors.filter((e) => !['occurrences', 'durationMinutes'].includes(e.field)).map(describeError).join(' ')}</span>
        </p>
      )}
    </Card>
  );
}
