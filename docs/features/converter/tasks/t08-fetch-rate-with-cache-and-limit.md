---
id: T8
title: "Request the rate with the time limit and cache options, and drop untrusted answers"
layer: "infra"
deps: ["T7"]
blocks: ["T9"]
acs: ["AC-09", "AC-12"]
files_hint: ["src/server/rate-source.ts", "src/server/rate-source.test.ts"]
owner: "Vlad"
estimate: "M"
context_budget: "M"
status: "todo"
step: ""
---

# T8 — Request the rate with the time limit and cache options, and drop untrusted answers

## Place in the sequence

- **Blocked by:** T7 — Validate the rate source's answer into a rate, rejecting every untrusted form
- **Blocks:** T9 — Answer GET /api/rates with the rate or the error envelope
- **Wave:** 3 — it calls the validation from T7 in the same file.
- **Lane:** shares `src/server/rate-source.test.ts` with T7 — serialized.

## Why (user story)

> **As an** owner
> **I want** to choose currencies from the supported list and swap them
> **So that** I reach the direction I need quickly
>
> — `spec.md §4, US-03, verbatim` · full text: [spec.md](../spec.md)

> **As an** owner
> **I want** a result to appear only when it belongs to the selected currencies
> **So that** I can trust every number on screen
>
> — `spec.md §4, US-05, verbatim` · full text: [spec.md](../spec.md)

This task obtains a usable rate for exactly the selected direction, or reports why there is none.

## Inlined context

> **Frankfurter v2, one request per pair** — `v2/rates?base=USD&quotes=UAH`, answered with exactly one rate.
>
> — `adr/0003-frankfurter-v2-one-request-per-pair.md §Considered options, option 1, verbatim` · full text: [0003-frankfurter-v2-one-request-per-pair.md](../adr/0003-frankfurter-v2-one-request-per-pair.md)

> **One hour, dropping untrusted answers** — `next: { revalidate: 3600, tags: [<pair tag>] }`, and `revalidateTag(<pair tag>, { expire: 0 })` when `zod` rejects an answer.
>
> — `adr/0004-one-hour-fetch-cache-dropping-untrusted-answers.md §Considered options, option 1, verbatim` · full text: [0004-one-hour-fetch-cache-dropping-untrusted-answers.md](../adr/0004-one-hour-fetch-cache-dropping-untrusted-answers.md)

> 5 seconds per request to the rate source, using `AbortSignal.timeout`.
>
> — `sad.md §8, Time limit, verbatim` · full text: [sad.md](../sad.md)

> Any answer with status 200 is stored, whatever its body holds.
>
> — `adr/0004-one-hour-fetch-cache-dropping-untrusted-answers.md §Context, verbatim` · full text: [0004-one-hour-fetch-cache-dropping-untrusted-answers.md](../adr/0004-one-hour-fetch-cache-dropping-untrusted-answers.md)

> As in `CLAUDE.md`, with `next/cache` mocked in `server` and route tests, because `revalidateTag` needs the Next.js request context
>
> — `sad.md §8, Tests, verbatim` · full text: [sad.md](../sad.md)

> Automated test that the rates request declares a refresh interval of at most 24 hours; the actual reuse and refresh are left to the framework's cache and are not separately tested
>
> — `spec.md §6, Rate refresh on the server side, verbatim` · full text: [spec.md](../spec.md)

> The amount is not stored and is not sent to the rate source.
>
> — `spec.md §6.1, Personal data touched, verbatim` · full text: [spec.md](../spec.md)

**Base URL:** `https://api.frankfurter.dev/v2/rates` — `docs/architecture-map.md §Constraints, Frankfurter v2, abridged` · full text: [architecture-map.md](../../../architecture-map.md)

> **Tests:** a test sits next to its source as `*.test.ts(x)`, using Testing Library and jsdom for components. Tests never call the real API: fake the rate source with `server.use(...)` from `test/msw-server.ts`. Unhandled requests fail the test.
>
> — `CLAUDE.md §Conventions, Tests, verbatim` · full text: [CLAUDE.md](../../../../CLAUDE.md)

