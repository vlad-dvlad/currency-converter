---
status: Accepted
owner: "Vlad"
reviewers: []
updated_at: "2026-10-31"
feature_size: "M"
ticket: ""
---

# 0002 — Prerender a static page and fetch the rate from a client component

- **Status:** Accepted
- **Date:** 2026-10-31
- **Deciders:** Vlad, with Claude proposing during `design`

## Context

The `web-frontend` surface needs a delivery choice. When the app opens, the form can appear at once with a dash while the rate is requested, or the server can send the page with the first rate already in it. The choice sets how many paths a rate has to the screen, and so how many places must handle the failures in spec AC-12.

## Decision drivers

- Top quality goal 2, never misleading: one path for a rate means one route for its failures.
- The browser reaches the server only through `/api/rates` (`CLAUDE.md`, Browser to server).
- The app requests the rate when it opens and shows a dash until it arrives (spec AC-13, AC-13c).

## Considered options

1. **Static page with a client component** — `src/app/page.tsx` is prerendered at build time and renders a client component from `src/ui/`, which requests the rate through `/api/rates`.
2. **Server renders the first rate** — `page.tsx` calls `src/server/` on each request and passes the USD to UAH rate to the client component.
3. **Client-only screen** — the form renders only after JavaScript loads, through `next/dynamic` with `ssr: false`.

## Decision outcome

**Chosen:** Option 1. A rate has one path to the screen, and the build needs no network. Option 2 is workable and would show the rate at once, but it adds a second path and a second failure branch, makes the page wait on a slow rate source, and departs from the client `fetch` in `docs/architecture-map.md` §Frontend. Option 3 shows an empty page on opening and gains nothing over Option 1, which also sends no rate from the server.

## Consequences

**Positive**
- `server` normalizes every rate failure, and `src/ui/` shows it as one screen state, on one path.
- `next build` works with the rate source unreachable, which keeps CI independent of it.
- The form is in the page's first HTML.

**Negative**
- The owner sees a dash for a moment on every opening, which spec AC-13c expects.

**Neutral**
- State is plain React state, with no store, data-fetching library or routing, as `docs/architecture-map.md` §Frontend records.
- Moving to Option 2 later would be a contained change in `src/app/` and `src/ui/`, plus an update to `docs/architecture-map.md` §Frontend.

## Links

- Spec: [[../spec.md]]
- SAD: [[../sad.md]] §4
- Related ADR: [[0001-two-surfaces-in-one-nextjs-process]]
