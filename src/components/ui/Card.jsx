import { cn } from '@/lib/cn';

/**
 * Surface container. A white card on the canvas gets a hairline border plus a soft navy shadow,
 * so its edge is defined without a heavy outline.
 *
 * Optional header: `title` (rendered as <h2> by default, change with `titleAs`),
 * `description`, and `action` (a node aligned to the inline-end, e.g. a Button).
 */
export function Card({
  as: Component = 'section',
  title,
  titleAs: Title = 'h2',
  description,
  action,
  className,
  children,
  ...rest
}) {
  const hasHeader = title || description || action;

  return (
    <Component className={cn('rounded-card border border-line bg-surface p-5 shadow-card sm:p-6', className)} {...rest}>
      {hasHeader && (
        <header className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {title && <Title className="text-lg font-semibold text-ink">{title}</Title>}
            {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      {children}
    </Component>
  );
}
