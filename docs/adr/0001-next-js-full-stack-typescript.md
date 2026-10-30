---
status: Accepted
owner: "Vlad"
reviewers: []
updated_at: "2026-10-30"
feature_size: ""
ticket: ""
---

# 0001 — Build the app as one Next.js project in TypeScript, with a route handler in front of the rate source

- **Status:** Accepted
- **Date:** 2026-10-30
- **Deciders:** Vlad, with Claude proposing during `survey`

## Context

The project is a local, single-user currency converter built to learn external API integration, exact money calculations and UI (`docs/idea-brief.md` §2). The brief left the stack open and assumed a browser client calling the rate source directly. During the foundation session the owner confirmed there should be no separate backend, and asked for Next.js with a basic backend-like layer inside it that handles all errors.

## Decision drivers

- Learning goals: API integration, exact money calculations, UI (brief §2).
- No separate backend, public deployment or API keys (brief §5, §7).
- Clear loading and error states (brief §7), which the owner asked to have handled in the backend-like layer.
- Daily rates (brief §5), so repeated requests to the rate source add nothing.
- Clean, easy-to-read code (brief §2).

## Considered options

1. **Next.js with a route handler** — one project serves the page and a server-side `GET /api/rates` that calls the rate source.
2. **Browser-only client calling the rate source directly** — the brief's original direction, feasible because the sources allow cross-origin requests (brief §6).
3. **Separate backend service** — rejected by the brief's out-of-scope list and again by the owner.

## Decision outcome

**Chosen:** Option 1. It gives the owner the requested place to validate responses, cache them and normalize failures without a second service to run. Supporting picks: TypeScript `strict`, React 19, Tailwind CSS 4, `zod` at the network boundary, a `{ "error": { "code", "message" } }` error envelope, Vitest with Testing Library, jsdom and `msw`, ESLint 9 with Prettier, npm, and one GitHub Actions workflow.

## Consequences

**Positive**
- Upstream failures and response validation are handled in one place, and the browser sees only our own contract.
- A later switch of rate source stays on the server, behind `/api/rates`.
- The server-side `fetch` cache limits requests to the rate source.

**Negative**
- The app needs a running Node process rather than a static page.
- Next.js brings more framework to learn than the one screen needs.
- There is now a second network hop and an endpoint of our own to test and keep correct.
- TypeScript and ESLint are pinned below their latest majors because of lint-tool peer ranges (`docs/architecture-map.md`, Constraints).

**Neutral**
- `docs/idea-brief.md` still describes direct browser calls; this ADR supersedes that detail and the brief stays unedited.
- Frankfurter remains the proposed source, to be confirmed in specify or design.
- Moving to a browser-only client later would mean removing the route handler and redoing error handling in the client.

## Links

- Brief: [`docs/idea-brief.md`](../idea-brief.md) §2, §5, §6, §7
- Map: [`docs/architecture-map.md`](../architecture-map.md) §Stack, §Conventions
- Related ADR: [0002](./0002-layered-src-modules.md), [0003](./0003-no-persistent-datastore.md)
