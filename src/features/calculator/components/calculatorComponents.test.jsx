import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { ar } from '../../../locales/ar';
import { countMetrics } from '../../../test/renderWithApp';
import { ACTIVITY_DEFINITIONS, createDefaultAssumptions } from '../domain/activityDefinitions';
import { calculateActivityBreakdown } from '../domain/activityBreakdown';
import { calculateMonthlyProjection } from '../domain/monthlyProjection';
import { answerActions, litersLog, REV3_DAY_ANSWERS, REV3_WEEK_ANSWERS, TODAY, ZERO_ANSWERS } from '../domain/testHelpers';
import { calculatorReducer, createInitialState, evaluateForm } from '../hooks/calculatorReducer';
import { ActivityBreakdownList } from './ActivityBreakdownList';
import { ActivityCard } from './ActivityCard';
import { AssumptionsPanel } from './AssumptionsPanel';
import { LiveTotalBar } from './LiveTotalBar';
import { OutlookTile } from './OutlookTile';
import { PeriodPicker } from './PeriodPicker';
import { ResultsPanel } from './ResultsPanel';

const noop = () => {};
const run = (actions, state = createInitialState()) => actions.reduce(calculatorReducer, state);
const start = (date) => ({ type: 'SET_PERIOD_START', periodStart: date });
const evaluate = (state, options) => evaluateForm(state, { today: TODAY, ...options });
const inRouter = (element) => renderToStaticMarkup(<MemoryRouter>{element}</MemoryRouter>);
const def = (id) => ACTIVITY_DEFINITIONS.find((d) => d.id === id);
const assumption = { rate: 8, isPlaceholder: true };

const card = (id, { answer, state, periodType = 'day', disabled = false } = {}) =>
  renderToStaticMarkup(
    <ActivityCard
      definition={def(id)}
      periodType={periodType}
      answer={answer}
      state={state ?? { status: 'unanswered', errors: [] }}
      assumption={assumption}
      disabled={disabled}
      onChange={noop}
      onNone={noop}
      onClear={noop}
    />,
  );

describe('ActivityCard', () => {
  it('shows a flow activity with occurrences, duration, a "no usage" button and the rate assumption', () => {
    const html = card('shower');
    expect(html).toContain(ar.calculator.activities.shower.name);
    expect(html).toContain(ar.calculator.activities.shower.occurrencesDay);
    expect(html).toContain(ar.calculator.durationLabel);
    expect(html).toContain(ar.calculator.noUsage);
    expect(html).toContain(ar.calculatorPage.activity.unanswered);
    expect(html).toContain('٨ لتر/دقيقة');
  });

  it('asks an appliance activity for cycles only, with no duration', () => {
    const html = card('washing_machine');
    expect(html).toContain(ar.calculator.activities.washing_machine.occurrencesDay);
    expect(html).not.toContain(ar.calculator.durationLabel);
  });

  it('uses the WEEK wording (total for the whole week) in a weekly log', () => {
    const html = card('shower', { periodType: 'week' });
    expect(html).toContain(ar.calculator.activities.shower.occurrencesWeek);
    expect(html).not.toContain(ar.calculator.activities.shower.occurrencesDay);
  });

  it('after "no usage" shows an answered card with no inputs and an edit button (zero is an answer)', () => {
    const state = run([start('2026-11-03'), { type: 'MARK_NONE', activityId: 'shower' }]);
    const evaluation = evaluate(state);
    const html = card('shower', { answer: state.answers.shower, state: evaluation.build.perActivity.shower });
    expect(html).toContain(ar.calculatorPage.activity.answered);
    expect(html).toContain(ar.calculatorPage.activity.noUsageBody);
    expect(html).toContain(ar.calculatorPage.activity.edit);
    expect(html).not.toContain('<input');
  });

  it('shows validation errors on the right field and marks it invalid', () => {
    const state = run([start('2026-11-03'), ...answerActions({ shower: { occurrences: 'abc' } })]);
    const html = card('shower', { answer: state.answers.shower, state: evaluate(state).build.perActivity.shower });
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain(ar.calculator.errors.OCCURRENCES_INVALID);
  });

  it('locks its fields until a period is chosen', () => {
    const html = card('shower', { disabled: true });
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-disabled="true"');
  });

  it('never shows a computed liters figure itself (results go through MetricValue only)', () => {
    const state = run([start('2026-11-03'), ...answerActions({ shower: { occurrences: 4, durationMinutes: 6 } })]);
    const html = card('shower', { answer: state.answers.shower, state: evaluate(state).build.perActivity.shower });
    expect(countMetrics(html).numbers).toBe(0);
    expect(html).not.toContain('١٩٢');
  });
});

