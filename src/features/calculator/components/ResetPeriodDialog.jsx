import { Button, Modal } from '@/components/ui';
import { ar } from '@/locales/ar';
import { describePeriod } from '../domain/messages';

/**
 * Confirmation shown before a period's data is deleted or reset. It names the EXACT period
 * (a day, or a week from-to) so a person can never delete the wrong one by accident.
 *
 * `period` is { periodType, periodStart, periodEnd } (the confirmation from requestPeriodReset, or
 * the form's pendingReset), or null/undefined when no reset is pending. Nothing happens until
 * `onConfirm`; Escape, the backdrop, the close button and "cancel" all call `onCancel`.
 */
export function ResetPeriodDialog({ period, onConfirm, onCancel }) {
  return (
    <Modal
      open={Boolean(period)}
      onClose={onCancel}
      title={ar.calculator.reset.title}
      description={period ? ar.calculator.reset.description({ period: describePeriod(period) }) : undefined}
      footer={
        <>
          <Button variant="danger" onClick={onConfirm}>
            {ar.calculator.reset.confirm}
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            {ar.calculator.reset.cancel}
          </Button>
        </>
      }
    />
  );
}
