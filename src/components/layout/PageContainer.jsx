import { cn } from '@/lib/cn';

/** Centred page width with responsive inline padding. Used by every page (Phase 3 adds AppShell around it). */
export function PageContainer({ as: Component = 'div', className, children, ...rest }) {
  return (
    <Component className={cn('mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8', className)} {...rest}>
      {children}
    </Component>
  );
}