describe('PeriodPicker', () => {
  const render = (props) => renderToStaticMarkup(<PeriodPicker periodType="day" periodStart={null} today={TODAY} onTypeChange={noop} onStartChange={noop} {...props} />);

  it('asks to choose the period first when none is chosen', () => {
    expect(render()).toContain(ar.calculatorPage.period.chooseFirst);
  });

  it('a day may be today at the latest', () => {
    const html = render({ periodStart: '2026-11-03' });
    expect(html).toContain(`max="${TODAY}"`);
    expect(html).toContain(ar.calculatorPage.period.dayHint);
    expect(html).toContain(ar.calculatorPage.period.useToday);
    expect(html).not.toContain(ar.calculatorPage.period.chooseFirst);
  });

  it('a week starts at today - 6 at the latest (the week must have ended) and says where it ends', () => {
    const html = render({ periodType: 'week', periodStart: '2026-11-05' });
    expect(html).toContain('max="2026-11-24"'); // TODAY (2026-11-30) - 6
    expect(html).toContain(ar.calculatorPage.period.weekHint);
    expect(html).toContain(ar.calculatorPage.period.useLast7);
    expect(html).toContain('ينتهي الأسبوع في ١١ نوفمبر ٢٠٢٦');
  });

  it('shows a period error on the date field', () => {
    const html = render({ periodStart: '2026-11-03', errors: [ar.calculator.errors.LOG_OVERLAP] });
    expect(html).toContain(ar.calculator.errors.LOG_OVERLAP);
    expect(html).toContain('aria-invalid="true"');
  });
});

describe('AssumptionsPanel', () => {
  const render = (assumptions, mode = 'guest') => renderToStaticMarkup(<AssumptionsPanel assumptions={assumptions} mode={mode} onSet={noop} onReset={noop} onResetAll={noop} />);

  it('lists all six activities as placeholders and says they are not official', () => {
    const html = render(createDefaultAssumptions());
    for (const { id } of ACTIVITY_DEFINITIONS) expect(html).toContain(ar.calculator.activities[id].name);
    expect(html.split(`>${ar.calculatorPage.assumptions.placeholder}<`).length - 1).toBe(6);
    expect(html).toContain('وليست معايير رسمية');
    expect(html).not.toContain(ar.basis.actual.label);
  });

  it('marks an edited assumption as edited', () => {
    const edited = { ...createDefaultAssumptions(), shower: { rate: 5, isPlaceholder: false } };
    const html = render(edited);
    expect(html.split(`>${ar.calculatorPage.assumptions.edited}<`).length - 1).toBe(1);
    expect(html.split(`>${ar.calculatorPage.assumptions.placeholder}<`).length - 1).toBe(5);
  });

  it('explains that guest edits last only for the session, and registered edits never change saved logs', () => {
    expect(render(createDefaultAssumptions(), 'guest')).toContain(ar.calculatorPage.assumptions.guestNote);
    expect(render(createDefaultAssumptions(), 'registered')).toContain(ar.calculatorPage.assumptions.registeredNote);
  });
});

