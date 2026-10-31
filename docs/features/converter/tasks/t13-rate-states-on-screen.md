---
id: T13
title: "Show the rate, rate date, dash and unavailable message on the screen"
layer: "ui"
deps: ["T4", "T11", "T12"]
blocks: ["T14"]
acs: ["AC-05", "AC-06", "AC-09", "AC-12", "AC-13", "AC-13b"]
files_hint: ["src/ui/converter.tsx", "src/ui/converter.test.tsx"]
owner: "Vlad"
estimate: "M"
context_budget: "M"
status: "done"
step: "COMMIT"
---

# T13 — Show the rate, rate date, dash and unavailable message on the screen

## Place in the sequence

- **Blocked by:** T4 — Format the result, rate and rate date as displayed · T11 — Hold the rate state tied to the selected pair · T12 — Build the converter form with its fields, swap control and Ukrainian text
- **Blocks:** T14 — Derive and show the reference result, the label and the amount message
- **Wave:** 4 — it joins the form from T12 to the hook from T11 and the formats from T4.
- **Lane:** shares `src/ui/converter.test.tsx` with T12; shares `src/ui/converter.test.tsx` with T14 — serialized.

## Why (user story)

> **As an** owner
> **I want** to see the daily reference rate, the rate date and a reference-value label beside the result
> **So that** I know what the number is based on and what it does not promise
>
> — `spec.md §4, US-02, verbatim` · full text: [spec.md](../spec.md)

> **As an** owner
> **I want** to choose currencies from the supported list and swap them
> **So that** I reach the direction I need quickly
>
> — `spec.md §4, US-03, verbatim` · full text: [spec.md](../spec.md)

> **As an** owner
> **I want** a result to appear only when it belongs to the selected currencies
> **So that** I can trust every number on screen
>
> — `spec.md §4, US-05, verbatim` · full text: [spec.md](../spec.md)

This task delivers the rate column of the screen states, so the owner always sees what a future result rests on.

## Inlined context

> Page-->>Owner: Removes the old result, rate and rate date at once and shows a dash
>
> — `sad.md §6, flow 2, verbatim` · full text: [sad.md](../sad.md)

> Page-->>Owner: Shows the unavailable message, and the amount and currencies stay
>
> — `sad.md §6, flow 2, verbatim` · full text: [sad.md](../sad.md)

> UI-->>U: Shows 1 USD = 45,436 UAH and 29.10.2026, never today's date
>
> — `sad.md §6, flow 5, verbatim` · full text: [sad.md](../sad.md)

> A malformed or unexpected answer from the rate source: treated as no usable rate, so no result appears and no technical text reaches the screen (AC-12).
>
> — `spec.md §6.1, Abuse cases, verbatim` · full text: [spec.md](../spec.md)

> **Tests:** a test sits next to its source as `*.test.ts(x)`, using Testing Library and jsdom for components. Tests never call the real API: fake the rate source with `server.use(...)` from `test/msw-server.ts`. Unhandled requests fail the test.
>
> — `CLAUDE.md §Conventions, Tests, verbatim` · full text: [CLAUDE.md](../../../../CLAUDE.md)

**UI reuse:** `src/ui/` is empty and `docs/design-system.md` does not exist, so there is no component to reuse and no `screens.md` manifest; the AC-13c table is the state contract. Build with native elements and Tailwind utilities in `converter.tsx`, and add no shared primitive (`docs/architecture-map.md` §Frontend: add one when a second use appears). Visual polish is roadmap step 4.

**Fallback:** insufficient or contradicted by the code → read the named file in full ([spec.md](../spec.md) · [sad.md](../sad.md) · [data-model.md](../data-model.md) · [openapi.yaml](../contracts/openapi.yaml) · [adr/](../adr/)) and follow it. Do not guess.

## Data delta

No DB changes. The feature has no datastore; this task works with the shape below, where "Column" means a field.

| Column | Type | Constraints | Change |
|---|---|---|---|
| `rate` | `string` | Plain positive decimal, no exponent form | read-only |
| `date` | `string` | Real calendar date as `YYYY-MM-DD`; its age never makes it invalid | read-only |

— `data-model.md §Entities, rate, abridged` · full text: [data-model.md](../data-model.md)

## API contract

Calls `GET /api/rates` through `useRate`. Tests fake it with `server.use(...)`.

- `GET /api/rates?base=<SupportedCurrency>&quote=<SupportedCurrency>` → `200` `DailyReferenceRate` `{ base, quote, rate, date }`, `rate` a string matching `^(?:[1-9][0-9]*(?:\.[0-9]+)?|0\.[0-9]*[1-9][0-9]*)$`, no other properties · errors: `400 invalid_pair`, `502 rate_unavailable`.

