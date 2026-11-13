import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Button } from '../ui';
import { PageContainer } from './PageContainer';
import { BottomNav } from './BottomNav';
import { Logo } from './Logo';
import { NavLinkList } from './NavLinkList';
import { SkipLink } from './SkipLink';
import { APP_NAV } from './navConfig';
import { useMockApp } from '@/features/mock/MockAppProvider';
import { ar } from '@/locales/ar';

/** Signed-in layout: top bar on desktop, bottom tab bar on mobile. */
export function AppShell({ children }) {
  const { user, signOut } = useMockApp();
  const navigate = useNavigate();

  const handleSignOut = () => {
    navigate('/');
    signOut();
  };

  return (
    <div className="min-h-dvh">
      <SkipLink />
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
        <PageContainer className="flex h-16 items-center gap-4">
          <Logo to="/dashboard" />
          <nav aria-label={ar.layout.mainNav} className="hidden md:block">
            <NavLinkList items={APP_NAV} />
          </nav>
          <div className="ms-auto flex items-center gap-2">
            <Link to="/profile" className="hidden max-w-40 truncate rounded-lg px-2 py-1 text-sm font-semibold text-ink-muted hover:text-ink sm:inline">
              {user?.name}
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              {ar.layout.logout}
            </Button>
          </div>
        </PageContainer>
      </header>

      <main id="main" tabIndex={-1} className="pb-28 outline-none md:pb-12">
        {children ?? <Outlet />}
      </main>
      <BottomNav />
    </div>
  );
}
