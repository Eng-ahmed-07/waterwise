import { Card } from '@/components/ui';
import { PageContainer } from '@/components/layout/PageContainer';
import { ar } from '@/locales/ar';

/** Centred card used by every auth page, with the honest "demo" notice (no server exists yet). */
export function AuthCard({ title, subtitle, children }) {
  return (
    <PageContainer className="py-12">
      <Card as="section" className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-ink-muted">{subtitle}</p>}
        <p className="mt-4 rounded-control bg-amber-100 px-3 py-2 text-xs font-medium text-amber-800">{ar.auth.demoNotice}</p>
        <div className="mt-5">{children}</div>
      </Card>
    </PageContainer>
  );
}
