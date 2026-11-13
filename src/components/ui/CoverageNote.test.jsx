import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CoverageNote } from './CoverageNote';
import { ar } from '../../locales/ar';

describe('CoverageNote', () => {
  it('states complete days used, with Arabic-Indic numerals', () => {
    const html = renderToStaticMarkup(<CoverageNote covered={8} total={30} />);
    expect(html).toContain(ar.coverage.completeDays('٨', '٣٠'));
    expect(html).not.toContain('progressbar');
  });

  it('can show an accessible progress bar', () => {
    const html = renderToStaticMarkup(<CoverageNote covered={3} total={7} showBar />);
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="3"');
    expect(html).toContain('aria-valuemax="7"');
    expect(html).toContain('width:42.857');
  });

  it('clamps the bar when covered exceeds total', () => {
    const html = renderToStaticMarkup(<CoverageNote covered={9} total={7} showBar />);
    expect(html).toContain('aria-valuenow="7"');
    expect(html).toContain('width:100%');
  });
});
