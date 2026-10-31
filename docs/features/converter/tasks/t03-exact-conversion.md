---
id: T3
title: "Compute the reference result with exact arithmetic, half-up rounding and the below-minimum rule"
layer: "domain"
deps: []
blocks: ["T4", "T14", "T16"]
acs: ["AC-03", "AC-04"]
files_hint: ["src/domain/conversion.ts", "src/domain/conversion.test.ts"]
owner: "Vlad"
estimate: "S"
context_budget: "M"
status: "done"
step: "COMMIT"
---

# T3 — Compute the reference result with exact arithmetic, half-up rounding and the below-minimum rule

## Place in the sequence

- **Blocked by:** nothing
- **Blocks:** T4 — Format the result, rate and rate date as displayed · T14 — Derive and show the reference result, the label and the amount message · T16 — Check the worked examples from typed text to displayed string
- **Wave:** 1 — a pure function that takes a `Big` amount and a rate string, so it needs no other task.
- **Lane:** own lane.

## Why (user story)

> **As an** owner
> **I want** to type an amount and see it converted as I type
> **So that** I get the result with no extra action
>
> — `spec.md §4, US-01, verbatim` · full text: [spec.md](../spec.md)

This task delivers the calculation behind every number on screen; T4 writes it for display.

## Inlined context

> conversion.ts         exact calculation, half-up rounding, the "< 0,01" rule
>
> — `sad.md §5, tree src/domain/, verbatim` · full text: [sad.md](../sad.md)

> `big.js` values inside `domain`, rounded to two decimal places with a half going up
>
> — `sad.md §8, Money, verbatim` · full text: [sad.md](../sad.md)

> 100% of the worked examples in §5, calculated ahead of the code, match to the last decimal place
>
> — `spec.md §6, Arithmetic accuracy, verbatim` · full text: [spec.md](../spec.md)

> Automated tests with no shared code between expected values and the calculation
>
> — `spec.md §6, Arithmetic accuracy, verbatim` · full text: [spec.md](../spec.md)

> **Money:** amounts and rates are `big.js` values inside `domain`, never `number` arithmetic.
>
> — `CLAUDE.md §Conventions, Money, verbatim` · full text: [CLAUDE.md](../../../../CLAUDE.md)

**Fallback:** insufficient or contradicted by the code → read the named file in full ([spec.md](../spec.md) · [sad.md](../sad.md) · [data-model.md](../data-model.md) · [openapi.yaml](../contracts/openapi.yaml) · [adr/](../adr/)) and follow it. Do not guess.

## Data delta

No DB changes. The reference result is derived and never stored (`data-model.md` §Not modelled).

## API contract

Internal — no API surface.

## Acceptance criteria

### AC-03 — domain invariant

> **Given** an amount and a daily reference rate
> **When** the system computes the reference result
> **Then** it uses exact decimal arithmetic and rounds to two decimal places with a half going up, so 1,50 at a rate of 1,23 shows 1,85 and 1,15 at a rate of 1,1 shows 1,27
>
> — `spec.md §5, AC-03, verbatim` · full text: [spec.md](../spec.md)

### AC-04 — domain invariant

> **Given** a non-zero amount whose reference result would round to zero, such as 0,10 UAH at a rate of 0,022009 to USD
> **When** the system shows the result
> **Then** it shows `< 0,01 USD` rather than `0,00 USD`, so a small amount never looks worthless
>
> — `spec.md §5, AC-04, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] `src/domain/conversion.ts`: `convert(amount: Big, rate: string)` returning `{ kind: 'exact', value: Big }` or `{ kind: 'below-minimum' }`, rounding with `Big.roundHalfUp`
- [ ] `src/domain/conversion.test.ts`: literal expected values, none of them computed by the code under test

## Edge cases

| Case | Behaviour |
|---|---|
| 100 at `45.436` | 4543.60 |
| 1.50 at `1.23` | 1.85 |
| 1.15 at `1.1` | 1.27 |
| 0.10 at `0.022009` | Below minimum |
| 0 at any rate | Exact zero, never below minimum (AC-11) |
| A product of exactly 0.005 | Rounds up to 0.01, so it is exact rather than below minimum |
| 999999999999.99 at `45.436` | Exact to the last digit, with no `number` involved |

## Definition of Done

- [ ] `src/domain/conversion.test.ts` passes for the AC-03 and AC-04 examples with literal expected values
- [ ] 100% branch coverage of `conversion.ts`
- [ ] every Hard Rule inlined above still holds
- [ ] `npm run lint` and `npm run typecheck` clean
