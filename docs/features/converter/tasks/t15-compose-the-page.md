---
id: T15
title: "Render the converter from the static page and set the document language"
layer: "wiring"
deps: ["T14"]
blocks: ["T18"]
acs: ["AC-07"]
files_hint: ["src/app/page.tsx", "src/app/page.test.tsx", "src/app/layout.tsx"]
owner: "Vlad"
estimate: "S"
context_budget: "S"
status: "done"
step: "COMMIT"
---

# T15 — Render the converter from the static page and set the document language

## Place in the sequence

- **Blocked by:** T14 — Derive and show the reference result, the label and the amount message
- **Blocks:** T18 — Update the project docs and write the owner's finish-line checklist
- **Wave:** 6 — it mounts the finished screen.
- **Lane:** own lane.

## Why (user story)

> **As an** owner
> **I want** to choose currencies from the supported list and swap them
> **So that** I reach the direction I need quickly
>
> — `spec.md §4, US-03, verbatim` · full text: [spec.md](../spec.md)

This task makes the screen what the owner sees on opening the app.

## Inlined context

> layout.tsx            document language set to Ukrainian
>
> — `sad.md §5, tree src/app/, verbatim` · full text: [sad.md](../sad.md)

> page.tsx              static server component; renders the converter
>
> — `sad.md §5, tree src/app/, verbatim` · full text: [sad.md](../sad.md)

**Static page:** `next build` works with the rate source unreachable, which keeps CI independent of it. — `adr/0002-static-page-with-client-rate-fetching.md §Consequences, abridged` · full text: [ADR-0002](../adr/0002-static-page-with-client-rate-fetching.md)

> `src/app/` — Next.js entry points. Composes `ui` and `server`, holds no business logic
>
> — `CLAUDE.md §Structure, verbatim` · full text: [CLAUDE.md](../../../../CLAUDE.md)

> Ukrainian only, with all text in `src/ui/messages.ts` and the document language set to `uk`. Currency codes stay as UAH, USD, EUR, GBP and PLN (AC-14). There is no translation library
>
> — `sad.md §8, Internationalisation, verbatim` · full text: [sad.md](../sad.md)

**Fallback:** insufficient or contradicted by the code → read the named file in full ([spec.md](../spec.md) · [sad.md](../sad.md) · [data-model.md](../data-model.md) · [openapi.yaml](../contracts/openapi.yaml) · [adr/](../adr/)) and follow it. Do not guess.

## Data delta

No DB changes.

## API contract

Internal — no API surface.

## Acceptance criteria

### AC-07 — happy path

> **Given** the owner opens the app
> **When** the screen appears
> **Then** the currency pair is USD to UAH, the amount is empty, and each currency field offers exactly UAH, USD, EUR, GBP and PLN
>
> — `spec.md §5, AC-07, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] `src/app/page.tsx`: render `Converter`, staying a server component with no client code of its own
- [ ] `src/app/layout.tsx`: set `lang="uk"`, and take the Ukrainian title and description from `src/ui/messages.ts`
- [ ] `src/app/page.test.tsx`: replace the placeholder heading test, and fake `/api/rates` with `server.use(...)`

## Edge cases

| Case | Behaviour |
|---|---|
| The old `Currency converter` heading | Replaced: its test is rewritten rather than left failing |
| `npm run build` with no network | Succeeds, because the build requests no rate |
| The first HTML | Holds the form with a dash and no rate |

## Definition of Done

- [ ] `src/app/page.test.tsx` passes for the AC-07 opening state
- [ ] `npm run build` succeeds with no network and reports `/` as static
- [ ] `<html lang="uk">` in the built page
- [ ] every Hard Rule inlined above still holds
- [ ] `npm run lint` and `npm run typecheck` clean
