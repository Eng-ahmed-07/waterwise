import { useState } from 'react';
import { Button, Card, Input } from '@/components/ui';
import { cn } from '@/lib/cn';
import { INPUT_STATUS, parseNumericInput } from '@/lib/numberInput';
import { ar } from '@/locales/ar';
import { ACTIVITY_DEFINITIONS } from '../domain/activityDefinitions';
import { ERROR_CODES } from '../domain/errorCodes';
import { validateRate } from '../domain/logValidation';
import { describeError } from '../domain/messages';

/**
 * "What are the assumptions?" Every activity's rate is editable and clearly a placeholder, never an
 * official figure. A typed value is applied only when it is valid, otherwise the previous rate stays
 * and the field shows why. Edits change NEW calculations only: saved logs keep the rate they used.
 */
export function AssumptionsPanel({ assumptions, mode, onSet, onReset, onResetAll }) {
  const t = ar.calculatorPage.assumptions;
  const [drafts, setDrafts] = useState({});

  const errorFor = (id) => {
    const raw = drafts[id];
    if (raw === undefined) return null;
    const parsed = parseNumericInput(raw);
    const errors = parsed.status === INPUT_STATUS.VALID ? validateRate(id, parsed.value) : [{ code: ERROR_CODES.RATE_INVALID, activityId: id }];
    return errors[0] ? describeError(errors[0]) : null;
  };

  const handleChange = (id, raw) => {
    setDrafts((current) => ({ ...current, [id]: raw }));
    const parsed = parseNumericInput(raw);
    if (parsed.status === INPUT_STATUS.VALID && validateRate(id, parsed.value).length === 0) onSet(id, parsed.value);
  };

  const clearDraft = (id) =>
    setDrafts((current) => {
      const { [id]: _removed, ...rest } = current;
      return rest;
    });

  return (
    <Card as="section" className="p-0 sm:p-0">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-card px-5 py-4 text-lg font-semibold text-ink sm:px-6">
          {t.title}
          <span aria-hidden="true" className="text-primary-700 transition-transform group-open:rotate-180">
            ▾
          </span>
        </summary>
        <div className="border-t border-line px-5 pb-5 pt-4 sm:px-6">
          <p className="text-sm text-ink-muted">{t.intro}</p>
          <p className="mt-1 text-sm font-medium text-ink">{mode === 'guest' ? t.guestNote : t.registeredNote}</p>

          <ul className="mt-4 grid gap-4">
            {ACTIVITY_DEFINITIONS.map(({ id, rateUnitKey }) => {
              const assumption = assumptions[id];
              return (
                <li key={id} className="grid gap-2 sm:grid-cols-[1fr_11rem_auto] sm:items-end">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{ar.calculator.activities[id].name}</span>
                    <span
                      className={cn(
                        'rounded-full border px-2 py-px text-xs font-semibold',
                        assumption.isPlaceholder ? 'border-line-strong text-ink-muted' : 'border-primary-600 bg-primary-50 text-primary-800',
                      )}
                    >
                      {assumption.isPlaceholder ? t.placeholder : t.edited}
                    </span>
                  </div>
                  <Input
                    label={`${t.rateLabel} (${ar.calculator.rateUnits[rateUnitKey]})`}
                    inputMode="decimal"
                    value={drafts[id] ?? String(assumption.rate)}
                    onChange={(event) => handleChange(id, event.target.value)}
                    error={errorFor(id)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={assumption.isPlaceholder && drafts[id] === undefined}
                    onClick={() => {
                      clearDraft(id);
                      onReset(id);
                    }}
                  >
                    {t.reset}
                  </Button>
                </li>
              );
            })}
          </ul>

          <Button
            variant="secondary"
            size="sm"
            className="mt-5"
            onClick={() => {
              setDrafts({});
              onResetAll();
            }}
          >
            {t.resetAll}
          </Button>
        </div>
      </details>
    </Card>
  );
}