**Fallback:** insufficient or contradicted by the code → read the named file in full ([spec.md](../spec.md) · [sad.md](../sad.md) · [data-model.md](../data-model.md) · [openapi.yaml](../contracts/openapi.yaml) · [adr/](../adr/)) and follow it. Do not guess.

## Data delta

No DB changes. The feature has no datastore; this task works with the shape below, where "Column" means a field.

| Column | Type | Constraints | Change |
|---|---|---|---|
| `url` | `string` | Names exactly one pair | added (request) |
| `tag` | `string` | One per pair | added (request) |
| `revalidate_seconds` | `number` | 3600, and at most 24 hours | added (request) |

— `data-model.md §Entities, stored_answer, abridged` · full text: [data-model.md](../data-model.md)

## API contract

Calls the rate source only: `GET https://api.frankfurter.dev/v2/rates?base=<base>&quotes=<quote>`, sending only the pair. The app's own surface is T9.

## Acceptance criteria

### AC-09 — happy path

> **Given** an amount and a currency pair are on screen
> **When** the owner uses the swap control
> **Then** the amount stays, the pair reverses, and the result uses the rate published for the new direction, never an inverted copy of the old rate
>
> — `spec.md §5, AC-09, verbatim` · full text: [spec.md](../spec.md)

### AC-12 — cross-context

> **Given** the rate source cannot provide a usable rate for the selected pair and the app's server side holds no stored rate for it (a stored rate counts as usable, even past the refresh interval in §6)
> **When** the rate request fails, gets no answer within a time limit chosen in design, or its answer cannot be trusted. An answer cannot be trusted when it has an unexpected form, its rate is missing, zero or negative, it belongs to another pair, or its rate date is missing or invalid. The age of the rate date alone never makes a rate unusable, because the date is always shown (AC-06)
> **Then** no result appears, the screen says in plain Ukrainian that the rate is unavailable and shows no technical text from the rate source, and the amount and currencies stay as they were. A new attempt happens only when the owner changes the pair, including changing a field and changing it back, or uses the swap control; typing an amount does not retry. Reloading the page starts over as in AC-07 and requests the rate for USD to UAH. Retry controls and automatic retries stay in roadmap step 3
>
> — `spec.md §5, AC-12, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] `src/server/rate-source.ts`: `getRate(pair)` returning `{ ok: true, rate }` or `{ ok: false, reason }`, with the reason naming a timeout, a source status, a network error or failed validation
- [ ] `src/server/rate-source.ts`: one exported `REVALIDATE_SECONDS = 3600` and one tag per pair
- [ ] `src/server/rate-source.ts`: on failed validation or an unparseable status-200 body, call `revalidateTag(tag, { expire: 0 })` before returning
- [ ] `src/server/rate-source.test.ts`: fake the source with `server.use(...)`, mock `next/cache`, spy on `fetch` to read `next` and `signal`
- [ ] `src/server/rate-source.test.ts`: test the time limit by spying on `AbortSignal.timeout`, asserting 5000, and returning a short signal, so the test does not wait five seconds

## Edge cases

| Case | Behaviour |
|---|---|
| Status 200 with a body that is not JSON | Untrusted: the framework has stored it, so it is dropped |
| Non-200 status | Failure with the status as reason; nothing to drop |
| Network error | Failure; nothing to drop |
| No answer in five seconds | Failure with reason timeout |
| UAH to USD after USD to UAH | A separate request with `base=UAH&quotes=USD`: never an inverted copy (AC-09) |
| Text in an upstream error body | Never part of the returned value |
| `revalidateTag` throws | The error propagates, and T9 answers it as 502 |

## Definition of Done

- [ ] `src/server/rate-source.test.ts` passes for the request URL and direction (AC-09)
- [ ] A test reads the `next` option and asserts a refresh interval of at most 24 hours (spec §6)
- [ ] Tests cover the 5000 ms limit, each failure reason and the drop on an untrusted answer (AC-12)
- [ ] every Hard Rule inlined above still holds
- [ ] `npm run lint` and `npm run typecheck` clean
