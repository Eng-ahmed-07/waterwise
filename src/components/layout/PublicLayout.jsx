import { Link, Outlet } from 'react-router-dom';
import { Button } from '../ui';
import { PageContainer } from './PageContainer';
import { Logo } from './Logo';
import { NavLinkList } from './NavLinkList';
import { SkipLink } from './SkipLink';
import { PUBLIC_NAV } from './navConfig';
import { useMockApp } from '@/features/mock/MockAppProvider';
import { ar } from '@/locales/ar';

/** Navbar + footer for visitors (and the calculator in guest mode). */
export function PublicLayout({ children }) {
  const { isAuthenticated } = useMockApp();

  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
        <PageContainer className="flex h-16 items-center gap-4">
          <Logo compactOnMobile />
          <nav aria-label={ar.layout.mainNav} className="hidden md:block">
            <NavLinkList items={PUBLIC_NAV} />
          </nav>
          <div className="ms-auto flex items-center gap-2">
            {isAuthenticated ? (
              <Button as={Link} to="/dashboard" size="sm">
                {ar.layout.nav.dashboard}
              </Button>
            ) : (
              <>
                <Button as={Link} to="/login" variant="ghost" size="sm">
                  {ar.layout.login}
                </Button>
                <Button as={Link} to="/register" size="sm">
                  {ar.layout.register}
                </Button>
              </>
            )}
          </div>
        </PageContainer>
        {/* Small screens: the links scroll sideways in a second row instead of hiding. */}
        <nav aria-label={ar.layout.mainNav} className="border-t border-line md:hidden">
          <PageContainer className="overflow-x-auto py-1.5">
            <NavLinkList items={PUBLIC_NAV} />
          </PageContainer>
        </nav>
      </header>

      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children ?? <Outlet />}
      </main>

      <footer className="border-t border-line bg-surface">
        <PageContainer className="flex flex-wrap items-center justify-between gap-3 py-6 text-sm text-ink-muted">
          <Logo />
          <p>{ar.layout.footerNote}</p>
          <Link to="/about-estimates" className="font-semibold text-primary-700 underline underline-offset-4">
            {ar.layout.nav.aboutEstimates}
          </Link>
        </PageContainer>
      </footer>
    </div>
  );
}
