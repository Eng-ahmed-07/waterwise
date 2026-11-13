import { describe, expect, it } from 'vitest';
import { INPUT_STATUS, parseNumericInput } from './numberInput';

describe('parseNumericInput: unanswered vs zero', () => {
  it('treats blank input as EMPTY (unanswered), never as zero', () => {
    for (const blank of ['', '   ', null, undefined]) {
      expect(parseNumericInput(blank)).toEqual({ status: INPUT_STATUS.EMPTY, value: null });
    }
  });

  it('treats an explicit zero as a VALID answer', () => {
    expect(parseNumericInput('0')).toEqual({ status: INPUT_STATUS.VALID, value: 0 });
    expect(parseNumericInput(0)).toEqual({ status: INPUT_STATUS.VALID, value: 0 });
    expect(parseNumericInput('0.0')).toEqual({ status: INPUT_STATUS.VALID, value: 0 });
  });
});

describe('parseNumericInput: numbers', () => {
  it('parses plain and decimal numbers and trims spaces', () => {
    expect(parseNumericInput('4').value).toBe(4);
    expect(parseNumericInput(' 7.5 ').value).toBe(7.5);
    expect(parseNumericInput('.5').value).toBe(0.5);
    expect(parseNumericInput(12).value).toBe(12);
  });

  it('accepts Arabic-Indic digits, Persian digits and the Arabic decimal separator', () => {
    expect(parseNumericInput('\u0663').value).toBe(3);
    expect(parseNumericInput('\u0661\u0662').value).toBe(12);
    expect(parseNumericInput('\u0662\u066B\u0665').value).toBe(2.5);
    expect(parseNumericInput('\u06F4\u06F5').value).toBe(45);
  });

  it('keeps negative numbers parseable so validation can report them precisely', () => {
    expect(parseNumericInput('-3')).toEqual({ status: INPUT_STATUS.VALID, value: -3 });
  });

  it('rejects text, mixed text, thousands separators and non-finite numbers', () => {
    for (const bad of ['abc', '12abc', '1,5', '1 000', '--1', '1.2.3', NaN, Infinity, -Infinity, {}, [], true]) {
      expect(parseNumericInput(bad).status).toBe(INPUT_STATUS.INVALID);
    }
  });
});
