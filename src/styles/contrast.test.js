import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Reads the real tokens.css, so the accessibility claims in the design system cannot drift
// from the actual colours. WCAG 2.x: 4.5:1 for normal text, 3:1 for UI component boundaries.

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');

const colors = {};
for (const [, name, hex] of css.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
  colors[name] = hex.toLowerCase();
}

function channel(value) {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

function contrast(fgName, bgName) {
  const [hi, lo] = [luminance(colors[fgName]), luminance(colors[bgName])].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

describe('design tokens', () => {
  it('parses the palette from tokens.css', () => {
    expect(Object.keys(colors).length).toBeGreaterThanOrEqual(35);
  });

  it('keeps the approved brief colours exactly', () => {
    expect(colors['primary-600']).toBe('#087eab');
    expect(colors['secondary-500']).toBe('#16b8a6');
    expect(colors.canvas).toBe('#eaf7fc');
    expect(colors.surface).toBe('#ffffff');
    expect(colors.ink).toBe('#0b2a3c');
  });

  it('removes the default Tailwind palette so only tokens can be used', () => {
    expect(css).toContain('--color-*: initial;');
  });
});

// [foreground, background, minimum ratio, where it is used]
const REQUIRED_PAIRS = [
  ['white', 'primary-600', 4.5, 'primary button'],
  ['white', 'primary-700', 4.5, 'primary button hover'],
  ['white', 'danger-600', 4.5, 'danger button'],
  ['ink', 'canvas', 4.5, 'body text on page'],
  ['ink', 'surface', 4.5, 'body text on cards'],
  ['ink', 'secondary-500', 4.5, 'text on secondary fills'],
  ['ink-muted', 'surface', 4.5, 'secondary text on cards'],
  ['ink-muted', 'canvas', 4.5, 'secondary text on page'],
  ['primary-700', 'canvas', 4.5, 'links and text on page'],
  ['primary-700', 'surface', 4.5, 'links and ghost button on cards'],
  ['primary-700', 'primary-100', 4.5, 'ghost button hover'],
  ['primary-800', 'primary-50', 4.5, 'estimated badge'],
  ['primary-900', 'primary-50', 4.5, 'info toast'],
  ['secondary-700', 'surface', 4.5, 'teal text on cards'],
  ['secondary-700', 'canvas', 4.5, 'teal text on page'],
  ['secondary-800', 'surface', 4.5, 'projected badge'],
  ['secondary-900', 'secondary-50', 4.5, 'success toast'],
  ['danger-700', 'surface', 4.5, 'error text'],
  ['danger-700', 'danger-50', 4.5, 'error toast'],
  ['amber-800', 'amber-100', 4.5, 'high-usage highlight'],
  // Non-text UI boundaries (WCAG 1.4.11)
  ['line-strong', 'surface', 3, 'input border on cards'],
  ['line-strong', 'canvas', 3, 'input border on page'],
];

describe('WCAG contrast of token pairs', () => {
  for (const [fg, bg, min, use] of REQUIRED_PAIRS) {
    it(`${fg} on ${bg} is at least ${min}:1 (${use})`, () => {
      expect(contrast(fg, bg)).toBeGreaterThanOrEqual(min);
    });
  }

  // Documents the traps in the brief's colours, so nobody "fixes" them by accident.
  it('white text on secondary-500 FAILS AA: secondary fills take ink text, never white', () => {
    expect(contrast('white', 'secondary-500') < 4.5).toBe(true);
  });

  it('primary-600 as text on the canvas FAILS AA: text and links use primary-700', () => {
    expect(contrast('primary-600', 'canvas') < 4.5).toBe(true);
  });
});
