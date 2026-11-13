import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { ar } from '@/locales/ar';

/** Horizontal list of navigation links with an active state (aria-current is set by NavLink). */
export function NavLinkList({ items, className }) {
  return (
    <ul className={cn('flex items-center gap-1', className)}>
      {items.map(({ to, labelKey, end }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'inline-flex h-10 items-center rounded-control px-3.5 text-sm font-semibold whitespace-nowrap transition-colors',
                isActive ? 'bg-primary-100 text-primary-800' : 'text-ink-muted hover:bg-primary-50 hover:text-ink',
              )
            }
          >
            {ar.layout.nav[labelKey]}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}
