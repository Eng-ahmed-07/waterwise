// Calendar-date helpers. Dates are plain 'YYYY-MM-DD' strings with NO time zone, and months are
// 'YYYY-MM'. All arithmetic is done in UTC so daylight-saving changes (Egypt observes DST) can
// never add or remove a day. ISO strings compare correctly with ordinary < and >.

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_RE = /^(\d{4})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;
const MIN_YEAR = 1900;

const daysInMonthOf = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();
const pad = (n, width) => String(n).padStart(width, '0');

export function isValidISODate(value) {
  if (typeof value !== 'string') return false;
  const match = DATE_RE.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  return year >= MIN_YEAR && month >= 1 && month <= 12 && day >= 1 && day <= daysInMonthOf(year, month);
}

export function isValidMonth(value) {
  if (typeof value !== 'string') return false;
  const match = MONTH_RE.exec(value);
  return Boolean(match) && Number(match[1]) >= MIN_YEAR && Number(match[2]) >= 1 && Number(match[2]) <= 12;
}

function toMs(isoDate) {
  if (!isValidISODate(isoDate)) throw new TypeError(`Invalid ISO date: ${String(isoDate)}`);
  const [, y, m, d] = DATE_RE.exec(isoDate);
  return Date.UTC(Number(y), Number(m) - 1, Number(d));
}

function fromMs(ms) {
  const date = new Date(ms);
  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1, 2)}-${pad(date.getUTCDate(), 2)}`;
}

export function addDays(isoDate, days) {
  return fromMs(toMs(isoDate) + days * MS_PER_DAY);
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function diffDays(from, to) {
  return Math.round((toMs(to) - toMs(from)) / MS_PER_DAY);
}

/** Every date from `start` to `end`, inclusive. Empty if end is before start. */
export function eachDate(start, end) {
  const count = diffDays(start, end) + 1;
  return count > 0 ? Array.from({ length: count }, (_, i) => addDays(start, i)) : [];
}

export const monthOf = (isoDate) => {
  toMs(isoDate);
  return isoDate.slice(0, 7);
};

export function daysInMonth(month) {
  if (!isValidMonth(month)) throw new TypeError(`Invalid month: ${String(month)}`);
  const [, y, m] = MONTH_RE.exec(month);
  return daysInMonthOf(Number(y), Number(m));
}

/** Every date of a month, in order. */
export function monthDates(month) {
  return Array.from({ length: daysInMonth(month) }, (_, i) => `${month}-${pad(i + 1, 2)}`);
}

/** Today's calendar date in the user's own time zone. `now` is injectable for tests. */
export function todayISO(now = new Date()) {
  return `${pad(now.getFullYear(), 4)}-${pad(now.getMonth() + 1, 2)}-${pad(now.getDate(), 2)}`;
}

/** Start date of "the last n days" ending today (the Phase 0 "آخر ٧ أيام" shortcut uses n = 7). */
export const lastNDaysStart = (today, n) => addDays(today, -(n - 1));
