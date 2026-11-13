import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ar } from '../../locales/ar';
import { MetricValue } from './MetricValue';
import { NumberField, stepValue } from './NumberField';
import { SegmentedControl } from './SegmentedControl';

const noop = () => {};

describe('stepValue (stepper arithmetic)', () => {
  it('"+" on a blank field starts at the step', () => {
    expect(stepValue('', 1)).toBe('1');
    expect(stepValue('', 1, { step: 5 })).toBe('5');
  });

  it('"-" on a blank field does nothing: it must not invent an answer of zero', () => {
    expect(stepValue('', -1)).toBeNull();
    expect(stepValue('   ', -1)).toBeNull();
    expect(stepValue('abc', -1)).toBeNull();
  });

  it('steps up and down from a value', () => {
    expect(stepValue('3', 1)).toBe('4');
    expect(stepValue('3', -1)).toBe('2');
    expect(stepValue('2.5', 1)).toBe('3.5');
  });

  it('never goes below the minimum', () => {
    expect(stepValue('0', -1)).toBe('0');
    expect(stepValue('1', -5)).toBe('0');
    expect(stepValue('2', -1, { min: 2 })).toBe('2');
  });

  it('understands Arabic-Indic digits and treats unparseable text as blank for "+"', () => {
    expect(stepValue('\u0663', 1)).toBe('4');
    expect(stepValue('abc', 1)).toBe('1');
  });

  it('avoids floating-point noise', () => {
    expect(stepValue('0.1', 1, { step: 0.2 })).toBe('0.3');
  });
});

describe('NumberField', () => {
  const render = (props) => renderToStaticMarkup(<NumberField label="عدد المرات" onChange={noop} incrementLabel="زيادة" decrementLabel="إنقاص" {...props} />);

  it('is labelled, shows the raw value, and has accessible step buttons', () => {
    const html = render({ value: '4' });
    expect(html).toContain('عدد المرات');
    expect(html).toContain('value="4"');
    expect(html).toContain('aria-label="زيادة"');
    expect(html).toContain('aria-label="إنقاص"');
    expect(html).toContain('inputMode="decimal"');
  });

  it('disables "-" for a blank or minimum value, but not "+"', () => {
    const blank = render({ value: '' });
    expect(blank.match(/aria-label="إنقاص"[^>]*disabled=""|disabled=""[^>]*aria-label="إنقاص"/)).not.toBeNull();
    expect(blank.match(/aria-label="زيادة"[^>]*disabled=""|disabled=""[^>]*aria-label="زيادة"/)).toBeNull();
    const zero = render({ value: '0' });
    expect(zero.match(/aria-label="إنقاص"[^>]*disabled=""|disabled=""[^>]*aria-label="إنقاص"/)).not.toBeNull();
  });

  it('shows a blank for null/undefined (never "0" or "null")', () => {
    for (const value of [null, undefined]) expect(render({ value })).toContain('value=""');
  });

  it('links errors with aria-describedby and flags the input invalid', () => {
    const html = render({ value: 'x', error: 'قيمة غير صالحة' });
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('قيمة غير صالحة');
    expect(html).toContain('aria-describedby=');
  });

  it('disables everything when disabled', () => {
    expect(render({ value: '3', disabled: true }).split('disabled=""').length - 1).toBe(3);
  });
});

describe('SegmentedControl', () => {
  const options = [
    { value: 'day', label: 'يوم' },
    { value: 'week', label: 'أسبوع' },
  ];

  it('is a native radio group with a legend and the selected option checked', () => {
    const html = renderToStaticMarkup(<SegmentedControl legend="نوع الفترة" options={options} value="week" onChange={noop} />);
    expect(html).toContain('<fieldset');
    expect(html).toContain('<legend');
    expect(html).toContain('نوع الفترة');
    expect(html.split('type="radio"').length - 1).toBe(2);
    expect(html.match(/value="week"[^>]*checked=""|checked=""[^>]*value="week"/)).not.toBeNull();
    expect(html.match(/value="day"[^>]*checked=""|checked=""[^>]*value="day"/)).toBeNull();
  });

  it('keeps the radios visually hidden but focusable (sr-only + visible focus styling)', () => {
    const html = renderToStaticMarkup(<SegmentedControl legend="x" options={options} value="day" onChange={noop} />);
    expect(html).toContain('sr-only');
    expect(html).toContain('peer-focus-visible');
  });
});

describe('MetricValue row variant', () => {
  it('shows label, number, unit and basis badge in one line', () => {
    const html = renderToStaticMarkup(<MetricValue variant="row" label="الاستحمام" value={1344} unit="liter" basis="estimated" />);
    expect(html).toContain('role="group"');
    expect(html).toContain('data-basis="estimated"');
    expect(html).toContain('١٬٣٤٤');
    expect(html).toContain(ar.units.liter);
    expect(html).toContain(ar.basis.estimated.label);
    expect(html).not.toContain('shadow-card'); // not a tile
  });

  it('keeps the labelling contract: a projected row has the projected badge', () => {
    const html = renderToStaticMarkup(<MetricValue variant="row" label="x" value={3} unit="cubicMeter" basis="projected" />);
    expect(html).toContain(ar.basis.projected.label);
  });

  it('shows a dash and an accessible message for no value, and a skeleton while loading', () => {
    const none = renderToStaticMarkup(<MetricValue variant="row" label="x" value={null} unit="liter" basis="estimated" />);
    expect(none).toContain('—');
    expect(none).toContain(ar.metric.noValue);
    expect(none).not.toContain('<bdi');
    const loading = renderToStaticMarkup(<MetricValue variant="row" label="x" value={5} unit="liter" basis="estimated" isLoading />);
    expect(loading).toContain(ar.common.loading);
    expect(loading).not.toContain('<bdi');
  });

  it('fails closed: no valid basis, no number', () => {
    let html = null;
    try {
      html = renderToStaticMarkup(<MetricValue variant="row" label="x" value={517.75} unit="liter" />);
    } catch {
      /* development: throws */
    }
    if (html !== null) {
      expect(html).not.toContain('٥١٨');
      expect(html).toContain('—');
    }
  });
});
