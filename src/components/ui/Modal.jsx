import { useEffect, useId, useRef } from 'react';
import { cn } from '@/lib/cn';
import { ar } from '@/locales/ar';
import { CloseIcon } from './Icons';

/**
 * Accessible modal built on the native <dialog> element. The browser provides the focus trap,
 * Escape handling, inert background and focus restoration, so there is no custom focus code to maintain.
 *
 * Controlled: the parent owns `open` and must set it to false in `onClose`.
 * onClose fires on Escape, backdrop click and the close button.
 *
 * `footer`: put the primary action FIRST in the DOM. Footer actions align to the inline-start,
 * which is the right-hand side in RTL where primary actions are expected.
 *
 * Do not put display utilities (flex, grid) on the <dialog> itself: they override its
 * closed state. Layout lives on the inner div.
 */
export function Modal({ open, onClose, title, description, children, footer, closeLabel = ar.common.close, className }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  // Sync the controlled `open` prop with the native dialog.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);

  // Lock page scroll while open.
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      // Escape: keep React state as the source of truth instead of letting the browser close it.
      onCancel={(event) => {
        event.preventDefault();
        onClose?.();
      }}
      // A click directly on the <dialog> element (not its content) is a backdrop click.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
      className={cn(
        'm-auto w-[calc(100%-2rem)] max-w-lg overflow-visible rounded-card bg-transparent p-0 text-ink shadow-pop backdrop:bg-ink/50',
        className,
      )}
    >
      {open && (
        <div className="rounded-card bg-surface p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id={titleId} className="text-xl font-semibold text-ink">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="-m-2 inline-flex size-10 shrink-0 items-center justify-center rounded-control text-ink-muted transition-colors hover:bg-primary-50 hover:text-ink"
            >
              <CloseIcon className="size-5" />
            </button>
          </div>
          {description && (
            <p id={descriptionId} className="mt-2 text-sm text-ink-muted">
              {description}
            </p>
          )}
          {children && <div className="mt-4">{children}</div>}
          {footer && <div className="mt-6 flex flex-wrap items-center justify-start gap-3">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}
