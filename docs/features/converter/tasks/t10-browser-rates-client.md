---
id: T10
title: "Request the rate from the browser and validate the reply"
layer: "ui"
deps: ["T1"]
blocks: ["T11"]
acs: ["AC-12"]
files_hint: ["src/ui/rates-api.ts", "src/ui/rates-api.test.ts"]
owner: "Vlad"
estimate: "S"
context_budget: "M"
status: "done"
step: "COMMIT"
---

# T10 — Request the rate from the browser and validate the reply

## Place in the sequence

- **Blocked by:** T1 — Define supported currencies, the currency pair, the choice rule and shared rate types
- **Blocks:** T11 — Hold the rate state tied to the selected pair
- **Wave:** 2 — it needs only the types from T1 and can use a faked endpoint, so it runs alongside `server`.
- **Lane:** own lane.

## Why (user story)

> **As an** owner
> **I want** a result to appear only when it belongs to the selected currencies
> **So that** I can trust every number on screen
>
> — `spec.md §4, US-05, verbatim` · full text: [spec.md](../spec.md)

This task makes a broken or unexpected reply count as the rate being unavailable.

## Inlined context

> `src/ui/rates-api.ts` parses the `/api/rates` answer with `zod`. Anything unexpected counts as the rate being unavailable
>
> — `sad.md §8, Browser validation, verbatim` · full text: [sad.md](../sad.md)

> There is no separate browser limit, because the server's limit bounds the wait and a browser limit could fire during a slow first compile in development
>
> — `sad.md §8, Time limit, verbatim` · full text: [sad.md](../sad.md)

> **Browser to server:** the browser reaches the server only through `/api/rates`.
>
> — `CLAUDE.md §Conventions, Browser to server, verbatim` · full text: [CLAUDE.md](../../../../CLAUDE.md)

> a 200 reply names the requested pair.
>
> — `contracts/api-sync-report.md §Follow-up notes for implement, abridged` · full text: [api-sync-report.md](../contracts/api-sync-report.md)

> **Tests:** a test sits next to its source as `*.test.ts(x)`, using Testing Library and jsdom for components. Tests never call the real API: fake the rate source with `server.use(...)` from `test/msw-server.ts`. Unhandled requests fail the test.
>
> — `CLAUDE.md §Conventions, Tests, verbatim` · full text: [CLAUDE.md](../../../../CLAUDE.md)

**Breakdown decision:** the screen shows one unavailable state for every failure (ADR-0007), so any non-200 answer maps to it without reading `code`.

**Fallback:** insufficient or contradicted by the code → read the named file in full ([spec.md](../spec.md) · [sad.md](../sad.md) · [data-model.md](../data-model.md) · [openapi.yaml](../contracts/openapi.yaml) · [adr/](../adr/)) and follow it. Do not guess.

## Data delta

No DB changes. The feature has no datastore; this task works with the shape below, where "Column" means a field.

| Column | Type | Constraints | Change |
|---|---|---|---|
| `base` | `Currency` | One of UAH, USD, EUR, GBP, PLN | read-only |
| `quote` | `Currency` | One of UAH, USD, EUR, GBP, PLN; differs from `base` | read-only |
| `rate` | `string` | Plain positive decimal, no exponent form | read-only |
| `date` | `string` | Real calendar date as `YYYY-MM-DD`; its age never makes it invalid | read-only |

— `data-model.md §Entities, rate, abridged` · full text: [data-model.md](../data-model.md)

## API contract

- `GET /api/rates?base=<SupportedCurrency>&quote=<SupportedCurrency>` → `200` `DailyReferenceRate` `{ base, quote, rate, date }`, `rate` a string matching `^(?:[1-9][0-9]*(?:\.[0-9]+)?|0\.[0-9]*[1-9][0-9]*)$`, no other properties · errors: `400 invalid_pair`, `502 rate_unavailable`.

— `contracts/openapi.yaml, operationId getRate, abridged` · full text: [openapi.yaml](../contracts/openapi.yaml)

## Acceptance criteria

### AC-12 — cross-context

> **Given** the rate source cannot provide a usable rate for the selected pair and the app's server side holds no stored rate for it (a stored rate counts as usable, even past the refresh interval in §6)
> **When** the rate request fails, gets no answer within a time limit chosen in design, or its answer cannot be trusted. An answer cannot be trusted when it has an unexpected form, its rate is missing, zero or negative, it belongs to another pair, or its rate date is missing or invalid. The age of the rate date alone never makes a rate unusable, because the date is always shown (AC-06)
> **Then** no result appears, the screen says in plain Ukrainian that the rate is unavailable and shows no technical text from the rate source, and the amount and currencies stay as they were. A new attempt happens only when the owner changes the pair, including changing a field and changing it back, or uses the swap control; typing an amount does not retry. Reloading the page starts over as in AC-07 and requests the rate for USD to UAH. Retry controls and automatic retries stay in roadmap step 3
>
> — `spec.md §5, AC-12, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] `src/ui/rates-api.ts`: `fetchRate(pair, signal)` resolving to `{ kind: 'ready', rate }` or `{ kind: 'unavailable' }`, and never rejecting
- [ ] `src/ui/rates-api.ts`: a strict `zod` schema with the contract's `rate` pattern, `z.iso.date()`, and `base` and `quote` equal to the requested pair
- [ ] `src/ui/rates-api.test.ts`: fake `/api/rates` with `server.use(...)`

## Edge cases

| Case | Behaviour |
|---|---|
| 400 or 502 | Unavailable |
| Network error | Unavailable |
| 200 with invalid JSON | Unavailable |
| 200 with an extra property, or with `rate` as a number | Unavailable |
| 200 naming another pair | Unavailable |
| `rate` `1e5`, `0`, or `-1` | Unavailable |
| Aborted request | Resolves as unavailable; T11 ignores it because its signal is aborted |

## Definition of Done

- [ ] `src/ui/rates-api.test.ts` passes for a valid reply
- [ ] Every unexpected reply in the edge table resolves as unavailable without rejecting
- [ ] every Hard Rule inlined above still holds
- [ ] `npm run lint` and `npm run typecheck` clean
