---
status: Accepted
owner: "Vlad"
reviewers: []
updated_at: "2026-10-31"
feature_size: "M"
ticket: ""
---

# 0006 — Carry rates between server and browser as decimal strings

- **Status:** Accepted
- **Date:** 2026-10-31
- **Deciders:** Vlad, with Claude proposing during `design`

## Context

The rate source sends a rate as a JSON number, such as `45.436`. The screen has to show it with every digit as published (spec AC-05) and calculate with it exactly (spec AC-03). The form it takes on `/api/rates` is a contract between `server`, `ui` and `domain`.

## Decision drivers

- Amounts and rates are `big.js` values inside `domain`, never `number` arithmetic (`CLAUDE.md`, Money).
- The rate is shown with every digit as published, with no rounding (spec AC-05).
- Top quality goal 1, numeric correctness.

## Considered options

1. **Decimal string** — `{ "rate": "45.436", ... }`. `server` converts the source's number once, and `domain` reads the string.
2. **JSON number** — `{ "rate": 45.436, ... }`, as the source sends it, with the browser calling `new Big(rate)`.

## Decision outcome

**Chosen:** Option 1. The browser never holds a rate as a `number`, and the contract states that the value is exact. Option 2 is more natural JSON and needs no conversion, but it passes the rate through `number` in two more places and needs handling for values that JavaScript writes in exponent form.

## Consequences

**Positive**
- `domain` has one input form for a rate, which its tests cover directly.
- The contract rules out `number` arithmetic in `ui` by its type.

**Negative**
- The contract is slightly less natural for JSON, and `zod` has to check that the string is a positive decimal.
- The value still arrives from the source as a number, so digits are exact only up to 15 significant digits. Rates seen on 2026-10-31 have 5 or 6 (§11).

**Neutral**
- Reading the digits directly from the source's raw JSON text would remove that limit, and it would touch only `src/server/`.

## Links

- Spec: [[../spec.md]]
- SAD: [[../sad.md]] §5
- Related ADR: [[0003-frankfurter-v2-one-request-per-pair]]
