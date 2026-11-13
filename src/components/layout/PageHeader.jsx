import { cn } from '@/lib/cn';

/** Page title block: h1, optional description and an actions slot aligned to the inline-end. */
export function PageHeader({ title, description, actions, className }) {
  return (
    <div className={cn('mb-6 flex flex-wrap items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <h1 className="text-3xl font-bold text-ink">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
