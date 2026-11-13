import { Button, Modal } from '@/components/ui';
import { ar } from '@/locales/ar';

/**
 * Confirmation before switching between day and week once values were entered. Values are cleared,
 * never converted: a day's count and a week's total mean different things (Phase 0, Revision 3).
 * `pending` is the period type waiting for confirmation, or null.
 */
export function PeriodChangeDialog({ pending, onConfirm, onCancel }) {
  const t = ar.calculatorPage.changeType;
  return (
    <Modal
      open={Boolean(pending)}
      onClose={onCancel}
      title={t.title}
      description={t.body}
      footer={
        <>
          <Button onClick={onConfirm}>{t.confirm}</Button>
          <Button variant="secondary" onClick={onCancel}>
            {t.cancel}
          </Button>
        </>
      }
    />
  );
}
