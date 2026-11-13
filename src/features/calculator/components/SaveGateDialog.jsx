import { Link } from 'react-router-dom';
import { Button, Modal } from '@/components/ui';
import { ar } from '@/locales/ar';

/**
 * Shown when a GUEST tries to save. Saving needs an account; the calculator stays exactly as it was
 * underneath (nothing is cleared), so closing this dialog loses no input.
 */
export function SaveGateDialog({ open, onClose }) {
  const t = ar.calculatorPage.gate;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t.title}
      description={t.body}
      footer={
        <>
          <Button as={Link} to="/register">
            {t.register}
          </Button>
          <Button as={Link} to="/login" variant="secondary">
            {t.login}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            {t.later}
          </Button>
        </>
      }
    />
  );
}
