import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { ar } from '@/locales/ar';
import { APP_NAV } from './navConfig';

/** Mobile tab bar (hidden from md up). Respects the iOS home-indicator safe area. */
export function BottomNav() {
  const items = APP_NAV.filter((item) => item.mobile);
  return (
    <nav
      aria-label={ar.layout.quickNav}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid grid-cols-5">
        {items.map(({ to, labelKey, Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-xs font-semibold transition-colors',
                  isActive ? 'text-primary-700' : 'text-ink-muted hover:text-ink',
                )
              }
            >
              <Icon className="size-6" />
              <span>{ar.layout.nav[labelKey]}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
