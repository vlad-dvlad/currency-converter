---
id: T7
title: "Validate the rate source's answer into a rate, rejecting every untrusted form"
layer: "infra"
deps: ["T1"]
blocks: ["T8"]
acs: ["AC-06", "AC-12"]
files_hint: ["src/server/rate-source.ts", "src/server/rate-source.test.ts"]
owner: "Vlad"
estimate: "S"
context_budget: "M"
status: "done"
step: "COMMIT"
---

# T7 — Validate the rate source's answer into a rate, rejecting every untrusted form

## Place in the sequence

- **Blocked by:** T1 — Define supported currencies, the currency pair, the choice rule and shared rate types
- **Blocks:** T8 — Request the rate with the time limit and cache options, and drop untrusted answers
- **Wave:** 2 — it needs the types and the number-to-string helper from T1.
- **Lane:** shares `src/server/rate-source.test.ts` with T8 — serialized.

## Why (user story)

> **As an** owner
> **I want** to see the daily reference rate, the rate date and a reference-value label beside the result
> **So that** I know what the number is based on and what it does not promise
>
> — `spec.md §4, US-02, verbatim` · full text: [spec.md](../spec.md)

> **As an** owner
> **I want** a result to appear only when it belongs to the selected currencies
> **So that** I can trust every number on screen
>
> — `spec.md §4, US-05, verbatim` · full text: [spec.md](../spec.md)

This task is the trust boundary: nothing from the rate source reaches the app unchecked.

## Inlined context

> `zod` at the `server` boundary requires exactly one item with the requested base and quote, a positive rate and a real calendar date. Anything else is untrusted (AC-12), and rate date age alone never is
>
> — `sad.md §8, Rate source validation, verbatim` · full text: [sad.md](../sad.md)

> Observed form: `[{"date":"2026-10-31","base":"USD","quote":"UAH","rate":45.436}]`.
>
> — `data-model.md §Entities, stored_answer.raw_body, verbatim` · full text: [data-model.md](../data-model.md)

> the source's `date`, `base` and `quote` pass through unchanged, and only `rate` changes form, from number to string.
>
> — `data-model.md §Entities, rate, verbatim` · full text: [data-model.md](../data-model.md)

> `format: date` is only an annotation for most validators, so `zod` has to reject a date such as `2026-02-30`.
>
> — `contracts/api-sync-report.md §Follow-up notes for implement, verbatim` · full text: [api-sync-report.md](../contracts/api-sync-report.md)

**Checked at breakdown time:** `z.iso.date()` in the installed zod 4 rejects `2026-02-30` and `2026-13-01` and accepts `2024-02-29`.

> **External input:** anything from the network is parsed with `zod` at the `server` boundary before use.
>
> — `CLAUDE.md §Conventions, External input, verbatim` · full text: [CLAUDE.md](../../../../CLAUDE.md)

**Fallback:** insufficient or contradicted by the code → read the named file in full ([spec.md](../spec.md) · [sad.md](../sad.md) · [data-model.md](../data-model.md) · [openapi.yaml](../contracts/openapi.yaml) · [adr/](../adr/)) and follow it. Do not guess.

## Data delta

No DB changes. The feature has no datastore; this task works with the shape below, where "Column" means a field.

| Column | Type | Constraints | Change |
|---|---|---|---|
| `raw_body` | `string` | Untrusted until validated | read-only |
| `base` | `Currency` | One of UAH, USD, EUR, GBP, PLN | read-only |
| `quote` | `Currency` | One of UAH, USD, EUR, GBP, PLN; differs from `base` | read-only |
| `rate` | `string` | Plain positive decimal, no exponent form | read-only |
| `date` | `string` | Real calendar date as `YYYY-MM-DD`; its age never makes it invalid | read-only |

— `data-model.md §Entities, stored_answer + rate, abridged` · full text: [data-model.md](../data-model.md)

## API contract

Internal — no API surface.

## Acceptance criteria

### AC-06 — cross-context

> **Given** the rate source's latest rate for the selected pair is dated 29 October 2026
> **When** the owner sees the result on a later day
> **Then** the screen shows 29.10.2026 as the rate date, never today's date
>
> — `spec.md §5, AC-06, verbatim` · full text: [spec.md](../spec.md)

### AC-12 — cross-context

> **Given** the rate source cannot provide a usable rate for the selected pair and the app's server side holds no stored rate for it (a stored rate counts as usable, even past the refresh interval in §6)
> **When** the rate request fails, gets no answer within a time limit chosen in design, or its answer cannot be trusted. An answer cannot be trusted when it has an unexpected form, its rate is missing, zero or negative, it belongs to another pair, or its rate date is missing or invalid. The age of the rate date alone never makes a rate unusable, because the date is always shown (AC-06)
> **Then** no result appears, the screen says in plain Ukrainian that the rate is unavailable and shows no technical text from the rate source, and the amount and currencies stay as they were. A new attempt happens only when the owner changes the pair, including changing a field and changing it back, or uses the swap control; typing an amount does not retry. Reloading the page starts over as in AC-07 and requests the rate for USD to UAH. Retry controls and automatic retries stay in roadmap step 3
>
> — `spec.md §5, AC-12, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] `src/server/rate-source.ts`: `parseRateAnswer(body: unknown, pair)` returning a `DailyReferenceRate` or a failure with the reason `failed validation`, using `rateToDecimalString` from T1
- [ ] `src/server/rate-source.test.ts`: one literal case per untrusted form, using the fixtures in the edge table

## Edge cases

| Case | Behaviour |
|---|---|
| Not an array, or not JSON-shaped | Untrusted |
| `[]`, or more than one item | Untrusted |
| `rate` missing, `0` or negative | Untrusted |
| `rate` as the string `"45.4"` | Untrusted: the source sends a number |
| Another base or quote, including the reversed pair | Untrusted |
| `date` missing, `2026-02-30`, or `31.10.2026` | Untrusted |
| A valid date from years ago | Valid: age alone never makes a rate unusable |
| `date` `2026-10-29` | Comes out unchanged (AC-06) |
| `rate` `1e-7` | Comes out as `0.0000001` |

## Definition of Done

- [ ] `src/server/rate-source.test.ts` passes for each untrusted form in AC-12
- [ ] A test shows an old rate date passing through unchanged (AC-06)
- [ ] every Hard Rule inlined above still holds
- [ ] `npm run lint` and `npm run typecheck` clean
