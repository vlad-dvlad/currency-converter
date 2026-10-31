---
status: Accepted
owner: "Vlad"
reviewers: []
updated_at: "2026-10-31"
feature_size: "M"
ticket: ""
---

# 0003 — Use Frankfurter v2 as the only rate source, with one request per currency pair

- **Status:** Accepted
- **Date:** 2026-10-31
- **Deciders:** Vlad, with Claude proposing during `design`

## Context

Repo ADR-0001 left Frankfurter as a proposal, and spec §8 asks for it to be confirmed before design finishes. All 20 directed pairs of the five supported currencies returned a rate on 2026-10-31 (spec §1), which is a one-time check rather than a guarantee. A request for one pair on the same date returned `[{"date":"2026-10-31","base":"USD","quote":"UAH","rate":45.436}]`, and an unsupported currency returned status 422.

## Decision drivers

- A rate must belong to the selected pair, and its date comes from that individual rate (spec AC-06, AC-12).
- Each direction uses its own published rate, never an inverted copy (spec AC-09).
- No key and no paid provider (`docs/idea-brief.md` §7).
- Reused answers limit the load on the source's unstated abuse limit (spec §6.1).

## Considered options

1. **Frankfurter v2, one request per pair** — `v2/rates?base=USD&quotes=UAH`, answered with exactly one rate.
2. **Frankfurter v2, one request per base currency** — `v2/rates?base=UAH&quotes=USD,EUR,GBP,PLN`, keeping one rate from four.
3. **Open ExchangeRate-API** — another keyless source with UAH, requiring attribution and forbidding redistribution; its coverage of the 20 pairs and per-rate dates were not checked.

## Decision outcome

**Chosen:** Option 1. With one rate in each answer, checking the pair and date is simple, and a bad rate affects only its own pair. Option 2 saves cache entries but raises the question of partly valid answers. Option 3 would need the coverage check repeated and adds an attribution duty to the screen.

## Consequences

**Positive**
- Validation is short: exactly one item with the requested base and quote, a positive rate and a valid date.
- The amount never leaves the machine, because a request carries only the pair (spec §6.1).

**Negative**
- The cache can hold up to 20 entries, and a first visit to each pair costs one request.
- The app has one source, so an outage with nothing stored means no result (`docs/idea-brief.md` §6, risk 3).

**Neutral**
- Switching source later touches only `src/server/`, because the browser sees only `/api/rates` (repo ADR-0001).
- The response shape is an observation, not a published guarantee, so `zod` treats any change as an untrusted answer (spec AC-12).

## Links

- Spec: [[../spec.md]]
- SAD: [[../sad.md]] §4
- Related ADR: [[0004-one-hour-fetch-cache-dropping-untrusted-answers]]
