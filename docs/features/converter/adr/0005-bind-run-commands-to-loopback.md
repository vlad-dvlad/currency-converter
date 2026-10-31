---
status: Accepted
owner: "Vlad"
reviewers: []
updated_at: "2026-10-31"
feature_size: "M"
ticket: ""
---

# 0005 — Bind the documented run commands to the loopback address

- **Status:** Accepted
- **Date:** 2026-10-31
- **Deciders:** Vlad, with Claude proposing during `design`

## Context

Spec AC-15 requires that another device on the same network cannot reach the app at all, for every documented run command, and this is the feature's one access rule (spec §6.1). `next dev` and `next start` default to the hostname `0.0.0.0`, which listens on all network interfaces, so today the app answers to the whole network.

## Decision drivers

- Another device cannot reach the app, with no sign-in or key for the owner (spec AC-15).
- The rule is part of the blocking security review (spec §6.1, AC-16).
- The finish line should be checkable, not a matter of machine setup (spec US-08).

## Considered options

1. **Bind to `127.0.0.1` in the run scripts** — `next dev -H 127.0.0.1` and `next start -H 127.0.0.1` in `package.json`.
2. **Leave it to the operating system firewall** — the app keeps listening on all interfaces, and a macOS firewall rule blocks incoming connections.

## Decision outcome

**Chosen:** Option 1. The operating system refuses other devices before the app sees them, the rule lives in the repository, and a test can read it. Option 2 lives outside the repository, cannot be tested, and silently breaks AC-15 if the firewall is off or on a new machine.

## Consequences

**Positive**
- Two changed lines, with no code in the app.
- A test can assert the flag on both scripts, and the owner confirms it from another device (spec AC-16).

**Negative**
- Starting the framework directly, such as `npx next dev` without the flag, still listens on all interfaces. AC-15 covers documented commands only, so this stays an accepted gap (§11).

**Neutral**
- The app is opened at `http://127.0.0.1:3000` or `http://localhost:3000`.
- Reaching the app from another device, such as a phone for testing, would mean running the framework with a different hostname by hand.

## Links

- Spec: [[../spec.md]]
- SAD: [[../sad.md]] §4
- Related ADR: [[0001-two-surfaces-in-one-nextjs-process]]
