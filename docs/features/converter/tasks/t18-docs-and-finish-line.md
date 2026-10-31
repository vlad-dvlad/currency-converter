---
id: T18
title: "Update the project docs and write the owner's finish-line checklist"
layer: "docs"
deps: ["T5", "T6", "T15", "T16", "T17"]
blocks: []
acs: ["AC-15", "AC-16"]
files_hint: ["CLAUDE.md", "docs/architecture-map.md", "docs/features/converter/_audit/finish-line.md"]
owner: "Vlad"
estimate: "S"
context_budget: "M"
status: "todo"
step: ""
---

# T18 — Update the project docs and write the owner's finish-line checklist

## Place in the sequence

- **Blocked by:** T5 — Bind the documented run commands to the loopback address · T6 — Add the format check and a 100% branch threshold on src/domain to CI · T15 — Render the converter from the static page and set the document language · T16 — Check the worked examples from typed text to displayed string · T17 — Probe the stored-answer behaviour on the production build
- **Blocks:** nothing
- **Wave:** 7 — it describes what was actually built, so it comes last.
- **Lane:** own lane.

## Why (user story)

> **As an** owner
> **I want** the app to open only on my own machine, with no sign-in or key
> **So that** nobody else on my network can use it
>
> — `spec.md §4, US-07, verbatim` · full text: [spec.md](../spec.md)

> **As an** owner
> **I want** checks that show the feature is finished and its numbers are right
> **So that** "well implemented" is not only a matter of taste
>
> — `spec.md §4, US-08, verbatim` · full text: [spec.md](../spec.md)

This task records the new commands and hands the owner the checks only they can perform.

## Inlined context

> `CLAUDE.md` and the architecture map need small updates once this ships: the run commands bind to loopback, and CI also runs the format check and coverage.
>
> — `sad.md §11, Accepted debt, verbatim` · full text: [sad.md](../sad.md)

> limited to the local-only access rule, the supported-currency check, and keeping rate source text off the screen.
>
> — `spec.md §6.1, Security review, verbatim` · full text: [spec.md](../spec.md)

> one pair compared in both directions against the rate source, a full keyboard walk, a failed attempt to open the app from another device on the network, the change read
>
> — `spec.md §7, Owner's manual checks, verbatim` · full text: [spec.md](../spec.md)

**Boundary:** the manual checks and the security review are the owner's, during `review` (`sad.md` §6, flow 11). This task prepares them and ticks none of them.

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

### AC-16 — happy path

> **Given** the feature is ready for the owner's review
> **When** the owner checks whether it is finished
> **Then** it counts as finished only if the build, tests, lint, type check and format check all pass, the money logic has full branch coverage, the worked examples calculated ahead of the code match, the owner has compared one pair in both directions on the running app against the rate source, has walked the screen by keyboard, has failed to open the app from another device on the same network, has read the change, and has completed the security review in §6.1
>
> — `spec.md §5, AC-16, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] `CLAUDE.md`: state that `npm run dev` and `npm start` bind to `127.0.0.1`, add `npm run test:coverage`, and list CI's five gates and the coverage threshold
- [ ] `docs/architecture-map.md`: the same CI and loopback facts, and Frankfurter as confirmed rather than proposed (ADR-0003)
- [ ] `docs/features/converter/_audit/finish-line.md`: unticked boxes for the four manual checks and the three security review items, plus the commands behind the automated gates

## Edge cases

| Case | Behaviour |
|---|---|
| Facts that changed during `implement` | The docs state what was built, not what was planned |
| `docs/architecture-map.md` `reflects_commit` | Left alone: `/sdd:survey` owns it (`sad.md` §11) |
| Manual boxes | Left unticked for the owner |

## Definition of Done

- [ ] `CLAUDE.md` and `docs/architecture-map.md` state the loopback run commands and the five CI gates
- [ ] `_audit/finish-line.md` lists the four manual checks and three security items, unticked
- [ ] The commands named in these docs all run
- [ ] every Hard Rule inlined above still holds
- [ ] `npm run lint` and `npm run typecheck` clean
