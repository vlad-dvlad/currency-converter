---
id: T2
title: "Parse typed amount text into empty, valid or rejected"
layer: "domain"
deps: []
blocks: ["T14", "T16"]
acs: ["AC-10", "AC-11"]
files_hint: ["src/domain/amount.ts", "src/domain/amount.test.ts"]
owner: "Vlad"
estimate: "S"
context_budget: "M"
status: "todo"
step: ""
---

# T2 — Parse typed amount text into empty, valid or rejected

## Place in the sequence

- **Blocked by:** nothing
- **Blocks:** T14 — Derive and show the reference result, the label and the amount message · T16 — Check the worked examples from typed text to displayed string
- **Wave:** 1 — a pure function with no dependencies.
- **Lane:** own lane.

## Why (user story)

> **As an** owner
> **I want** to be told what an amount must look like when mine cannot be converted
> **So that** I can correct what I typed
>
> — `spec.md §4, US-04, verbatim` · full text: [spec.md](../spec.md)

This task decides what counts as an amount; T14 shows the outcome on screen.

## Inlined context

> amount.ts             typed text to empty, valid or rejected
>
> — `sad.md §5, tree src/domain/, verbatim` · full text: [sad.md](../sad.md)

> Note over UI: 12, reads as 12 and 1,5 reads as 1.5 and ,5 reads as 0,5 and 007 reads as 7
>
> — `sad.md §6, flow 4, verbatim` · full text: [sad.md](../sad.md)

> alt The field is empty or holds a lone separator
>
> — `sad.md §6, flow 4, verbatim` · full text: [sad.md](../sad.md)

> else The text is rejected: a sign, letters, two separators, spaces, over two decimals or over 12 whole digits
>
> — `sad.md §6, flow 4, verbatim` · full text: [sad.md](../sad.md)

> **Money:** amounts and rates are `big.js` values inside `domain`, never `number` arithmetic.
>
> — `CLAUDE.md §Conventions, Money, verbatim` · full text: [CLAUDE.md](../../../../CLAUDE.md)

**Fallback:** insufficient or contradicted by the code → read the named file in full ([spec.md](../spec.md) · [sad.md](../sad.md) · [data-model.md](../data-model.md) · [openapi.yaml](../contracts/openapi.yaml) · [adr/](../adr/)) and follow it. Do not guess.

## Data delta

No DB changes. The typed amount is never stored (`data-model.md` §Not modelled).

## API contract

Internal — no API surface.

## Acceptance criteria

### AC-10 — error

> **Given** the owner is typing an amount
> **When** the text has a minus or plus sign, letters, two separators, more than two digits after the separator such as `1,000`, spaces, or more than 12 digits before the separator, not counting leading zeros
> **Then** the text stays in the field as typed rather than being blocked, no result appears, and one general message in plain Ukrainian explains what the amount must look like; the same message serves every rule
>
> — `spec.md §5, AC-10, verbatim` · full text: [spec.md](../spec.md)

### AC-11 — happy path

> **Given** the owner is partway through typing
> **When** the amount field holds an unfinished or simple value
> **Then** an empty field or a lone separator shows neither a result nor an error, `12,` reads as 12, `1,5` and `1.5` read the same, `,5` and `.5` read as 0,5, `007` reads as 7, and `0` shows 0,00
>
> — `spec.md §5, AC-11, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] `src/domain/amount.ts`: `parseAmount(text)` returning `{ kind: 'empty' }`, `{ kind: 'rejected' }` or `{ kind: 'valid', value: Big }`
- [ ] `src/domain/amount.test.ts`: one literal case per row of the edge table

## Edge cases

| Case | Behaviour |
|---|---|
| `''`, `,`, `.` | Empty: no result and no error |
| `-1`, `+1`, `abc`, `1a` | Rejected |
| `1,2,3`, `1,.5`, `1.2,` | Rejected: two separators |
| `1,000`, `1.234` | Rejected: more than two decimals |
| `1 000`, ` 12`, `12 `, a non-breaking space, spaces alone | Rejected: spaces |
| `1234567890123` (13 digits) | Rejected |
| `123456789012` (12 digits), and the same with leading zeros | Valid: leading zeros are not counted |
| `12,`, `12.` | Valid, 12 |
| `1,5`, `1.5` | Valid, the same value 1.5 |
| `,5`, `.5` | Valid, 0.5 |
| `007` | Valid, 7 |
| `0`, `0,00`, `0000000000000` | Valid, zero |

## Definition of Done

- [ ] `src/domain/amount.test.ts` passes for every example in AC-10 and AC-11
- [ ] 100% branch coverage of `amount.ts`
- [ ] every Hard Rule inlined above still holds
- [ ] `npm run lint` and `npm run typecheck` clean
