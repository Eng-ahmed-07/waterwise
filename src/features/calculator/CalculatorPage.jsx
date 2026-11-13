import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, useToast } from '@/components/ui';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { VALIDATION_LIMITS } from '@/lib/constants';
import { INPUT_STATUS, parseNumericInput } from '@/lib/numberInput';
import { ar } from '@/locales/ar';
import { useMockApp } from '@/features/mock/MockAppProvider';
import { ActivityCard } from './components/ActivityCard';
import { AssumptionsPanel } from './components/AssumptionsPanel';
import { LiveTotalBar } from './components/LiveTotalBar';
import { PeriodChangeDialog } from './components/PeriodChangeDialog';
import { PeriodPicker } from './components/PeriodPicker';
import { ResetPeriodDialog } from './components/ResetPeriodDialog';
import { ResultsPanel } from './components/ResultsPanel';
import { SaveGateDialog } from './components/SaveGateDialog';
import { ACTIVITY_DEFINITIONS } from './domain/activityDefinitions';
import { ERROR_CODES } from './domain/errorCodes';
import { ANSWER_STATUS } from './domain/logBuilder';
import { describeError } from './domain/messages';
import { buildFormLog, hasEnteredData } from './hooks/calculatorReducer';
import { useCalculator } from './hooks/useCalculator';

const PERIOD_FIELDS = new Set(['periodType', 'periodStart', 'periodEnd']);
const { MIN_HOUSEHOLD_SIZE, MAX_HOUSEHOLD_SIZE } = VALIDATION_LIMITS;

const newLogId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `log-${Date.now()}`);

/**
 * /calculator: open to guests AND signed-in users (Phase 0, Revision 2).
 *  - guest:      calculate and see every result; saving shows a sign-up prompt; nothing is stored
 *  - registered: the same calculator, plus saving a complete log or a draft
 * All rules live in the domain layer; this page only wires state to components.
 */
export default function CalculatorPage() {
  const app = useMockApp();
  const toast = useToast();
  const mode = app.isAuthenticated ? 'registered' : 'guest';
  const { state, evaluation, actions } = useCalculator({ today: app.today, mode, existingLogs: mode === 'registered' ? app.logs : undefined });
  const { build } = evaluation;

  const [gateOpen, setGateOpen] = useState(false);
  const [sizeRaw, setSizeRaw] = useState('');

  // A signed-in user with a household uses its size; guests (and brand-new accounts) type it in.
  const fixedSize = mode === 'registered' ? (app.household?.size ?? null) : null;
  useEffect(() => {
    if (fixedSize !== null) actions.setHouseholdSize(fixedSize);
  }, [fixedSize, actions]);

  const handleSizeChange = (raw) => {
    setSizeRaw(raw);
    const parsed = parseNumericInput(raw);
    const valid = parsed.status === INPUT_STATUS.VALID && Number.isInteger(parsed.value) && parsed.value >= MIN_HOUSEHOLD_SIZE && parsed.value <= MAX_HOUSEHOLD_SIZE;
    actions.setHouseholdSize(valid ? parsed.value : null);
  };
  const sizeInvalid = sizeRaw.trim() !== '' && state.householdSize === null;
  const sizeField =
    fixedSize === null
      ? {
          raw: sizeRaw,
          onChange: handleSizeChange,
          error: sizeInvalid ? describeError({ code: ERROR_CODES.HOUSEHOLD_SIZE_INVALID, params: { min: MIN_HOUSEHOLD_SIZE, max: MAX_HOUSEHOLD_SIZE } }) : undefined,
        }
      : null;

  const periodErrors = state.periodStart
    ? [...new Set(build.errors.filter((e) => !e.activityId && PERIOD_FIELDS.has(e.field)).map(describeError))]
    : [];

  const hasInvalidActivity = Object.values(build.perActivity).some((a) => a.status === ANSWER_STATUS.INVALID);
  const canSaveDraft = mode === 'registered' && build.answeredCount > 0 && !hasInvalidActivity && build.validation.isValid;

  const save = (finalize) => {
    const result = buildFormLog(state, { today: app.today, existingLogs: app.logs, finalize, id: newLogId() });
    if (Object.values(result.perActivity).some((a) => a.status === ANSWER_STATUS.INVALID) || !result.validation.isValid) {
      toast.error(ar.calculatorPage.save.failed);
      return;
    }
    const saved = app.saveLog(result.log);
    if (!saved.ok) {
      toast.error(describeError(saved.errors[0]));
      return;
    }
    toast.success(finalize ? ar.calculatorPage.save.savedComplete : ar.calculatorPage.save.savedDraft);
    actions.clearForm();
  };

  const locked = !state.periodStart;

  return (
    <PageContainer className="py-8">
      <PageHeader title={ar.calculatorPage.title} description={ar.calculatorPage.subtitle} />

      {mode === 'guest' && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-card border border-primary-200 bg-primary-50 p-4">
          <p className="min-w-0 text-sm font-medium text-primary-900">{ar.calculatorPage.guestBanner}</p>
          <Button as={Link} to="/register" size="sm">
            {ar.calculatorPage.guestBannerCta}
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        <div className="grid gap-6">
          <PeriodPicker
            periodType={state.periodType}
            periodStart={state.periodStart}
            today={app.today}
            errors={periodErrors}
            onTypeChange={actions.setPeriodType}
            onStartChange={actions.setPeriodStart}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {ACTIVITY_DEFINITIONS.map((definition) => (
              <ActivityCard
                key={definition.id}
                definition={definition}
                periodType={state.periodType}
                answer={state.answers[definition.id]}
                state={build.perActivity[definition.id]}
                assumption={state.assumptions[definition.id]}
                disabled={locked}
                onChange={(field, value) => actions.setAnswer(definition.id, field, value)}
                onNone={() => actions.markNone(definition.id)}
                onClear={() => actions.clearAnswer(definition.id)}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button disabled={!build.canFinalize} onClick={() => (mode === 'guest' ? setGateOpen(true) : save(true))}>
              {ar.calculatorPage.save.complete}
            </Button>
            {mode === 'registered' && (
              <Button variant="secondary" disabled={!canSaveDraft} onClick={() => save(false)}>
                {ar.calculatorPage.save.draft}
              </Button>
            )}
            <Button variant="ghost" disabled={!hasEnteredData(state.answers)} onClick={actions.requestReset}>
              {ar.calculatorPage.save.clear}
            </Button>
          </div>

          <AssumptionsPanel
            assumptions={state.assumptions}
            mode={mode}
            onSet={actions.setAssumption}
            onReset={actions.resetAssumption}
            onResetAll={actions.resetAssumptions}
          />
        </div>

        <ResultsPanel
          className="lg:sticky lg:top-24"
          evaluation={evaluation}
          today={app.today}
          periodType={state.periodType}
          mode={mode}
          householdSize={state.householdSize}
          sizeField={sizeField}
        />
      </div>

      <LiveTotalBar evaluation={evaluation} aboveBottomNav={mode === 'registered'} />

      <SaveGateDialog open={gateOpen} onClose={() => setGateOpen(false)} />
      <ResetPeriodDialog period={state.pendingReset} onConfirm={actions.confirmReset} onCancel={actions.cancelReset} />
      <PeriodChangeDialog pending={state.pendingPeriodChange} onConfirm={actions.confirmPeriodChange} onCancel={actions.cancelPeriodChange} />
    </PageContainer>
  );
}