describe('OutlookTile: the three honest states', () => {
  it('partial coverage: a PROJECTED figure in m3 with the visible formula and the days it uses', () => {
    const outlook = calculateMonthlyProjection({ logs: [litersLog('w', 'week', '2026-11-05', 14)], month: '2026-11', today: TODAY });
    const html = inRouter(<OutlookTile outlook={outlook} />);
    expect(html).toContain('data-basis="projected"');
    expect(html).toContain('border-dashed');
    expect(html).toContain('٣'); // 3,000 L = 3 m3
    expect(html).toContain('م³');
    expect(html).toContain(ar.calculator.projection.formulaWholeMonth);
    expect(html).toContain(ar.coverage.completeDays('٧', '٣٠'));
  });

  it('fully covered: an ESTIMATED total, not a projection', () => {
    const weeks = ['2026-02-01', '2026-02-08', '2026-02-15', '2026-02-22'].map((d, i) => litersLog(`w${i}`, 'week', d, 14));
    const outlook = calculateMonthlyProjection({ logs: weeks, month: '2026-02', today: TODAY });
    const html = inRouter(<OutlookTile outlook={outlook} />);
    expect(html).toContain('data-basis="estimated"');
    expect(html).not.toContain('data-basis="projected"');
    expect(html).toContain(ar.calculator.projection.labels.monthlyEstimatedTotal);
    expect(html).toContain(ar.calculator.projection.fullyCovered);
  });

  it('insufficient data: NO number, an explanation, a progress bar and a call to action', () => {
    const outlook = calculateMonthlyProjection({ logs: [litersLog('a', 'day', '2026-11-01', 1), litersLog('b', 'day', '2026-11-02', 1)], month: '2026-11', today: TODAY });
    const html = inRouter(<OutlookTile outlook={outlook} />);
    expect(countMetrics(html).numbers).toBe(0);
    expect(html).not.toContain('data-basis');
    expect(html).toContain(ar.calculator.projection.insufficient({ covered: '٢', min: '٧' }));
    expect(html).toContain(ar.calculator.projection.remaining({ remaining: '٥' }));
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="2"');
    expect(html).toContain(ar.calculatorPage.results.addDay);
  });

  it('a guest who entered one day is told to enter a whole week', () => {
    const outlook = calculateMonthlyProjection({ logs: [litersLog('a', 'day', '2026-11-01', 1)], month: '2026-11', today: TODAY, mode: 'guest' });
    const html = inRouter(<OutlookTile outlook={outlook} guestDay />);
    expect(html).toContain(ar.calculatorPage.results.guestDayHint);
    expect(html).not.toContain('role="progressbar"');
  });
});

describe('ResultsPanel', () => {
  const render = (state, props = {}) =>
    inRouter(<ResultsPanel evaluation={evaluate(state)} today={TODAY} periodType={state.periodType} mode="guest" householdSize={state.householdSize} {...props} />);

  const dayState = run([start('2026-11-03'), ...answerActions(REV3_DAY_ANSWERS)]);
  const weekState = run([{ type: 'SET_PERIOD_TYPE', periodType: 'week' }, start('2026-11-05'), ...answerActions(REV3_WEEK_ANSWERS)]);

  it('before completion shows a prompt, and a partial subtotal labelled as NOT included', () => {
    const state = run([start('2026-11-03'), ...answerActions({ shower: { occurrences: 4, durationMinutes: 6 } })]);
    const html = render(state);
    expect(html).toContain(ar.calculatorPage.results.pending);
    expect(html).toContain(ar.calculatorPage.results.partialSubtotal);
    expect(html).toContain('١٩٢');
    expect(html).not.toContain('data-basis="projected"');
  });

  it('shows nothing numeric when nothing is answered', () => {
    const html = render(run([start('2026-11-03')]));
    expect(countMetrics(html).numbers).toBe(0);
  });

  it('a complete DAY: daily estimate (494), no period total, the breakdown and the guest hint (no projection)', () => {
    const html = render(dayState);
    expect(html).toContain(ar.calculatorPage.results.dailyEstimate);
    expect(html).toContain('٤٩٤');
    expect(html).not.toContain(ar.calculatorPage.results.periodTotal);
    expect(html).toContain(ar.calculatorPage.results.breakdown);
    expect(html).not.toContain('data-basis="projected"');
  });

  it('a guest day gets the "enter a week" hint only for a guest', () => {
    expect(render(dayState, { mode: 'guest' })).toContain(ar.calculatorPage.results.guestDayHint);
    expect(render(dayState, { mode: 'registered' })).not.toContain(ar.calculatorPage.results.guestDayHint);
  });

  it('a complete WEEK: period total, a weekly-average note and a projected monthly figure', () => {
    const html = render(weekState);
    expect(html).toContain(ar.calculatorPage.results.periodTotal);
    expect(html).toContain('٣٬٦٤٨');
    expect(html).toContain(ar.calculatorPage.results.weekNote);
    expect(html).toContain('data-basis="projected"');
  });

  it('per-member figure needs a household size, and the field is offered to guests', () => {
    expect(render(weekState)).toContain(ar.calculatorPage.results.needHouseholdSize);
    const withSize = run([{ type: 'SET_HOUSEHOLD_SIZE', householdSize: 4 }], weekState);
    const html = render(withSize, { householdSize: 4, sizeField: { raw: '4', onChange: noop } });
    expect(html).toContain(ar.calculatorPage.results.perMember);
    expect(html).toContain('١٣٠'); // 3648 / 7 / 4 = 130.3
    expect(html).toContain(ar.calculatorPage.results.householdSize);
  });

  it('names the top activity and states the estimate notice', () => {
    const html = render(dayState);
    expect(html).toContain(ar.calculatorPage.results.topActivity({ name: ar.calculator.activities.shower.name }));
    expect(html).toContain(ar.notices.estimateNotMeasurement);
  });

  it('every number shown is a labelled MetricValue (estimated or projected)', () => {
    for (const state of [dayState, weekState, run([start('2026-11-03'), ...answerActions({ shower: { occurrences: 4, durationMinutes: 6 } })])]) {
      const { numbers, labelled } = countMetrics(render(state));
      expect(numbers).toBeGreaterThanOrEqual(1);
      expect(numbers).toBe(labelled);
    }
  });
});

