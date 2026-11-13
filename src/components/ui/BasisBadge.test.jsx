import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { BasisBadge } from './BasisBadge';
import { ar } from '../../locales/ar';

// In development an invalid basis throws; in production the badge renders nothing.
// Either outcome is acceptable here: what must never happen is a badge with a label.
function renderOrNull(element) {
  try {
    return renderToStaticMarkup(element);
  } catch {
    return null;
  }
}

describe('BasisBadge', () => {
  it('renders the estimated label with a solid outline', () => {
    const html = renderToStaticMarkup(<BasisBadge basis="estimated" />);
    expect(html).toContain(ar.basis.estimated.label);
    expect(html).toContain('data-basis="estimated"');
    expect(html).toContain('border-solid');
    expect(html).not.toContain('border-dashed');
  });

  it('renders the projected label with a dashed outline (shape, not colour alone)', () => {
    const html = renderToStaticMarkup(<BasisBadge basis="projected" />);
    expect(html).toContain(ar.basis.projected.label);
    expect(html).toContain('data-basis="projected"');
    expect(html).toContain('border-dashed');
  });

  it('supports the sm size', () => {
    const html = renderToStaticMarkup(<BasisBadge basis="estimated" size="sm" />);
    expect(html).toContain('text-xs');
  });

  it('never renders the reserved "actual" label while the feature is disabled', () => {
    const html = renderOrNull(<BasisBadge basis="actual" />);
    expect(html === null || html === '').toBe(true);
  });

  it('never renders a label for a missing or invalid basis', () => {
    for (const el of [<BasisBadge />, <BasisBadge basis="monthly" />]) {
      const html = renderOrNull(el);
      expect(html === null || html === '').toBe(true);
    }
  });

  it('does not use the word for "actual" on estimated or projected badges', () => {
    const all = renderToStaticMarkup(
      <>
        <BasisBadge basis="estimated" />
        <BasisBadge basis="projected" />
      </>,
    );
    expect(all).not.toContain(ar.basis.actual.label);
  });
});
