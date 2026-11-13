import { Link } from 'react-router-dom';
import { BasisBadge, Button, Card } from '@/components/ui';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { ar } from '@/locales/ar';

/** /about-estimates: the methodology page that builds trust. All copy is in ar.about. */
export default function AboutEstimatesPage() {
  const t = ar.about;
  const s = t.sections;
  const basisKeys = ['estimated', 'projected'];

  return (
    <PageContainer className="py-8">
      <PageHeader title={t.title} description={t.intro} />
      <div className="grid max-w-3xl gap-6">
        <Card title={s.bases.title}>
          <ul className="grid gap-4">
            {s.bases.items.map((item, index) => (
              <li key={item.label} className="flex flex-wrap items-start gap-3">
                <BasisBadge basis={basisKeys[index]} />
                <p className="min-w-0 flex-1 text-ink-muted">{item.body}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm font-medium text-ink">{s.bases.footer}</p>
        </Card>

        <Card title={s.formulas.title}>
          <div className="grid gap-3 text-ink-muted">
            <p>{s.formulas.flow}</p>
            <p>{s.formulas.appliance}</p>
            <p>{s.formulas.weekly}</p>
          </div>
        </Card>

        <Card title={s.assumptions.title}>
          <p className="text-ink-muted">{s.assumptions.body}</p>
        </Card>

        <Card title={s.completeness.title}>
          <p className="text-ink-muted">{s.completeness.body}</p>
        </Card>

        <Card title={s.projection.title}>
          <div className="grid gap-3 text-ink-muted">
            <p>{s.projection.body}</p>
            <p>{s.projection.week}</p>
          </div>
        </Card>

        <div>
          <Button as={Link} to="/calculator">
            {t.cta}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