describe('LiveTotalBar', () => {
  const render = (state, props) => renderToStaticMarkup(<LiveTotalBar evaluation={evaluate(state)} {...props} />);

  it('shows progress in Arabic numerals and a partial subtotal labelled as not included', () => {
    const state = run([start('2026-11-03'), ...answerActions({ shower: { occurrences: 4, durationMinutes: 6 } })]);
    const html = render(state);
    expect(html).toContain(ar.calculator.progress('١', '٦'));
    expect(html).toContain('aria-valuenow="1"');
    expect(html).toContain(ar.calculatorPage.live.partial);
    expect(html).toContain('aria-live="polite"');
  });

  it('shows the complete total once all six are answered', () => {
    const html = render(run([start('2026-11-03'), ...answerActions(REV3_DAY_ANSWERS)]));
    expect(html).toContain(ar.calculatorPage.live.complete);
    expect(html).toContain('٤٩٤');
    expect(html).toContain(ar.calculator.progress('٦', '٦'));
  });

  it('shows a dash, not zero, when nothing is answered', () => {
    const html = render(run([start('2026-11-03')]));
    expect(html).toContain('—');
    expect(countMetrics(html).numbers).toBe(0);
  });

  it('is lifted above the mobile tab bar only when asked, and hidden from lg up', () => {
    const state = run([start('2026-11-03')]);
    expect(render(state, { aboveBottomNav: true })).toContain('bottom-[calc(3.5rem');
    expect(render(state)).not.toContain('bottom-[calc(3.5rem');
    expect(render(state)).toContain('lg:hidden');
  });
});

describe('ActivityBreakdownList', () => {
  it('highlights ONLY the top activity, and names it in text', () => {
    const day = litersLog('d', 'day', '2026-11-03', 3);
    const breakdown = calculateActivityBreakdown([day], { today: TODAY });
    const html = renderToStaticMarkup(<ActivityBreakdownList breakdown={breakdown} />);
    expect(html.split('bg-amber-500').length - 1).toBe(1);
    expect(html).toContain(ar.calculatorPage.results.topActivity({ name: ar.calculator.activities.washing_machine.name }));
    expect(html).toContain('(١٠٠٪)');
  });

  it('highlights nothing when everything is zero', () => {
    const zero = litersLog('z', 'day', '2026-11-03', 0);
    const html = renderToStaticMarkup(<ActivityBreakdownList breakdown={calculateActivityBreakdown([zero], { today: TODAY })} />);
    expect(html).not.toContain('bg-amber-500');
    expect(html).not.toContain(ar.calculatorPage.results.topActivity({ name: '' }).slice(0, 10));
    expect(ZERO_ANSWERS.shower.occurrences).toBe(0);
  });
});
