# WaterWise (Phases 1-3: foundation, calculator domain, static UI on mock data)

Arabic-first (RTL) household water estimation platform for Egypt.
Stack: React 19 + Vite, JavaScript, Tailwind CSS v4, React Router, TanStack Query.
Supabase, Formik/Yup and Recharts are added in the phases that need them (see the roadmap).

## Run locally

Requires Node 20.19+ (or 22.12+).

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit + render + convention tests
npm run build      # production build (also proves the Tailwind/Vite setup)
npm run preview    # serve the production build
```

Open `http://localhost:5173/dev/ui` for the dev-only component showcase (not included in production builds).

## What is here

```
src/
  app/            App, providers (QueryClient, Toast), router, 404 page; guards/ is reserved for Phase 5
  components/ui/  BasisBadge, MetricValue, CoverageNote, Button, Card, Input, Select, FormField,
                  Modal, Toast(+Provider), Skeleton, Icons   -> import from '@/components/ui'
  components/layout/PageContainer
  features/       home (placeholder), dev-ui (showcase); other feature folders are empty placeholders
  lib/            basis (labelling contract), format (numerals, units), units, constants, cn, env, queryClient
  locales/ar.js   ALL user-facing Arabic strings
  styles/         tokens.css (design tokens, @theme), index.css (base styles)
```

## Conventions (enforced by `npm test`)

1. **RTL:** `<html lang="ar" dir="rtl">`. Use logical utilities: `ms-* me-* ps-* pe-* start-* end-* text-start border-s rounded-s gap-*`.
   Never `ml/mr/pl/pr/left/right/text-left/space-x`. A line can opt out with a `rtl-ok` comment.
2. **Strings:** no Arabic in components. Put text in `src/locales/ar.js`.
3. **Labelling contract:** every computed number is shown through `<MetricValue basis="estimated|projected" />`.
   `basis` is required. Dev: missing/invalid basis throws. Production: the number is hidden (fails closed).
   `actual` (فعلي) is reserved for future meter readings and blocked by `FEATURES.actualBasis = false`.
4. **Colour rules** (checked against `tokens.css`): white text only on primary-600+ / danger-600+; never white on secondary
   (use ink); use `primary-700` (not 600) for text and links on the canvas.
5. **Tokens:** the default Tailwind palette is removed, so only token colours work. Change tokens in `src/styles/tokens.css`.

## Decisions made in Phase 1

- Tailwind **v4** with `@tailwindcss/vite` (no `tailwind.config.js`/PostCSS): current major, CSS-first tokens.
- Numerals default to **Arabic-Indic** (١٢٣). Switch with `NUMERAL_SYSTEM` in `src/lib/constants.js`.
- Liters display as whole numbers, cubic meters with 2 decimals (estimates should not look falsely precise).
- Modal uses the native `<dialog>` (focus trap, Escape, focus restore from the browser).
- `Button` defaults to `type="button"`; pass `type="submit"` explicitly in forms.
- Font is self-hosted via `@fontsource/ibm-plex-sans-arabic` (no Google Fonts request).
- `MIN_COMPLETE_DAYS_FOR_PROJECTION = 7` is defined (Revision 3) but unused until Phase 2.

## Phase 2: calculator domain (`src/features/calculator`)

Pure JavaScript, no React or Supabase, so Phase 4 can add persistence without touching the rules.

```
domain/   dates, activityDefinitions, calculations, periodValidation, logCompleteness, logValidation,
          logBuilder, dateAllocation, monthlyProjection, periodReset, messages, errorCodes, numberInput
hooks/    calculatorReducer (pure form state), useCalculator (React binding)
components/ResetPeriodDialog   confirmation that names the exact day or week
```

Rules in one place:

- **One formula.** `flow: lpm x minutes x occurrences`, `appliance: liters_per_cycle x occurrences`. `occurrences` is always the period TOTAL; a weekly total is never multiplied by 7. `weekly total / 7` is used only to spread a week over its dates.
- **Complete means all six answered.** Zero is an answer; blank is not. Unanswered activities never become 0. Drafts (including a draft with all six answered) never enter any metric.
- **Periods.** A day is one date; a week is 7 consecutive dates (any weekday). A period must have ended (`end <= today`). Dates can belong to one log only (drafts included).
- **Projection** needs `MIN_COMPLETE_DAYS_FOR_PROJECTION` (7) complete covered days, otherwise no projection is returned. Fully covered month: plain estimated sum, not a projection.
- **Labelling.** Results carry their basis (`monthlyTotalBasis`: `projected`, `estimated` or `null`). Show every number through `<MetricValue basis=... />`. `actual` stays blocked.
- **Placeholder rates** (8/6/6/10 L/min, 50 L/cycle, 20 L/session) are the illustrative numbers from the plan, flagged `isPlaceholder`. They are NOT official Egyptian benchmarks.
- **Typo guards** (`VALIDATION_LIMITS` in `lib/constants.js`) are input sanity limits, not consumption benchmarks.

## Phase 3: static UI on mock data

Run `npm run dev`, then try:

| Route | What you get |
|---|---|
| `/` | Home: value proposition, how it works, the estimated-vs-projected labelling shown on sample figures |
| `/calculator` | Guest or signed-in calculator: period first, six activity cards, assumptions panel, live results |
| `/about-estimates` | Methodology: bases, formulas, placeholders, the 7-complete-day rule |
| `/login` | **Any credentials work** (mock): loads a demo account with 11 logs (9 complete, 2 drafts) |
| `/register` | Creates a mock account with no household, then onboarding |
| `/dashboard`, `/history` | Real figures computed by the domain engine from the mock logs |
| `/recommendations`, `/reports`, `/profile`, `/settings` | Honest "under construction" placeholders |

What is mock: `src/features/mock/` (session, household, logs, saving in memory + sessionStorage). Nothing talks to a
server. Phase 5 replaces `MockAppProvider` with Supabase Auth and TanStack Query hooks; pages keep the same shape.

Guards (`src/app/guards`): signed-out -> `/login?returnTo=...` (only same-site paths are honoured), signed in without a
household -> `/onboarding`, signed in on `/login` -> `/dashboard`. The rules are pure functions in `accessRules.js`.

Layout: public navbar + footer for visitors; app shell with a top bar (desktop) and a 5-tab bottom bar (mobile).
`/calculator` and `/about-estimates` pick the layout from the visitor's state.

Dashboard windows (display choices, not benchmarks): "last 7 days" for the week figure and "last 30 days" for the
average, per-member figure and activity breakdown; the monthly outlook uses the current month.

