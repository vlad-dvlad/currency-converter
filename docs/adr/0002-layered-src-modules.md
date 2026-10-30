---
status: Accepted
owner: "Vlad"
reviewers: []
updated_at: "2026-10-30"
feature_size: ""
ticket: ""
---

# 0002 — Organize the code into app, domain, server and ui modules, with money logic isolated in domain

- **Status:** Accepted
- **Date:** 2026-10-30
- **Deciders:** Vlad, with Claude proposing during `survey`

## Context

The owner defines "well implemented" partly as clean, easy-to-read code, and exact money calculation is a named learning goal (`docs/idea-brief.md` §2). The first version is one screen and one endpoint, so the layout has to keep those concerns apart without the ceremony of a larger architecture.

## Decision drivers

- Clean, easy-to-read code (brief §2).
- Exact money calculations that can be tested on their own (brief §2).
- One screen in the first version (brief §5), which argues against heavy layering.

## Considered options

1. **Four folders under `src/`** — `app` for routing, `domain` for pure logic, `server` for the rate source client, `ui` for components.
2. **Everything under `src/app/`** — the Next.js default, with colocated helpers.
3. **Hexagonal modules with ports and adapters** — the survey's general default for modular services.

## Decision outcome

**Chosen:** Option 1. It separates money logic, network code and components at almost no cost, whereas Option 2 lets them mix and Option 3 adds interfaces that one screen and one source would not use. Dependencies point inward: `app`, `ui` and `server` may import `domain`, and `domain` imports none of them. Inside `domain`, amounts and rates are `big.js` values, never `number` arithmetic, and `big.js` is the only dependency it uses for this.

## Consequences

**Positive**
- Money logic runs in tests with no mocks, browser or framework.
- Each folder has one reason to change, so code is easy to locate.

**Negative**
- The dependency rule is a convention until a lint rule enforces it.
- Four folders are slightly more structure than the first screen strictly needs.

**Neutral**
- `server` code must not reach client components; this boundary is checked in review unless enforced later.
- Moving to modules per feature later is a mechanical refactor.

## Links

- Brief: [`docs/idea-brief.md`](../idea-brief.md) §2, §5
- Map: [`docs/architecture-map.md`](../architecture-map.md) §Module inventory, §Conventions
- Related ADR: [0001](./0001-next-js-full-stack-typescript.md)
