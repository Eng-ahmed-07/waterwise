import { Link } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button, Card, CoverageNote, MetricValue } from '@/components/ui';
import { formatNumber } from '@/lib/format';
import { ar } from '@/locales/ar';

// Decorative water lines under the hero. Purely visual (aria-hidden), drawn with design-token colours.
function Waves() {
  return (
    <svg aria-hidden="true" viewBox="0 0 1440 120" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-16 w-full text-primary-100 sm:h-24">
      <path fill="currentColor" fillOpacity="0.55" d="M0 64c120 28 240 28 360 0s240-28 360 0 240 28 360 0 240-28 360 0v56H0Z" />
      <path fill="currentColor" d="M0 88c120 20 240 20 360 0s240-20 360 0 240 20 360 0 240-20 360 0v32H0Z" />
    </svg>
  );
}

export default function HomePage() {
  const t = ar.home;
  return (
    <>
      <section className="relative overflow-hidden pb-24 pt-12 sm:pb-32 sm:pt-20">
        <PageContainer className="relative grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <h1 className="text-4xl font-bold text-ink sm:text-5xl">{t.hero.title}</h1>
            <p className="mt-5 max-w-xl text-lg text-ink-muted">{t.hero.body}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button as={Link} to="/calculator" size="lg">
                {t.hero.primary}
              </Button>
              <Button as={Link} to="/register" variant="secondary" size="lg">
                {t.hero.secondary}
              </Button>
            </div>
          </div>

          {/* The labelling contract, shown instead of a stock photo: estimated is solid, projected is dashed. */}
          <Card title={t.hero.sampleTitle} description={t.hero.sampleNote}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <MetricValue label={t.hero.sampleEstimateLabel} value={517.75} unit="literPerDay" basis="estimated" />
              <MetricValue label={t.hero.sampleProjectionLabel} value={15.5325} unit="cubicMeter" basis="projected" formula={ar.calculator.projection.formulaWholeMonth}>
                <CoverageNote covered={8} total={30} />
              </MetricValue>
            </div>
          </Card>
        </PageContainer>
        <Waves />
      </section>

      <section className="bg-surface py-14">
        <PageContainer>
          <h2 className="text-2xl font-bold text-ink">{t.benefits.title}</h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {t.benefits.items.map((item) => (
              <li key={item.title} className="rounded-card border border-line bg-canvas p-5">
                <h3 className="text-lg font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-ink-muted">{item.body}</p>
              </li>
            ))}
          </ul>
        </PageContainer>
      </section>

      <section className="py-14">
        <PageContainer>
          <h2 className="text-2xl font-bold text-ink">{t.how.title}</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {t.how.steps.map((step, index) => (
              <li key={step.title} className="flex gap-4 rounded-card border border-line bg-surface p-5 shadow-card">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary-500 text-lg font-bold text-ink">{formatNumber(index + 1)}</span>
                <div>
                  <h3 className="font-semibold text-ink">{step.title}</h3>
                  <p className="mt-1 text-sm text-ink-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </PageContainer>
      </section>

      <section className="bg-ink py-14 text-white">
        <PageContainer className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold">{t.honesty.title}</h2>
            <p className="mt-3 text-primary-100">{t.honesty.body}</p>
          </div>
          <Link to="/about-estimates" className="rounded-control border border-primary-200 px-5 py-3 font-semibold text-white hover:bg-white/10">
            {t.honesty.link}
          </Link>
        </PageContainer>
      </section>

      {import.meta.env.DEV && (
        <PageContainer className="py-4">
          <Link to="/dev/ui" className="text-xs font-semibold text-primary-700 underline underline-offset-4">
            {t.devLink}
          </Link>
        </PageContainer>
      )}
    </>
  );
}
