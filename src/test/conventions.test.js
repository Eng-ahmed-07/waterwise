import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

// Enforces approved Phase 0 conventions across the whole codebase so they cannot regress silently:
//  1. RTL: logical Tailwind utilities (ms-*, pe-*, start-*, text-start ...), never physical ones.
//  2. Strings: no Arabic in components. Arabic text lives in src/locales (and the dev-only showcase).
//  3. The word for "actual" (فعلي) exists only in the locale dictionary, never in UI code.
// A class or CSS line can opt out with the marker `rtl-ok` on the same line (use sparingly, explain why).

const SRC = fileURLToPath(new URL('../', import.meta.url));

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

const rel = (file) => relative(SRC, file).split(sep).join('/');
const isTest = (file) => /\.test\.[jt]sx?$/.test(file);
const files = walk(SRC);
const sourceFiles = files.filter((f) => /\.(jsx?|css)$/.test(f) && !isTest(f));
const codeFiles = sourceFiles.filter((f) => /\.jsx?$/.test(f));
const cssFiles = sourceFiles.filter((f) => f.endsWith('.css'));

const BOUNDARY = '(?:^|[\\s"\'`:])';
const PHYSICAL_TAILWIND = [
  [new RegExp(`${BOUNDARY}-?(?:ml|mr|pl|pr)-(?:\\d|\\[|px|auto)`), 'ml-/mr-/pl-/pr-: use ms-/me-/ps-/pe-'],
  [new RegExp(`${BOUNDARY}-?(?:left|right)-(?:\\d|\\[|px|full|auto)`), 'left-/right-: use start-/end-'],
  [new RegExp(`${BOUNDARY}text-(?:left|right)(?![\\w-])`), 'text-left/right: use text-start/text-end'],
  [new RegExp(`${BOUNDARY}(?:rounded|border)-(?:l|r|tl|tr|bl|br)(?![A-Za-z0-9])`), 'rounded-l/r, border-l/r: use rounded-s/e, border-s/e'],
  [new RegExp(`${BOUNDARY}(?:float|clear)-(?:left|right)`), 'float/clear-left/right: use float-start/end'],
  [new RegExp(`${BOUNDARY}(?:space-x|divide-x)-`), 'space-x/divide-x use physical sides: use gap-*'],
  [new RegExp(`${BOUNDARY}-?translate-x-`), 'translate-x is physical: avoid, or add rtl: variant'],
];

const PHYSICAL_CSS =
  /\b(?:margin|padding)-(?:left|right)\b|\bborder-(?:left|right)\b|(?:^|[\s;{])(?:left|right)\s*:|text-align\s*:\s*(?:left|right)|float\s*:\s*(?:left|right)/;

const ARABIC = /[\u0600-\u06FF]/;

// Comment-only lines document intent (e.g. show an Arabic label as an example) and never reach users.
const isCommentLine = (line) => /^\s*(\/\/|\/\*|\*)/.test(line);

function scan(fileList, check, { skipComments = false } = {}) {
  const violations = [];
  for (const file of fileList) {
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, index) => {
        if (line.includes('rtl-ok')) return;
        if (skipComments && isCommentLine(line)) return;
        const problem = check(line);
        if (problem) violations.push(`${rel(file)}:${index + 1}  ${problem}  ->  ${line.trim()}`);
      });
  }
  return violations;
}

describe('codebase conventions', () => {
  it('finds the source files it is meant to scan', () => {
    expect(codeFiles.length).toBeGreaterThanOrEqual(20);
    expect(cssFiles.length).toBeGreaterThanOrEqual(2);
  });

  it('RTL: uses logical Tailwind utilities, never physical left/right ones', () => {
    const violations = scan(codeFiles, (line) => PHYSICAL_TAILWIND.find(([re]) => re.test(line))?.[1]);
    expect(violations).toEqual([]);
  });

  it('RTL: CSS files use logical properties', () => {
    const violations = scan(cssFiles, (line) => (PHYSICAL_CSS.test(line) ? 'physical CSS property' : null));
    expect(violations).toEqual([]);
  });

  it('strings: no Arabic text in code outside src/locales and the dev-only showcase', () => {
    const allowed = (file) => rel(file).startsWith('locales/') || rel(file).startsWith('features/dev-ui/');
    const violations = scan(
      codeFiles.filter((f) => !allowed(f)),
      (line) => (ARABIC.test(line) ? 'Arabic text: move it to locales/ar.js' : null),
      { skipComments: true },
    );
    expect(violations).toEqual([]);
  });

  it('labelling: the word for "actual" (فعلي) appears only in the locale dictionary', () => {
    const violations = scan(
      sourceFiles.filter((f) => rel(f) !== 'locales/ar.js'),
      (line) => (line.includes('فعلي') ? 'the "actual" label is reserved (Phase 0 rule 1)' : null),
      { skipComments: true },
    );
    expect(violations).toEqual([]);
  });

  it('the scanner itself detects violations (self-check)', () => {
    expect(PHYSICAL_TAILWIND.some(([re]) => re.test('class="ml-4 text-left"'))).toBe(true);
    expect(PHYSICAL_TAILWIND.some(([re]) => re.test('class="rounded-l-lg"'))).toBe(true);
    expect(PHYSICAL_TAILWIND.some(([re]) => re.test('class="ms-4 text-start rounded-s-lg border-line rounded-lg"'))).toBe(false);
    expect(PHYSICAL_CSS.test('margin-left: 4px;')).toBe(true);
    expect(PHYSICAL_CSS.test('margin-inline-start: 4px;')).toBe(false);
  });
});
