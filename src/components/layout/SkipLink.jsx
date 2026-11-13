import { ar } from '@/locales/ar';

// First focusable element on every page: lets keyboard and screen-reader users jump past the navigation.
export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-surface focus:px-4 focus:py-2 focus:font-semibold focus:text-primary-700 focus:shadow-pop"
    >
      {ar.layout.skipToContent}
    </a>
  );
}
