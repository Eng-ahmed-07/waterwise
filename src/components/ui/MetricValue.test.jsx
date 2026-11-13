import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MetricValue } from './MetricValue';
import { CoverageNote } from './CoverageNote';
import { ar } from '../../locales/ar';

function renderOrNull(element) {
  try {
    return renderToStaticMarkup(element);
  } catch {
    return null; // development: throws on invalid input
  }
}

describe('MetricValue: valid figures', () => {
  it('shows an estimated figure with its label, number, unit and estimated badge', () => {
    const html = renderToStaticMarkup(
      <MetricValue label="متوسط يومي تقديري" value={517.75} unit="literPerDay" basis="estimated" />,
    );
    expect(html).toContain('متوسط يومي تقديري');
    expect(html).toContain('٥١٨'); // 517.75 -> whole liters, Arabic-Indic digits
    expect(html).toContain(ar.units.literPerDay);
    expect(html).toContain(ar.basis.estimated.label);
    expect(html).toContain('data-basis="estimated"');
  });

  it('shows a projected figure in cubic meters with a dashed tile, the projected badge and the visible formula', () => {
    const html = renderToStaticMarkup(
      <MetricValue
        label="توقع شهري"
        value={15.5325}
        unit="cubicMeter"
        basis="projected"
        formula="المتوسط اليومي التقديري × عدد أيام الشهر"
      />,
    );
    expect(html).toContain('١٥٫٥٣');
    expect(html).toContain('م³');
    expect(html).toContain(ar.basis.projected.label);
    expect(html).toContain('data-basis="projected"');
    expect(html).toContain('border-dashed');
    expect(html).toContain('المتوسط اليومي التقديري × عدد أيام الشهر');
  });

  it('shows the coverage caption passed as children', () => {
    const html = renderToStaticMarkup(
      <MetricValue label="x" value={4142} unit="liter" basis="estimated">
        <CoverageNote covered={8} total={30} />
      </MetricValue>,
    );
    expect(html).toContain('٤٬١٤٢');
    expect(html).toContain(ar.coverage.completeDays('٨', '٣٠'));
  });

  it('never uses the word for "actual" on estimated or projected figures', () => {
    const html = renderToStaticMarkup(
      <>
        <MetricValue label="a" value={1} unit="liter" basis="estimated" />
        <MetricValue label="b" value={1} unit="liter" basis="projected" />
      </>,
    );
    expect(html).not.toContain(ar.basis.actual.label);
  });

  it('is grouped and labelled for assistive technology', () => {
    const html = renderToStaticMarkup(<MetricValue label="تقدير للفرد" value={129.44} unit="literPerPersonDay" basis="estimated" />);
    expect(html).toContain('role="group"');
    expect(html).toContain('aria-labelledby=');
  });
});

describe('MetricValue: states without a number', () => {
  it('shows a dash and an accessible message when there is no value', () => {
    const html = renderToStaticMarkup(<MetricValue label="x" value={null} unit="liter" basis="estimated" />);
    expect(html).toContain('—');
    expect(html).toContain(ar.metric.noValue);
  });

  it('shows a loading state and no number while loading', () => {
    const html = renderToStaticMarkup(<MetricValue label="x" value={517.75} unit="liter" basis="estimated" isLoading />);
    expect(html).toContain(ar.common.loading);
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain('٥١٨');
  });
});

describe('MetricValue: the labelling guard (fails closed)', () => {
  it('never shows a number without a valid basis', () => {
    for (const element of [
      <MetricValue label="x" value={517.75} unit="liter" />,
      <MetricValue label="x" value={517.75} unit="liter" basis="monthly" />,
    ]) {
      const html = renderOrNull(element);
      // dev: throws (html === null). prod: renders a dash and no figure.
      if (html !== null) {
        expect(html).not.toContain('٥١٨');
        expect(html).toContain('—');
      }
    }
  });

  it('never shows an "actual" figure while the feature is disabled', () => {
    const html = renderOrNull(<MetricValue label="x" value={517.75} unit="liter" basis="actual" />);
    if (html !== null) {
      expect(html).not.toContain('٥١٨');
      expect(html).not.toContain(ar.basis.actual.label);
    }
  });

  it('never prints a non-numeric value or an unknown unit', () => {
    for (const element of [
      <MetricValue label="x" value={'517'} unit="liter" basis="estimated" />,
      <MetricValue label="x" value={NaN} unit="liter" basis="estimated" />,
      <MetricValue label="x" value={517.75} unit="gallon" basis="estimated" />,
    ]) {
      const html = renderOrNull(element);
      if (html !== null) {
        expect(html).not.toContain('٥١٨');
        expect(html).not.toContain('NaN');
      }
    }
  });
});
