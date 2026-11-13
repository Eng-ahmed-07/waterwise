// Test helper: server-renders a page inside the providers it needs (router, mock app, toasts).
// Not imported by application code.
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '@/components/ui';
import { MockAppProvider } from '@/features/mock/MockAppProvider';

export const TEST_TODAY = '2026-11-20';

export function renderPage(element, { authenticated = false, today = TEST_TODAY, path = '/' } = {}) {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <MockAppProvider today={today} authenticated={authenticated} persist={false}>
        <ToastProvider>{element}</ToastProvider>
      </MockAppProvider>
    </MemoryRouter>,
  );
}

/** Counts figures rendered through MetricValue: the numbers (<bdi>) and the labelled groups (data-basis). */
export function countMetrics(html) {
  return {
    numbers: (html.match(/<bdi/g) ?? []).length,
    labelled: (html.match(/<div role="group"[^>]*data-basis="(estimated|projected)"/g) ?? []).length,
  };
}
