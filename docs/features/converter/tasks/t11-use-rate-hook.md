---
id: T11
title: "Hold the rate state tied to the selected pair"
layer: "ui"
deps: ["T10"]
blocks: ["T13"]
acs: ["AC-13", "AC-13b"]
files_hint: ["src/ui/use-rate.ts", "src/ui/use-rate.test.tsx"]
owner: "Vlad"
estimate: "M"
context_budget: "M"
status: "done"
step: "COMMIT"
---

# T11 — Hold the rate state tied to the selected pair

## Place in the sequence

- **Blocked by:** T10 — Request the rate from the browser and validate the reply
- **Blocks:** T13 — Show the rate, rate date, dash and unavailable message on the screen
- **Wave:** 3 — it is built on `fetchRate` from T10.
- **Lane:** own lane.

## Why (user story)

> **As an** owner
> **I want** a result to appear only when it belongs to the selected currencies
> **So that** I can trust every number on screen
>
> — `spec.md §4, US-05, verbatim` · full text: [spec.md](../spec.md)

This task guarantees that only the selected pair's rate can ever be held.

## Inlined context

> **Rate state.** `useRate(pair)` keeps each rate together with the pair it belongs to. When that pair differs from the selected one, the screen shows a dash in the same render, so an old rate never appears for even one frame (AC-13).
>
> — `sad.md §5, Rate state, verbatim` · full text: [sad.md](../sad.md)

> A change of pair cancels the earlier request with an `AbortController` and ignores any late reply to it, including a failure (AC-13b). Every change of pair starts a new request, including a change back (AC-12, AC-13c).
>
> — `sad.md §5, Rate state, verbatim` · full text: [sad.md](../sad.md)

> The screen holds only the rate of the selected pair, until the pair changes or the page reloads: an open screen never refreshes it on a timer, and returning to an earlier pair requests the rate again
>
> — `spec.md §5, AC-13c, verbatim` · full text: [spec.md](../spec.md)

**Trap (breakdown note):** comparing only the held pair with the selected one fails for A → B → A when B has not answered: the first rate for A would match again and reappear. Replace the held state as soon as the pair changes, for example by resetting it during render, so A's old rate is gone before the change back.

**Fallback:** insufficient or contradicted by the code → read the named file in full ([spec.md](../spec.md) · [sad.md](../sad.md) · [data-model.md](../data-model.md) · [openapi.yaml](../contracts/openapi.yaml) · [adr/](../adr/)) and follow it. Do not guess.

## Data delta

No DB changes. The feature has no datastore; this task works with the shape below, where "Column" means a field.

| Column | Type | Constraints | Change |
|---|---|---|---|
| `base` | `Currency` | One of UAH, USD, EUR, GBP, PLN | read-only |
| `quote` | `Currency` | One of UAH, USD, EUR, GBP, PLN; differs from `base` | read-only |
| `rate` | `string` | Plain positive decimal, no exponent form | read-only |
| `date` | `string` | Real calendar date as `YYYY-MM-DD`; its age never makes it invalid | read-only |

— `data-model.md §Entities, rate, abridged` · full text: [data-model.md](../data-model.md)

## API contract

Calls `GET /api/rates` through `fetchRate` from T10. No surface of its own.

## Acceptance criteria

### AC-13 — domain invariant

> **Given** a currency pair is selected, with or without a reference result on screen
> **When** the owner changes the pair and the new rate has not arrived yet
> **Then** any old result, rate and date disappear at once and a neutral dash appears, never the unavailable message
>
> — `spec.md §5, AC-13, verbatim` · full text: [spec.md](../spec.md)

### AC-13b — domain invariant

> **Given** the owner changed the pair more than once in quick succession
> **When** a rate or a failure for an earlier selection arrives after a later selection was made
> **Then** that rate or failure is ignored, and the screen only ever shows the rate and date of the pair currently selected
>
> — `spec.md §5, AC-13b, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] `src/ui/use-rate.ts`: `useRate(pair)` returning `{ status: 'pending' }`, `{ status: 'ready', rate }` or `{ status: 'unavailable' }`
- [ ] `src/ui/use-rate.ts`: one effect keyed on `base` and `quote`, with an `AbortController` aborted on cleanup and a check of `signal.aborted` before any state update
- [ ] `src/ui/use-rate.test.tsx`: `renderHook` with `/api/rates` faked by `server.use(...)`, controlling reply order with deferred responses

## Edge cases

| Case | Behaviour |
|---|---|
| Pair changes | `pending` in the same render, never the old rate for one frame |
| Late rate for A after a change to B | Ignored |
| Late failure for A after a change to B | Ignored: no unavailable state |
| A → B → A while B is unanswered | `pending`, then a new request for A; the first rate for A does not reappear |
| Unavailable, then a change of pair and back | `pending`, then a new request |
| The hook rerenders with an equal pair | No new request |
| Time passes on an open screen | No request: there is no timer |
| Unmount during a request | The request is aborted, and no state update follows |

## Definition of Done

- [ ] `src/ui/use-rate.test.tsx` passes for `pending` in the same render (AC-13)
- [ ] Tests pass for an out-of-order rate and an out-of-order failure (AC-13b)
- [ ] A test passes for A → B → A, with a new request and no stale rate
- [ ] every Hard Rule inlined above still holds
- [ ] `npm run lint` and `npm run typecheck` clean
