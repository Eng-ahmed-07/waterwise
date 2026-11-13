import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ar } from '../../../locales/ar';
import { ResetPeriodDialog } from './ResetPeriodDialog';

const week = { periodType: 'week', periodStart: '2026-11-05', periodEnd: '2026-11-11' };
const day = { periodType: 'day', periodStart: '2026-11-03', periodEnd: '2026-11-03' };
const noop = () => {};

describe('ResetPeriodDialog', () => {
  it('names the exact week being deleted, with both end dates', () => {
    const html = renderToStaticMarkup(<ResetPeriodDialog period={week} onConfirm={noop} onCancel={noop} />);
    expect(html).toContain(ar.calculator.reset.title);
    expect(html).toContain('الأسبوع من ٥ نوفمبر ٢٠٢٦ إلى ١١ نوفمبر ٢٠٢٦');
    expect(html).toContain(ar.calculator.reset.confirm);
    expect(html).toContain(ar.calculator.reset.cancel);
  });

  it('names the exact day being deleted', () => {
    const html = renderToStaticMarkup(<ResetPeriodDialog period={day} onConfirm={noop} onCancel={noop} />);
    expect(html).toContain('يوم ٣ نوفمبر ٢٠٢٦');
  });

  it('shows nothing to confirm when no reset is pending', () => {
    const html = renderToStaticMarkup(<ResetPeriodDialog period={null} onConfirm={noop} onCancel={noop} />);
    expect(html).not.toContain(ar.calculator.reset.confirm);
    expect(html).not.toContain(ar.calculator.reset.title);
  });

  it('puts the destructive action first in the DOM and offers a cancel', () => {
    const html = renderToStaticMarkup(<ResetPeriodDialog period={week} onConfirm={noop} onCancel={noop} />);
    expect(html.indexOf(ar.calculator.reset.confirm)).toBeLessThan(html.indexOf(ar.calculator.reset.cancel));
  });
});
