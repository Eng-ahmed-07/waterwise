import { useMockApp } from '@/features/mock/MockAppProvider';
import { AppShell } from './AppShell';
import { PublicLayout } from './PublicLayout';

/** For pages open to everyone (calculator, methodology): the shell matches the visitor's state. */
export function AdaptiveLayout() {
  const { isAuthenticated } = useMockApp();
  return isAuthenticated ? <AppShell /> : <PublicLayout />;
}
