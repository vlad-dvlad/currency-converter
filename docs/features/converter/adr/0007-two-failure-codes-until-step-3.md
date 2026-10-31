---
status: Accepted
owner: "Vlad"
reviewers: []
updated_at: "2026-10-31"
feature_size: "M"
ticket: ""
---

# 0007 — Answer failures with two codes until roadmap step 3 needs more

- **Status:** Accepted
- **Date:** 2026-10-31
- **Deciders:** Vlad, with Claude proposing during `design`

## Context

`/api/rates` answers failures as `{ "error": { "code", "message" } }`, and `code` is a stable value the UI maps to its state (`CLAUDE.md`, Errors). This feature shows one unavailable message for every kind of failure (spec AC-12), and spec §3 places distinct kinds of failure in roadmap step 3. The contract still has to state its codes now.

## Decision drivers

- Spec §3 keeps kinds of failure out of this step.
- Raw upstream errors never reach the browser (`CLAUDE.md`, Errors).
- A refused pair is a different kind of answer from a missing rate, and spec §6.1 requires that refusal.

## Considered options

1. **Two codes now** — `invalid_pair` with status 400 and `rate_unavailable` with status 502, with the specific reason written only to the server console.
2. **One code per reason** — `invalid_pair` (400), `rate_source_timeout` (504), `rate_source_failed` (502) and `rate_source_invalid` (502), which the screen maps to one message for now.

## Decision outcome

**Chosen:** Option 1. It gives the screen exactly what it needs and keeps the step 3 boundary. Option 2 writes codes the screen does not yet distinguish, for a step whose kinds of failure are not specified yet and may turn out different.

## Consequences

**Positive**
- The contract and its tests stay small.
- The reason for a failure the route answers is still visible in the server console (§7).

**Negative**
- Roadmap step 3 has to split `rate_unavailable` into more detailed codes, which changes `server`, `ui` and the contract.

**Neutral**
- The contract has one consumer in the same repository and no versioning concerns, so that split is a contained change.

## Links

- Spec: [[../spec.md]]
- SAD: [[../sad.md]] §8
- Related ADR: [[0001-two-surfaces-in-one-nextjs-process]]
