---
id: T16
title: "Check the worked examples from typed text to displayed string"
layer: "tests"
deps: ["T2", "T3", "T4"]
blocks: ["T18"]
acs: ["AC-01", "AC-03", "AC-04"]
files_hint: ["src/domain/worked-examples.test.ts"]
owner: "Vlad"
estimate: "S"
context_budget: "M"
status: "done"
step: "COMMIT"
---

# T16 — Check the worked examples from typed text to displayed string

## Place in the sequence

- **Blocked by:** T2 — Parse typed amount text into empty, valid or rejected · T3 — Compute the reference result with exact arithmetic, half-up rounding and the below-minimum rule · T4 — Format the result, rate and rate date as displayed
- **Blocks:** T18 — Update the project docs and write the owner's finish-line checklist
- **Wave:** 3 — it needs all three money functions, and can run alongside the `ui` work.
- **Lane:** own lane.

## Why (user story)

> **As an** owner
> **I want** to type an amount and see it converted as I type
> **So that** I get the result with no extra action
>
> — `spec.md §4, US-01, verbatim` · full text: [spec.md](../spec.md)

> **As an** owner
> **I want** checks that show the feature is finished and its numbers are right
> **So that** "well implemented" is not only a matter of taste
>
> — `spec.md §4, US-08, verbatim` · full text: [spec.md](../spec.md)

This task is the independent check of the numbers that the finish line asks for.

## Inlined context

> the worked examples from spec §5 run against the money logic, including 100 at 45,436 (4 543,60), 1,50 at 1,23 (1,85), 1,15 at 1,1 (1,27) and 0,10 at 0,022009 (`< 0,01`).
>
> — `sad.md §10, QG-1, verbatim` · full text: [sad.md](../sad.md)

> literal expected values in `src/domain/*.test.ts`, with no mocks.
>
> — `sad.md §10, QG-1, verbatim` · full text: [sad.md](../sad.md)

> Automated tests with no shared code between expected values and the calculation
>
> — `spec.md §6, Arithmetic accuracy, verbatim` · full text: [spec.md](../spec.md)

**Fallback:** insufficient or contradicted by the code → read the named file in full ([spec.md](../spec.md) · [sad.md](../sad.md) · [data-model.md](../data-model.md) · [openapi.yaml](../contracts/openapi.yaml) · [adr/](../adr/)) and follow it. Do not guess.

## Data delta

No DB changes.

## API contract

Internal — no API surface.

## Acceptance criteria

### AC-01 — happy path

> **Given** the owner has the currency pair USD to UAH on screen and its daily reference rate is 45,436
> **When** the owner types 100 as the amount
> **Then** the screen immediately shows the reference result 4 543,60 UAH, with no button to press; a result always uses a decimal comma and a non-breaking space between thousands
>
> — `spec.md §5, AC-01, verbatim` · full text: [spec.md](../spec.md)

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

- [ ] `src/domain/worked-examples.test.ts`: a table of typed text, rate string, quote and literal expected string, run through `parseAmount`, `convert` and `formatResult`

## Edge cases

| Case | Behaviour |
|---|---|
| `100`, `45.436`, UAH | `4\u00A0543,60 UAH` |
| `1,50`, `1.23` | `1,85`, plus the quote code |
| `1,15`, `1.1` | `1,27`, plus the quote code |
| `0,10`, `0.022009`, USD | `< 0,01 USD` |
| `0`, any rate | `0,00`, plus the quote code |

## Definition of Done

- [ ] `src/domain/worked-examples.test.ts` passes for every worked example in AC-01, AC-03 and AC-04
- [ ] Expected values are literals, and the test uses no mocks or helpers shared with the calculation
- [ ] every Hard Rule inlined above still holds
- [ ] `npm run lint` and `npm run typecheck` clean
