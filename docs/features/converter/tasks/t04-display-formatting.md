---
id: T4
title: "Format the result, rate and rate date as displayed"
layer: "domain"
deps: ["T1", "T3"]
blocks: ["T13", "T14", "T16"]
acs: ["AC-01", "AC-04", "AC-05", "AC-06"]
files_hint: ["src/domain/format.ts", "src/domain/format.test.ts"]
owner: "Vlad"
estimate: "S"
context_budget: "M"
status: "done"
step: "COMMIT"
---

# T4 — Format the result, rate and rate date as displayed

## Place in the sequence

- **Blocked by:** T1 — Define supported currencies, the currency pair, the choice rule and shared rate types · T3 — Compute the reference result with exact arithmetic, half-up rounding and the below-minimum rule
- **Blocks:** T13 — Show the rate, rate date, dash and unavailable message on the screen · T14 — Derive and show the reference result, the label and the amount message · T16 — Check the worked examples from typed text to displayed string
- **Wave:** 2 — it formats the rate type from T1 and the outcome from T3.
- **Lane:** own lane.

## Why (user story)

> **As an** owner
> **I want** to type an amount and see it converted as I type
> **So that** I get the result with no extra action
>
> — `spec.md §4, US-01, verbatim` · full text: [spec.md](../spec.md)

> **As an** owner
> **I want** to see the daily reference rate, the rate date and a reference-value label beside the result
> **So that** I know what the number is based on and what it does not promise
>
> — `spec.md §4, US-02, verbatim` · full text: [spec.md](../spec.md)

This task produces the exact strings the screen shows beside the result.

## Inlined context

> format.ts             result, rate and rate date as displayed
>
> — `sad.md §5, tree src/domain/, verbatim` · full text: [sad.md](../sad.md)

> Written by hand from `big.js` output, without `Intl`: a decimal comma, and a non-breaking space (U+00A0) between thousands in results (AC-01). Rates have no grouping (AC-05).
>
> — `sad.md §8, Number formatting, verbatim` · full text: [sad.md](../sad.md)

> The rate date stays a `YYYY-MM-DD` string and is shown as `DD.MM.YYYY` by rearranging its parts. It never becomes a `Date`, so no time zone can shift it (AC-06)
>
> — `sad.md §8, Dates, verbatim` · full text: [sad.md](../sad.md)

**Trap:** the spec writes `4 543,60 UAH` with an ordinary space in its source text, but AC-01 requires a non-breaking space between thousands. Tests must expect `4\u00A0543,60 UAH`. The space before the currency code stays ordinary.

**Fallback:** insufficient or contradicted by the code → read the named file in full ([spec.md](../spec.md) · [sad.md](../sad.md) · [data-model.md](../data-model.md) · [openapi.yaml](../contracts/openapi.yaml) · [adr/](../adr/)) and follow it. Do not guess.

## Data delta

No DB changes. The feature has no datastore; this task works with the shape below, where "Column" means a field.

| Column | Type | Constraints | Change |
|---|---|---|---|
| `rate` | `string` | Plain positive decimal, no exponent form | read-only |
| `date` | `string` | Real calendar date as `YYYY-MM-DD`; its age never makes it invalid | read-only |

— `data-model.md §Entities, rate, abridged` · full text: [data-model.md](../data-model.md)

## API contract

Internal — no API surface.

## Acceptance criteria

### AC-01 — happy path

> **Given** the owner has the currency pair USD to UAH on screen and its daily reference rate is 45,436
> **When** the owner types 100 as the amount
> **Then** the screen immediately shows the reference result 4 543,60 UAH, with no button to press; a result always uses a decimal comma and a non-breaking space between thousands
>
> — `spec.md §5, AC-01, verbatim` · full text: [spec.md](../spec.md)

### AC-04 — domain invariant

> **Given** a non-zero amount whose reference result would round to zero, such as 0,10 UAH at a rate of 0,022009 to USD
> **When** the system shows the result
> **Then** it shows `< 0,01 USD` rather than `0,00 USD`, so a small amount never looks worthless
>
> — `spec.md §5, AC-04, verbatim` · full text: [spec.md](../spec.md)

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

## Checklist

- [ ] `src/domain/format.ts`: `formatResult(outcome, quote)`, `formatRate(rate)` as `1 USD = 45,436 UAH`, and `formatRateDate(date)` as `DD.MM.YYYY`
- [ ] `src/domain/format.test.ts`: literal expected strings, written with `\u00A0` where a non-breaking space is required

## Edge cases

| Case | Behaviour |
|---|---|
| Result 999.99 | `999,99 UAH`: no grouping below a thousand |
| Result 1000 | `1\u00A0000,00 UAH` |
| Result 1234567.89 | `1\u00A0234\u00A0567,89 UAH` |
| Exact zero | `0,00 UAH` |
| Below minimum, USD | `< 0,01 USD` |
| Rate `1234.5` | `1 USD = 1234,5 UAH`: no grouping |
| Rate `45` | `1 USD = 45 UAH`: no decimals are added |
| Date `2026-10-29` | `29.10.2026`, whatever today's date is |

## Definition of Done

- [ ] `src/domain/format.test.ts` passes for the literal strings in AC-01, AC-04, AC-05 and AC-06
- [ ] No `Intl` and no `Date` in `format.ts`
- [ ] 100% branch coverage of `format.ts`
- [ ] every Hard Rule inlined above still holds
- [ ] `npm run lint` and `npm run typecheck` clean
