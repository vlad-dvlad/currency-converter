---
id: T5
title: "Bind the documented run commands to the loopback address"
layer: "wiring"
deps: []
blocks: ["T18"]
acs: ["AC-15"]
files_hint: ["package.json", "src/app/run-scripts.test.ts"]
owner: "Vlad"
estimate: "S"
context_budget: "S"
status: "done"
step: "COMMIT"
---

# T5 — Bind the documented run commands to the loopback address

## Place in the sequence

- **Blocked by:** nothing
- **Blocks:** T18 — Update the project docs and write the owner's finish-line checklist
- **Wave:** 1 — two script lines and a test, independent of all feature code.
- **Lane:** shares `package.json` with T6; shares `package.json` with T12 — serialized.

## Why (user story)

> **As an** owner
> **I want** the app to open only on my own machine, with no sign-in or key
> **So that** nobody else on my network can use it
>
> — `spec.md §4, US-07, verbatim` · full text: [spec.md](../spec.md)

This task delivers the one access rule of the app.

## Inlined context

> **Bind to `127.0.0.1` in the run scripts** — `next dev -H 127.0.0.1` and `next start -H 127.0.0.1` in `package.json`.
>
> — `adr/0005-bind-run-commands-to-loopback.md §Considered options, option 1, verbatim` · full text: [0005-bind-run-commands-to-loopback.md](../adr/0005-bind-run-commands-to-loopback.md)

> a test reads `package.json` and asserts the loopback flag on both run scripts. The owner also fails to open the app from another device (AC-16).
>
> — `sad.md §10, QG-5, verbatim` · full text: [sad.md](../sad.md)

> `next dev` and `next start` default to the hostname `0.0.0.0`, which listens on all network interfaces, so today the app answers to the whole network.
>
> — `adr/0005-bind-run-commands-to-loopback.md §Context, verbatim` · full text: [0005-bind-run-commands-to-loopback.md](../adr/0005-bind-run-commands-to-loopback.md)

**Fallback:** insufficient or contradicted by the code → read the named file in full ([spec.md](../spec.md) · [sad.md](../sad.md) · [data-model.md](../data-model.md) · [openapi.yaml](../contracts/openapi.yaml) · [adr/](../adr/)) and follow it. Do not guess.

## Data delta

No DB changes.

## API contract

Internal — no API surface.

## Acceptance criteria

### AC-15 — authorization

> **Given** the app is running on the owner's machine, started by any documented run command, for development or production
> **When** the owner opens it there, or another device on the same network tries to open it
> **Then** the owner gets the screen with no sign-in or key, and the other device cannot reach the app at all
>
> — `spec.md §5, AC-15, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] `package.json`: `dev` becomes `next dev -H 127.0.0.1`, and `start` becomes `next start -H 127.0.0.1`
- [ ] `src/app/run-scripts.test.ts`: reads `package.json` and asserts the flag on both scripts. Vitest only collects tests under `src/`, so the test lives here rather than at the root

## Edge cases

| Case | Behaviour |
|---|---|
| A script loses its flag | The test fails |
| `npx next dev` run directly | Accepted gap: AC-15 covers documented commands only (`sad.md` §11) |
| Another device connects | The operating system refuses the connection; the owner confirms this in AC-16, not an automated test |

## Definition of Done

- [ ] `src/app/run-scripts.test.ts` passes
- [ ] After `npm start`, `lsof -nP -iTCP:3000 -sTCP:LISTEN` shows `127.0.0.1` only
- [ ] every Hard Rule inlined above still holds
- [ ] `npm run lint` and `npm run typecheck` clean
