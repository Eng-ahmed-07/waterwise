// Turns raw form input into a number WITHOUT confusing "not answered" with zero.
//   ''  /  null  /  undefined  ->  EMPTY    (unanswered)
//   '0' /  0                   ->  VALID, value 0   (an explicit answer)
//   'abc' / NaN / '1,5'        ->  INVALID
// Arabic-Indic and Persian digits and the Arabic decimal separator are accepted, because Arabic
// keyboards produce them. Written with escapes so this file contains no Arabic characters.

export const INPUT_STATUS = Object.freeze({ EMPTY: 'empty', VALID: 'valid', INVALID: 'invalid' });

const ARABIC_INDIC_ZERO = 0x0660; // U+0660..U+0669
const PERSIAN_ZERO = 0x06f0; // U+06F0..U+06F9
const ARABIC_DECIMAL_SEPARATOR = '\u066B';

function normalizeDigits(text) {
  return text
    .replace(/[\u0660-\u0669]/g, (ch) => String(ch.charCodeAt(0) - ARABIC_INDIC_ZERO))
    .replace(/[\u06F0-\u06F9]/g, (ch) => String(ch.charCodeAt(0) - PERSIAN_ZERO))
    .replaceAll(ARABIC_DECIMAL_SEPARATOR, '.');
}

const NUMBER_RE = /^-?(\d+(\.\d+)?|\.\d+)$/;

export function parseNumericInput(raw) {
  if (raw === null || raw === undefined) return { status: INPUT_STATUS.EMPTY, value: null };

  if (typeof raw === 'number') {
    return Number.isFinite(raw)
      ? { status: INPUT_STATUS.VALID, value: raw }
      : { status: INPUT_STATUS.INVALID, value: null };
  }
  if (typeof raw !== 'string') return { status: INPUT_STATUS.INVALID, value: null };

  const text = normalizeDigits(raw).trim();
  if (text === '') return { status: INPUT_STATUS.EMPTY, value: null };
  if (!NUMBER_RE.test(text)) return { status: INPUT_STATUS.INVALID, value: null };
  return { status: INPUT_STATUS.VALID, value: Number(text) };
}
