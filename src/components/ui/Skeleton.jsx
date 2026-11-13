import { cn } from '@/lib/cn';

/**
 * Loading placeholder block. Size it with className (e.g. "h-10 w-32").
 * It is aria-hidden: wrap the loading region in aria-busy="true" and include an sr-only
 * loading message so screen-reader users are informed. The pulse is disabled for reduced motion.
 */
export function Skeleton({ className, ...rest }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-lg bg-primary-100 motion-reduce:animate-none', className)}
      {...rest}
    />
  );
}
