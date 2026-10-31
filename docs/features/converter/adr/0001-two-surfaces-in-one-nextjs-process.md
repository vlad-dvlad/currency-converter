---
status: Accepted
owner: "Vlad"
reviewers: []
updated_at: "2026-10-31"
feature_size: "M"
ticket: ""
---

# 0001 — Declare backend-service and web-frontend as two surfaces of one Next.js process

- **Status:** Accepted
- **Date:** 2026-10-31
- **Deciders:** Vlad, with Claude proposing during `design`

## Context

The converter has a screen in the browser and a route handler between that screen and the rate source (repo ADR-0001). Later pipeline stages read the declared surfaces to decide what to produce: an API contract, a `ui` task layer, UI test tiers and screen states. They need one recorded answer, because the two parts share a process but not a contract.

## Decision drivers

- Failures of the rate source must reach the screen only as stable codes, never as raw text (spec AC-12, `CLAUDE.md` Errors), which makes the endpoint a contract worth stating.
- The screen's states are the core of the feature (spec AC-13c).
- No separate backend to run (repo ADR-0001, `docs/idea-brief.md` §5).

## Considered options

1. **`[backend-service, web-frontend]`** — both parts are declared, so `/api/rates` gets a contract and the screen gets its own task layer and test tiers.
2. **`[web-frontend]` only** — the route handler counts as an implementation detail of the screen, and no API contract is written.

## Decision outcome

**Chosen:** Option 1. The error envelope and the failure codes are a real contract between `server` and `ui`, and writing them down makes them checkable. Both surfaces still run as one Next.js process.

## Consequences

**Positive**
- The `api` stage describes `/api/rates`, and the error format becomes something a test can hold to.
- `tasks`, `plan-tests` and `screens` produce the UI layer and states without having to infer them.

**Negative**
- One contract document for one endpoint is slightly more than a project this size strictly needs.
- Two surfaces add test tiers compared with a single one.

**Neutral**
- Both surfaces deploy together, so the contract can change without versioning.
- Removing the backend surface later would follow a move to a browser-only client, which repo ADR-0001 already describes as costly.

## Links

- Spec: [[../spec.md]]
- SAD: [[../sad.md]] §4
- Related ADR: [[0002-static-page-with-client-rate-fetching]]
