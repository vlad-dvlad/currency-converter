---
id: T17
title: "Probe the stored-answer behaviour on the production build"
layer: "tests"
deps: ["T9"]
blocks: ["T18"]
acs: ["AC-12"]
files_hint: ["docs/features/converter/_audit/cache-probe.md"]
owner: "Vlad"
estimate: "S"
context_budget: "S"
status: "todo"
step: ""
---

# T17 — Probe the stored-answer behaviour on the production build

## Place in the sequence

- **Blocked by:** T9 — Answer GET /api/rates with the rate or the error envelope
- **Blocks:** T18 — Update the project docs and write the owner's finish-line checklist
- **Wave:** 5 — it needs the working route, and nothing else depends on the screen for it.
- **Lane:** own lane.

## Why (user story)

> **As an** owner
> **I want** a result to appear only when it belongs to the selected currencies
> **So that** I can trust every number on screen
>
> — `spec.md §4, US-05, verbatim` · full text: [spec.md](../spec.md)

This task runs the framework behaviour that the design has so far only read about, and that AC-12 relies on.

## Inlined context

> One manual probe during `implement`: run the production build against a temporary local stand-in for the rate source, then confirm a stored answer is reused and an untrusted one is dropped.
>
> — `sad.md §11, stored-rate risk, verbatim` · full text: [sad.md](../sad.md)

> In development, a request with `Cache-Control: no-cache`, such as with the browser tools' "Disable cache" on, bypasses stored answers
>
> — `sad.md §11, development cache risk, verbatim` · full text: [sad.md](../sad.md)

> A stored answer past its interval is returned at once and refreshed in the background.
>
> — `adr/0004-one-hour-fetch-cache-dropping-untrusted-answers.md §Context, verbatim` · full text: [0004-one-hour-fetch-cache-dropping-untrusted-answers.md](../adr/0004-one-hour-fetch-cache-dropping-untrusted-answers.md)

> A background refresh with another status leaves the stored answer in place.
>
> — `adr/0004-one-hour-fetch-cache-dropping-untrusted-answers.md §Context, verbatim` · full text: [0004-one-hour-fetch-cache-dropping-untrusted-answers.md](../adr/0004-one-hour-fetch-cache-dropping-untrusted-answers.md)

**No URL setting exists by design.** Point the rate source URL at the stand-in with a temporary, uncommitted edit, and revert it before committing the report.

**Fallback:** insufficient or contradicted by the code → read the named file in full ([spec.md](../spec.md) · [sad.md](../sad.md) · [data-model.md](../data-model.md) · [openapi.yaml](../contracts/openapi.yaml) · [adr/](../adr/)) and follow it. Do not guess.

## Data delta

No DB changes. The feature has no datastore; this task works with the shape below, where "Column" means a field.

| Column | Type | Constraints | Change |
|---|---|---|---|
| `stored_answer` | framework entry | Under `.next/cache` | read-only (delete between scenarios) |

— `data-model.md §Entities, stored_answer, abridged` · full text: [data-model.md](../data-model.md)

## API contract

Exercises `GET /api/rates` (`200`, `502 rate_unavailable`) from `curl`.

— `contracts/openapi.yaml, operationId getRate, abridged` · full text: [openapi.yaml](../contracts/openapi.yaml)

## Acceptance criteria

### AC-12 — cross-context

> **Given** the rate source cannot provide a usable rate for the selected pair and the app's server side holds no stored rate for it (a stored rate counts as usable, even past the refresh interval in §6)
> **When** the rate request fails, gets no answer within a time limit chosen in design, or its answer cannot be trusted. An answer cannot be trusted when it has an unexpected form, its rate is missing, zero or negative, it belongs to another pair, or its rate date is missing or invalid. The age of the rate date alone never makes a rate unusable, because the date is always shown (AC-06)
> **Then** no result appears, the screen says in plain Ukrainian that the rate is unavailable and shows no technical text from the rate source, and the amount and currencies stay as they were. A new attempt happens only when the owner changes the pair, including changing a field and changing it back, or uses the swap control; typing an amount does not retry. Reloading the page starts over as in AC-07 and requests the rate for USD to UAH. Retry controls and automatic retries stay in roadmap step 3
>
> — `spec.md §5, AC-12, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] Write a small stand-in server in a temporary directory outside the repo, on a loopback port, counting requests and able to answer valid, untrusted or failing
- [ ] Temporarily point `src/server/rate-source.ts` at it, then run `npm run build` and `npm start`, deleting `.next/cache` between scenarios
- [ ] Run the scenarios in the edge table, with a temporarily shortened interval for the refresh scenarios
- [ ] Revert the temporary edits, and confirm `git diff` is empty for `src/`
- [ ] Write `docs/features/converter/_audit/cache-probe.md`: scenario, expected, observed, and the Next.js version

## Edge cases

| Case | Behaviour |
|---|---|
| Second request within the interval | 200, and the stand-in count stays at one |
| Untrusted status-200 answer | 502; the next request reaches the stand-in again, so the answer was dropped |
| Past the interval, stand-in answers another status | 200 with the stored rate and its true date |
| Past the interval, stand-in stopped | 200 with the stored rate and its true date |
| Nothing stored, stand-in stopped | 502 `rate_unavailable` |
| A scenario behaves otherwise | Record it and stop this task as blocked: do not change the code to fit. ADR-0004 and AC-12 need the owner's decision |

## Definition of Done

- [ ] `docs/features/converter/_audit/cache-probe.md` records every scenario, expected and observed, on the production build
- [ ] All scenarios match; a mismatch leaves this task `blocked` for the owner
- [ ] `git diff` shows no leftover change in `src/`
- [ ] every Hard Rule inlined above still holds
- [ ] `npm run lint` and `npm run typecheck` clean
