import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ar } from '../locales/ar';

// Catches typos in string paths (e.g. ar.calculator.activity vs ar.calculatorPage.activity) at test time,
// instead of as a blank screen at run time. Every `ar.some.path` written in application code must exist.
// Dynamic lookups such as ar.layout.nav[labelKey] are checked up to the part that is written out.

const SRC = fileURLToPath(new URL('../', import.meta.url));
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
const files = walk(SRC).filter((f) => /\.jsx?$/.test(f) && !/\.test\.[jt]sx?$/.test(f) && !f.endsWith(`locales${sep}ar.js`));

function resolve(path) {
  let node = ar;
  for (const key of path.split('.')) {
    if (typeof node === 'function' || node === null || typeof node !== 'object' || !(key in node)) {
      return typeof node === 'function' ? 'function' : false; // a function (called with arguments) ends the path
    }
    node = node[key];
  }
  return true;
}

describe('locale keys used in code', () => {
  it('scans a meaningful number of files', () => {
    expect(files.length).toBeGreaterThanOrEqual(40);
  });

  it('every ar.* path referenced in code exists in locales/ar.js', () => {
    const missing = [];
    for (const file of files) {
      // Comment lines only describe code (they mention things like locales/ar.js): skip them.
      const text = readFileSync(file, 'utf8')
        .split('\n')
        .filter((line) => !/^\s*(\/\/|\/\*|\*)/.test(line))
        .join('\n');
      for (const [, path] of text.matchAll(/\bar\.([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)/g)) {
        if (resolve(path) === false) missing.push(`${relative(SRC, file).split(sep).join('/')}: ar.${path}`);
      }
    }
    expect([...new Set(missing)]).toEqual([]);
  });

  it('the checker itself detects a wrong path', () => {
    expect(resolve('calculatorPage.activity.unanswered')).toBe(true);
    expect(resolve('calculator.activity.unanswered')).toBe(false);
    expect(resolve('calculatorPage.period.weekEnds')).toBe(true);
  });
});
