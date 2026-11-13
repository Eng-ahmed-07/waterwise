import { Link } from 'react-router-dom';
import { DropIcon } from '../ui/Icons';
import { ar } from '@/locales/ar';

/** `compactOnMobile` shows only the mark below the sm breakpoint (the name stays available to screen readers). */
export function Logo({ to = '/', compactOnMobile = false }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2 rounded-lg font-bold text-ink">
      <span className="inline-flex size-9 items-center justify-center rounded-control bg-primary-600 text-white">
        <DropIcon className="size-5" />
      </span>
      <span className={compactOnMobile ? 'sr-only text-lg sm:not-sr-only' : 'text-lg'}>{ar.app.name}</span>
    </Link>
  );
}
