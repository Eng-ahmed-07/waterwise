import { QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui';
import { MockAppProvider } from '@/features/mock/MockAppProvider';
import { queryClient } from '@/lib/queryClient';

// MockAppProvider is the Phase 3 stand-in for auth and data. Phase 5 replaces it with an AuthProvider
// (Supabase Auth) and TanStack Query hooks. Direction (RTL) is fixed on <html dir="rtl">.
export function AppProviders({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <MockAppProvider>
        <ToastProvider>{children}</ToastProvider>
      </MockAppProvider>
    </QueryClientProvider>
  );
}
