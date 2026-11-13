import { Link } from 'react-router-dom';
import { Button, Card } from '@/components/ui';
import { PageContainer } from '@/components/layout/PageContainer';
import { ar } from '@/locales/ar';

// Rendered inside a layout that already provides <main>.
export default function NotFoundPage() {
  return (
    <PageContainer className="py-16">
      <Card title={ar.notFound.title} className="mx-auto max-w-md">
        <p className="text-ink-muted">{ar.notFound.body}</p>
        <Button as={Link} to="/" className="mt-6">
          {ar.common.backHome}
        </Button>
      </Card>
    </PageContainer>
  );
}
