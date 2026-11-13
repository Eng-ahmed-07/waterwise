import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button } from './Button';
import { Card } from './Card';
import { Input } from './Input';
import { Select } from './Select';
import { Skeleton } from './Skeleton';

describe('Button', () => {
  it('defaults to type="button" so it never submits a form by accident', () => {
    expect(renderToStaticMarkup(<Button>حفظ</Button>)).toContain('type="button"');
  });

  it('allows an explicit submit type', () => {
    expect(renderToStaticMarkup(<Button type="submit">حفظ</Button>)).toContain('type="submit"');
  });

  it('is disabled and busy while loading', () => {
    const html = renderToStaticMarkup(<Button loading>حفظ</Button>);
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-busy="true"');
  });

  it('renders other elements through `as`, using aria-disabled instead of disabled', () => {
    const html = renderToStaticMarkup(
      <Button as="a" href="/x" disabled>
        رابط
      </Button>,
    );
    expect(html.startsWith('<a')).toBe(true);
    expect(html).toContain('aria-disabled="true"');
    expect(html).not.toContain('type="button"');
  });

  it('applies the primary variant (white on primary-600 passes AA)', () => {
    const html = renderToStaticMarkup(<Button>x</Button>);
    expect(html).toContain('bg-primary-600');
    expect(html).toContain('text-white');
  });
});

describe('Input', () => {
  it('binds the label to the control', () => {
    const html = renderToStaticMarkup(<Input label="اسم المنزل" />);
    const labelFor = html.match(/<label for="([^"]+)"/)[1];
    expect(html).toContain(`id="${labelFor}"`);
    expect(html).toContain('اسم المنزل');
  });

  it('links hint and error text with aria-describedby and flags the control invalid', () => {
    const html = renderToStaticMarkup(<Input label="كلمة المرور" hint="8 أحرف" error="قصيرة جدًا" />);
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('8 أحرف');
    expect(html).toContain('قصيرة جدًا');
    const describedBy = html.match(/aria-describedby="([^"]+)"/)[1];
    const ids = describedBy.split(' ');
    expect(ids).toHaveLength(2);
    for (const id of ids) expect(html).toContain(`id="${id}"`);
  });

  it('is not marked invalid without an error', () => {
    expect(renderToStaticMarkup(<Input label="x" />)).not.toContain('aria-invalid');
  });

  it('forces LTR for email, password, url and tel so punctuation is not reordered in RTL', () => {
    for (const type of ['email', 'password', 'url', 'tel']) {
      expect(renderToStaticMarkup(<Input label="x" type={type} />)).toContain('dir="ltr"');
    }
    expect(renderToStaticMarkup(<Input label="x" type="text" />)).not.toContain('dir="ltr"');
  });

  it('shows a decorative required marker and sets required on the control', () => {
    const html = renderToStaticMarkup(<Input label="x" required />);
    expect(html).toContain('required=""');
    expect(html).toContain('aria-hidden="true"');
  });

  it('passes Formik-style props through', () => {
    const html = renderToStaticMarkup(<Input label="x" name="size" defaultValue="4" inputMode="decimal" />);
    expect(html).toContain('name="size"');
    expect(html).toContain('inputMode="decimal"');
  });
});

describe('Select', () => {
  it('renders a labelled native select with options and a disabled placeholder', () => {
    const html = renderToStaticMarkup(
      <Select label="المحافظة" placeholder="اختر" defaultValue="" options={[{ value: 'cairo', label: 'القاهرة' }]} />,
    );
    expect(html).toContain('<select');
    expect(html).toContain('اختر');
    expect(html).toContain('value="cairo"');
    expect(html).toContain('القاهرة');
    const labelFor = html.match(/<label for="([^"]+)"/)[1];
    expect(html).toContain(`id="${labelFor}"`);
  });

  it('flags errors accessibly', () => {
    const html = renderToStaticMarkup(<Select label="x" error="مطلوب" options={[]} />);
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('مطلوب');
  });

  it('places the chevron on the inline-end so it mirrors in RTL', () => {
    expect(renderToStaticMarkup(<Select label="x" options={[]} />)).toContain('end-3');
  });
});

describe('Card and Skeleton', () => {
  it('renders an h2 title by default and supports titleAs', () => {
    expect(renderToStaticMarkup(<Card title="العنوان">x</Card>)).toContain('<h2');
    expect(renderToStaticMarkup(<Card title="العنوان" titleAs="h3">x</Card>)).toContain('<h3');
  });

  it('renders no header when no title, description or action is given', () => {
    expect(renderToStaticMarkup(<Card>x</Card>)).not.toContain('<header');
  });

  it('renders the action slot', () => {
    expect(renderToStaticMarkup(<Card title="t" action={<button>act</button>}>x</Card>)).toContain('act');
  });

  it('hides the skeleton from assistive technology', () => {
    expect(renderToStaticMarkup(<Skeleton className="h-4 w-8" />)).toContain('aria-hidden="true"');
  });
});
