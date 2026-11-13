import { Link } from 'react-router-dom';
import { Button, Card } from '@/components/ui';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { ar } from '@/locales/ar';

/** Honest placeholder for sitemap pages that arrive in a later phase. `labelKey` is an ar.layout.nav key. */
export default function PlannedPage({ labelKey }) {
  return (
    <PageContainer className="py-8">
      <PageHeader title={ar.layout.nav[labelKey]} />
      <Card title={ar.layout.plannedTitle} className="max-w-xl">
        <p className="text-ink-muted">{ar.layout.plannedBody}</p>
        <Button as={Link} to="/dashboard" variant="secondary" className="mt-5">
          {ar.layout.nav.dashboard}
        </Button>
      </Card>
    </PageContainer>
  );
}
