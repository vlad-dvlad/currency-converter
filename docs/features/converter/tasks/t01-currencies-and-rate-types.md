---
id: T1
title: "Define supported currencies, the currency pair, the choice rule and shared rate types"
layer: "domain"
deps: []
blocks: ["T4", "T7", "T9", "T10", "T12"]
acs: ["AC-07", "AC-08"]
files_hint: ["src/domain/currency.ts", "src/domain/currency.test.ts", "src/domain/rate.ts", "src/domain/rate.test.ts"]
owner: "Vlad"
estimate: "S"
context_budget: "M"
status: "todo"
step: ""
---

# T1 — Define supported currencies, the currency pair, the choice rule and shared rate types

## Place in the sequence

- **Blocked by:** nothing
- **Blocks:** T4 — Format the result, rate and rate date as displayed · T7 — Validate the rate source's answer into a rate, rejecting every untrusted form · T9 — Answer GET /api/rates with the rate or the error envelope · T10 — Request the rate from the browser and validate the reply · T12 — Build the converter form with its fields, swap control and Ukrainian text
- **Wave:** 1 — pure types and rules with no dependencies, and most later tasks import them.
- **Lane:** own lane.

## Why (user story)

> **As an** owner
> **I want** to choose currencies from the supported list and swap them
> **So that** I reach the direction I need quickly
>
> — `spec.md §4, US-03, verbatim` · full text: [spec.md](../spec.md)

This task delivers the supported list, the default pair and the rule that a pair never holds one currency twice; the fields that use them come in T12.

## Inlined context

> currency.ts           supported currencies, the currency pair, the swap rule
>
> — `sad.md §5, tree src/domain/, verbatim` · full text: [sad.md](../sad.md)

> rate.ts               shared types: the rate answer and the failure codes
>
> — `sad.md §5, tree src/domain/, verbatim` · full text: [sad.md](../sad.md)

> `invalid_pair` with status 400 and `rate_unavailable` with status 502, with the specific reason written only to the server console.
>
> — `adr/0007-two-failure-codes-until-step-3.md §Considered options, option 1, verbatim` · full text: [0007-two-failure-codes-until-step-3.md](../adr/0007-two-failure-codes-until-step-3.md)

> `server` converts the source's number to that string once, and `domain` builds the `big.js` value and the displayed digits from it, so the browser never holds a rate as a `number`.
>
> — `sad.md §5, Rate on the wire, verbatim` · full text: [sad.md](../sad.md)

> **Money:** amounts and rates are `big.js` values inside `domain`, never `number` arithmetic.
>
> — `CLAUDE.md §Conventions, Money, verbatim` · full text: [CLAUDE.md](../../../../CLAUDE.md)

> Dependencies point inward: `app`, `ui` and `server` may import `domain`; `domain` imports nothing from the others. Import across modules with the `@/` alias.
>
> — `CLAUDE.md §Structure, verbatim` · full text: [CLAUDE.md](../../../../CLAUDE.md)

**Breakdown decision:** the number-to-string conversion is a `domain` helper that `server` calls (T7), so `big.js` stays in `domain` and the conversion still happens once. Upstream does not name the helper's location.

**Fallback:** insufficient or contradicted by the code → read the named file in full ([spec.md](../spec.md) · [sad.md](../sad.md) · [data-model.md](../data-model.md) · [openapi.yaml](../contracts/openapi.yaml) · [adr/](../adr/)) and follow it. Do not guess.

## Data delta

No DB changes. The feature has no datastore; this task works with the shape below, where "Column" means a field.

| Column | Type | Constraints | Change |
|---|---|---|---|
| `base` | `Currency` | One of UAH, USD, EUR, GBP, PLN | read-only |
| `quote` | `Currency` | One of UAH, USD, EUR, GBP, PLN; differs from `base` | read-only |
| `rate` | `string` | Plain positive decimal, no exponent form | added (type) |
| `date` | `string` | `YYYY-MM-DD` | added (type) |

— `data-model.md §Entities, currency_pair + rate, abridged` · full text: [data-model.md](../data-model.md)

## API contract

Internal — no API surface. The types mirror `SupportedCurrency`, `DailyReferenceRate` and `ErrorCode`; T9 and T10 own the wire.

— `contracts/openapi.yaml, operationId getRate, abridged` · full text: [openapi.yaml](../contracts/openapi.yaml)

## Acceptance criteria

### AC-07 — happy path

> **Given** the owner opens the app
> **When** the screen appears
> **Then** the currency pair is USD to UAH, the amount is empty, and each currency field offers exactly UAH, USD, EUR, GBP and PLN
>
> — `spec.md §5, AC-07, verbatim` · full text: [spec.md](../spec.md)

### AC-08 — domain invariant

> **Given** a currency pair is selected
> **When** the owner chooses for one field the currency already in the other field
> **Then** the two fields swap, so a currency pair never holds the same currency twice and no error appears
>
> — `spec.md §5, AC-08, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] `src/domain/currency.ts`: `SUPPORTED_CURRENCIES` in the order UAH, USD, EUR, GBP, PLN; types `Currency` and `CurrencyPair { base, quote }`; `isSupportedCurrency(text)`; `DEFAULT_PAIR` USD to UAH
- [ ] `src/domain/currency.ts`: `swapPair(pair)` and `chooseCurrency(pair, field, currency)`, which swaps when the other field already holds `currency`
- [ ] `src/domain/rate.ts`: type `DailyReferenceRate { base, quote, rate, date }`, type `RateErrorCode` (`invalid_pair`, `rate_unavailable`), and `rateToDecimalString(n)` using `new Big(n).toFixed()`
- [ ] Tests with literal expected values in `src/domain/currency.test.ts` and `src/domain/rate.test.ts`

## Edge cases

| Case | Behaviour |
|---|---|
| Choosing the currency a field already holds | The pair is returned unchanged |
| Choosing the other field's currency for `base` or for `quote` | The fields swap, for both fields |
| `isSupportedCurrency('usd')`, `''`, `'XAU'` | `false`: the check is exact |
| `rateToDecimalString(1e-7)` | `0.0000001`, never exponent form |
| `rateToDecimalString(45.436)` | `45.436` |

## Definition of Done

- [ ] `src/domain/currency.test.ts` passes for AC-07's list and default pair and for both swap directions of AC-08
- [ ] `src/domain/rate.test.ts` passes for the exponent case
- [ ] 100% branch coverage of both files
- [ ] every Hard Rule inlined above still holds
- [ ] `npm run lint` and `npm run typecheck` clean