— `contracts/openapi.yaml, operationId getRate, abridged` · full text: [openapi.yaml](../contracts/openapi.yaml)

## Acceptance criteria

### AC-05 — happy path

> **Given** a reference result is on screen
> **When** the owner reads it
> **Then** the daily reference rate in the form `1 USD = 45,436 UAH`, with every digit as published, a decimal comma, no thousands grouping and no rounding, the rate date in the form 31.10.2026, and a label in Ukrainian saying this is a reference value all appear beside it (the rate and date also appear without a result, per AC-13c)
>
> — `spec.md §5, AC-05, verbatim` · full text: [spec.md](../spec.md)

### AC-06 — cross-context

> **Given** the rate source's latest rate for the selected pair is dated 29 October 2026
> **When** the owner sees the result on a later day
> **Then** the screen shows 29.10.2026 as the rate date, never today's date
>
> — `spec.md §5, AC-06, verbatim` · full text: [spec.md](../spec.md)

### AC-09 — happy path

> **Given** an amount and a currency pair are on screen
> **When** the owner uses the swap control
> **Then** the amount stays, the pair reverses, and the result uses the rate published for the new direction, never an inverted copy of the old rate
>
> — `spec.md §5, AC-09, verbatim` · full text: [spec.md](../spec.md)

### AC-12 — cross-context

> **Given** the rate source cannot provide a usable rate for the selected pair and the app's server side holds no stored rate for it (a stored rate counts as usable, even past the refresh interval in §6)
> **When** the rate request fails, gets no answer within a time limit chosen in design, or its answer cannot be trusted. An answer cannot be trusted when it has an unexpected form, its rate is missing, zero or negative, it belongs to another pair, or its rate date is missing or invalid. The age of the rate date alone never makes a rate unusable, because the date is always shown (AC-06)
> **Then** no result appears, the screen says in plain Ukrainian that the rate is unavailable and shows no technical text from the rate source, and the amount and currencies stay as they were. A new attempt happens only when the owner changes the pair, including changing a field and changing it back, or uses the swap control; typing an amount does not retry. Reloading the page starts over as in AC-07 and requests the rate for USD to UAH. Retry controls and automatic retries stay in roadmap step 3
>
> — `spec.md §5, AC-12, verbatim` · full text: [spec.md](../spec.md)

### AC-13 — domain invariant

> **Given** a currency pair is selected, with or without a reference result on screen
> **When** the owner changes the pair and the new rate has not arrived yet
> **Then** any old result, rate and date disappear at once and a neutral dash appears, never the unavailable message
>
> — `spec.md §5, AC-13, verbatim` · full text: [spec.md](../spec.md)

### AC-13b — domain invariant

> **Given** the owner changed the pair more than once in quick succession
> **When** a rate or a failure for an earlier selection arrives after a later selection was made
> **Then** that rate or failure is ignored, and the screen only ever shows the rate and date of the pair currently selected
>
> — `spec.md §5, AC-13b, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] `src/ui/converter.tsx`: call `useRate(pair)` and show a dash when pending, `formatRate` and `formatRateDate` when ready, and the unavailable message otherwise
- [ ] `src/ui/converter.test.tsx`: register a default `/api/rates` handler, because the T12 tests now make a request and unhandled requests fail
- [ ] `src/ui/converter.test.tsx`: one test per acceptance criterion below, with literal expected strings

## Edge cases

| Case | Behaviour |
|---|---|
| Opening the app | A dash, then USD to UAH's rate and date |
| 502, or an unexpected reply | The unavailable message, with no text from the reply |
| Unavailable, then typing an amount | No new request (AC-12) |
| Unavailable, then a change of pair | The dash replaces the message, and a new request follows |
| Swap control | The new direction's rate from a new request, never `1 / old rate` (AC-09) |
| Reply date `2026-10-29` | `29.10.2026`, whatever today is (AC-06) |
| Reloading the page | Starts over as USD to UAH with an empty amount |

## Definition of Done

- [ ] `src/ui/converter.test.tsx` passes for the dash, ready and unavailable states with literal strings
- [ ] A test shows a new request for the new direction on swap (AC-09)
- [ ] A test shows out-of-order replies leaving the screen on the selected pair (AC-13b)
- [ ] every Hard Rule inlined above still holds
- [ ] `npm run lint` and `npm run typecheck` clean
