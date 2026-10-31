---
id: T14
title: "Derive and show the reference result, the label and the amount message"
layer: "ui"
deps: ["T2", "T3", "T4", "T13"]
blocks: ["T15"]
acs: ["AC-01", "AC-02", "AC-04", "AC-05", "AC-10", "AC-11", "AC-13c"]
files_hint: ["src/ui/converter.tsx", "src/ui/converter.test.tsx"]
owner: "Vlad"
estimate: "M"
context_budget: "M"
status: "done"
step: "COMMIT"
---

# T14 — Derive and show the reference result, the label and the amount message

## Place in the sequence

- **Blocked by:** T2 — Parse typed amount text into empty, valid or rejected · T3 — Compute the reference result with exact arithmetic, half-up rounding and the below-minimum rule · T4 — Format the result, rate and rate date as displayed · T13 — Show the rate, rate date, dash and unavailable message on the screen
- **Blocks:** T15 — Render the converter from the static page and set the document language
- **Wave:** 5 — it completes the screen on top of T13, using the parser from T2 and the calculation from T3.
- **Lane:** shares `src/ui/converter.test.tsx` with T12; shares `src/ui/converter.test.tsx` with T13 — serialized.

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

> **As an** owner
> **I want** to be told what an amount must look like when mine cannot be converted
> **So that** I can correct what I typed
>
> — `spec.md §4, US-04, verbatim` · full text: [spec.md](../spec.md)

> **As an** owner
> **I want** a result to appear only when it belongs to the selected currencies
> **So that** I can trust every number on screen
>
> — `spec.md §4, US-05, verbatim` · full text: [spec.md](../spec.md)

This task delivers the feature's core: the result updates as the owner types, and only when it can be trusted.

## Inlined context

> The result is derived on each render from the typed amount and the held rate and is never stored, so typing causes no rate request (AC-02).
>
> — `sad.md §5, Rate state, verbatim` · full text: [sad.md](../sad.md)

> Note over U,UI: Postcondition: no rate request was made, and the rate state is unchanged
>
> — `sad.md §6, flow 4, verbatim` · full text: [sad.md](../sad.md)

> component tests with `msw` (`src/ui/*.test.tsx`) cover replies out of order and all 9 cells of the AC-13c table.
>
> — `sad.md §10, QG-2, verbatim` · full text: [sad.md](../sad.md)

**Invariant:** A reference result can never appear without the currency pair, daily reference rate and rate date it was computed from. — `CONTEXT.md §Invariants, verbatim` · full text: [CONTEXT.md](../../../../CONTEXT.md)

**UI reuse:** `src/ui/` is empty and `docs/design-system.md` does not exist, so there is no component to reuse and no `screens.md` manifest; the AC-13c table is the state contract. Build with native elements and Tailwind utilities in `converter.tsx`, and add no shared primitive (`docs/architecture-map.md` §Frontend: add one when a second use appears). Visual polish is roadmap step 4.

**Fallback:** insufficient or contradicted by the code → read the named file in full ([spec.md](../spec.md) · [sad.md](../sad.md) · [data-model.md](../data-model.md) · [openapi.yaml](../contracts/openapi.yaml) · [adr/](../adr/)) and follow it. Do not guess.

## Data delta

No DB changes. The amount and the result are never stored (`data-model.md` §Not modelled).

## API contract

No request of its own: this task must not add any. Tests fake `GET /api/rates` as in T13.

## Acceptance criteria

### AC-01 — happy path

> **Given** the owner has the currency pair USD to UAH on screen and its daily reference rate is 45,436
> **When** the owner types 100 as the amount
> **Then** the screen immediately shows the reference result 4 543,60 UAH, with no button to press; a result always uses a decimal comma and a non-breaking space between thousands
>
> — `spec.md §5, AC-01, verbatim` · full text: [spec.md](../spec.md)

### AC-02 — happy path

> **Given** a reference result is on screen
> **When** the owner changes the amount
> **Then** the result updates from the same daily reference rate and rate date, and typing never causes a new rate request of any kind
>
> — `spec.md §5, AC-02, verbatim` · full text: [spec.md](../spec.md)

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

### AC-13c — domain invariant

> **Given** the app requests the rate when it opens and after every change of pair, whatever the amount holds
> **When** the screen shows any combination of amount and rate
> **Then** the rate and the amount are presented independently, and a reference result appears only with a valid amount and a ready rate. The screen holds only the rate of the selected pair, until the pair changes or the page reloads: an open screen never refreshes it on a timer, and returning to an earlier pair requests the rate again:
>
> | Amount | Rate not arrived yet | Rate ready | Rate unavailable |
> |---|---|---|---|
> | Empty | Dash, no result, no amount error | Rate and rate date, no result, no amount error | Unavailable message, no result, no amount error |
> | Valid | Dash, no result | Result, rate, rate date and reference-value label | Unavailable message, no result |
> | Rejected | Dash, amount explanation, no result | Rate and rate date, amount explanation, no result | Unavailable message, amount explanation, no result |
>
> — `spec.md §5, AC-13c, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] `src/ui/converter.tsx`: on each render, read the text with `parseAmount`, then `convert` and `formatResult` only when the amount is valid and the rate is ready
- [ ] `src/ui/converter.tsx`: show the reference-value label with the result, and the one amount message for a rejected amount, independent of the rate state
- [ ] `src/ui/converter.test.tsx`: one parametrized test per cell of the AC-13c table, nine in all
- [ ] `src/ui/converter.test.tsx`: count requests at the `/api/rates` handler while typing, and assert the count stays at one

## Edge cases

| Case | Behaviour |
|---|---|
| `0` with a ready rate | `0,00 UAH` with the rate, date and label |
| `0,10` UAH to USD at `0.022009` | `< 0,01 USD` |
| `1,000` | The text stays, the amount message shows, and no result appears |
| `,` or an empty field | No result and no message |
| Rejected amount and unavailable rate | Both messages, and no result |
| Valid amount and pending rate | A dash and no result |
| Typing after the rate arrived | The same rate and date, and no new request (AC-02) |
| Swap with a valid amount | A dash, then the new result, with the amount unchanged |

## Definition of Done

- [ ] `src/ui/converter.test.tsx` passes for all nine cells of AC-13c
- [ ] A test passes for `4\u00A0543,60 UAH` (AC-01) and `< 0,01 USD` (AC-04)
- [ ] A test counts one request across typing (AC-02)
- [ ] every Hard Rule inlined above still holds
- [ ] `npm run lint` and `npm run typecheck` clean
