---
id: T9
title: "Answer GET /api/rates with the rate or the error envelope"
layer: "ports"
deps: ["T1", "T8"]
blocks: ["T17"]
acs: ["AC-12"]
files_hint: ["src/app/api/rates/route.ts", "src/app/api/rates/route.test.ts"]
owner: "Vlad"
estimate: "S"
context_budget: "M"
status: "done"
step: "COMMIT"
---

# T9 — Answer GET /api/rates with the rate or the error envelope

## Place in the sequence

- **Blocked by:** T1 — Define supported currencies, the currency pair, the choice rule and shared rate types · T8 — Request the rate with the time limit and cache options, and drop untrusted answers
- **Blocks:** T17 — Probe the stored-answer behaviour on the production build
- **Wave:** 4 — it composes the pair check from T1 and `getRate` from T8.
- **Lane:** own lane.

## Why (user story)

> **As an** owner
> **I want** a result to appear only when it belongs to the selected currencies
> **So that** I can trust every number on screen
>
> — `spec.md §4, US-05, verbatim` · full text: [spec.md](../spec.md)

This task is the only way the browser reaches the server, and it keeps every upstream text behind it.

## Inlined context

> api/rates/route.ts    checks the pair, calls server, answers data or the error envelope
>
> — `sad.md §5, tree src/app/, verbatim` · full text: [sad.md](../sad.md)

> The route answers with `Cache-Control: no-store`, so returning to a pair really requests the rate again (AC-13c)
>
> — `sad.md §8, Browser cache, verbatim` · full text: [sad.md](../sad.md)

> The route writes one line to the server console for each failure it answers, naming its reason: timeout, source status or failed validation. Text from the rate source stays in this console and never reaches the browser.
>
> — `sad.md §7, Monitoring, verbatim` · full text: [sad.md](../sad.md)

> **Logging:** flow 8 writes a console line for a refused pair, following the §8 rule of one line per failure the route answers.
>
> — `sad.md §6, Flags from the runtime view, verbatim` · full text: [sad.md](../sad.md)

> The route should answer any failure of its own, including one while dropping a stored answer, as 502 `rate_unavailable`.
>
> — `contracts/api-sync-report.md §Follow-up notes for implement, verbatim` · full text: [api-sync-report.md](../contracts/api-sync-report.md)

> A currency outside the supported list is requested: refused, and the app does not pass it on to the rate source.
>
> — `spec.md §6.1, Abuse cases, verbatim` · full text: [spec.md](../spec.md)

> **Errors:** the route handler answers failures as `{ "error": { "code", "message" } }` with a matching HTTP status. `code` is a stable value the UI maps to its error state. Raw upstream errors never reach the browser.
>
> — `CLAUDE.md §Conventions, Errors, verbatim` · full text: [CLAUDE.md](../../../../CLAUDE.md)

**Fallback:** insufficient or contradicted by the code → read the named file in full ([spec.md](../spec.md) · [sad.md](../sad.md) · [data-model.md](../data-model.md) · [openapi.yaml](../contracts/openapi.yaml) · [adr/](../adr/)) and follow it. Do not guess.

## Data delta

No DB changes.

## API contract

- `GET /api/rates?base=<SupportedCurrency>&quote=<SupportedCurrency>` → `200` `DailyReferenceRate` `{ base, quote, rate, date }`, `rate` a string matching `^(?:[1-9][0-9]*(?:\.[0-9]+)?|0\.[0-9]*[1-9][0-9]*)$`, no other properties · errors: `400 invalid_pair`, `502 rate_unavailable`.
- `400` body: `{ "error": { "code": "invalid_pair", "message": "The currency pair is not supported." } }`.
- `502` body: `{ "error": { "code": "rate_unavailable", "message": "The rate is unavailable." } }`.
- Every response carries `Cache-Control: no-store`.

— `contracts/openapi.yaml, operationId getRate, abridged` · full text: [openapi.yaml](../contracts/openapi.yaml)

## Acceptance criteria

### AC-12 — cross-context

> **Given** the rate source cannot provide a usable rate for the selected pair and the app's server side holds no stored rate for it (a stored rate counts as usable, even past the refresh interval in §6)
> **When** the rate request fails, gets no answer within a time limit chosen in design, or its answer cannot be trusted. An answer cannot be trusted when it has an unexpected form, its rate is missing, zero or negative, it belongs to another pair, or its rate date is missing or invalid. The age of the rate date alone never makes a rate unusable, because the date is always shown (AC-06)
> **Then** no result appears, the screen says in plain Ukrainian that the rate is unavailable and shows no technical text from the rate source, and the amount and currencies stay as they were. A new attempt happens only when the owner changes the pair, including changing a field and changing it back, or uses the swap control; typing an amount does not retry. Reloading the page starts over as in AC-07 and requests the rate for USD to UAH. Retry controls and automatic retries stay in roadmap step 3
>
> — `spec.md §5, AC-12, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] `src/app/api/rates/route.ts`: `GET` reads `base` and `quote`, refuses a missing, unsupported or identical currency, then calls `getRate`
- [ ] `src/app/api/rates/route.ts`: wrap the call so any thrown error also answers 502, and write one `console.error` line per failure answered
- [ ] `src/app/api/rates/route.test.ts`: call `GET` directly, fake the source with `server.use(...)`, mock `next/cache`, assert status, exact body and header

## Edge cases

| Case | Behaviour |
|---|---|
| `base` missing, `quote` missing, or both | 400 `invalid_pair` |
| `base=XAU`, or lowercase `usd` | 400 `invalid_pair` |
| `base=USD&quote=USD` | 400 `invalid_pair` |
| A refused pair | No request reaches the source: no handler is registered, so a request would fail the test |
| Source fails, or answer untrusted | 502 with the exact fixed body, and no upstream text |
| `revalidateTag` throws | 502, with one console line |
| A 200 reply | Exactly `base`, `quote`, `rate`, `date`, with `rate` a string |

## Definition of Done

- [ ] `src/app/api/rates/route.test.ts` passes for 200 and every 400 and 502 branch, with exact bodies and `no-store`
- [ ] A test proves that no upstream text reaches a 502 body (AC-12)
- [ ] `npm run build` reports `/api/rates` as dynamic and needs no network
- [ ] every Hard Rule inlined above still holds
- [ ] `npm run lint` and `npm run typecheck` clean
