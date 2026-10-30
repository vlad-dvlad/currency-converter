---
status: Accepted
owner: "Vlad"
reviewers: []
updated_at: "2026-10-30"
feature_size: ""
ticket: ""
---

# 0003 — Run without a database, keeping rates only in the Next.js fetch cache

- **Status:** Accepted
- **Date:** 2026-10-30
- **Deciders:** Vlad, with Claude proposing during `survey`

## Context

The brief excludes user accounts, rate charts and rate history (`docs/idea-brief.md` §5), so the app has no data of its own to keep. The only data it handles is the current daily rate, fetched from an external source.

## Decision drivers

- No accounts, charts or history (brief §5).
- Time should go to UI and code quality rather than infrastructure (brief §5).
- Daily rates, so a short-lived server-side copy is enough (brief §5).

## Considered options

1. **No datastore; the Next.js `fetch` cache only** — rate responses are cached on the server with a revalidation interval.
2. **A local database such as SQLite** — would keep rates durably, with a schema and migrations to maintain.

## Decision outcome

**Chosen:** Option 1. Nothing in scope needs durable data, so a database would add a schema and migrations with no feature behind them.

## Consequences

**Positive**
- No schema, migrations or database process to run; `migration_tool` stays empty and the skeleton has no migration task.
- The app has no IDs or entities to model.

**Negative**
- The cache may be discarded, so nothing guarantees that a last known rate survives while the source is down. If specify requires that, this decision must be revisited.

**Neutral**
- Rate history, if it ever comes into scope, would need a new decision and a real datastore.
- Whether the browser also keeps the last rates is an open question for specify (brief §8).

## Links

- Brief: [`docs/idea-brief.md`](../idea-brief.md) §5, §8
- Map: [`docs/architecture-map.md`](../architecture-map.md) §Datastores, §Constraints
- Related ADR: [0001](./0001-next-js-full-stack-typescript.md)
