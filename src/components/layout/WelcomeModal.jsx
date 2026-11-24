import { useEffect, useRef, useState } from 'react';
import { ar } from '@/locales/ar';
import { Button, DropIcon, Modal } from '@/components/ui';

const SESSION_KEY = 'waterwise-welcome-seen';
const EXIT_DURATION = 200;

export function shouldShowWelcome(storage) {
  return storage.getItem(SESSION_KEY) !== 'true';
}

export function WelcomeModal() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const closeTimeout = useRef(null);

  useEffect(() => {
    const storage = window.sessionStorage;
    if (shouldShowWelcome(storage)) {
      storage.setItem(SESSION_KEY, 'true');
      setVisible(true);
    }

    return () => {
      if (closeTimeout.current !== null) window.clearTimeout(closeTimeout.current);
    };
  }, []);

  function dismiss() {
    if (closing) return;
    setClosing(true);
    closeTimeout.current = window.setTimeout(() => setVisible(false), EXIT_DURATION);
  }

  if (!visible) return null;

  return (
    <Modal
      open={visible}
      onClose={dismiss}
      title={ar.welcome.title}
      description={ar.welcome.message}
      closeLabel={ar.welcome.close}
      className={`welcome-dialog${closing ? ' welcome-dialog--closing' : ''}`}
      footer={
        <>
          <Button onClick={dismiss}>{ar.welcome.start}</Button>
          <Button variant="secondary" onClick={dismiss}>
            {ar.welcome.close}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3" dir="rtl">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700">
          <DropIcon className="size-5" />
        </span>
        <p className="text-sm text-ink-muted">{ar.welcome.continuation}</p>
      </div>
    </Modal>
  );
}
