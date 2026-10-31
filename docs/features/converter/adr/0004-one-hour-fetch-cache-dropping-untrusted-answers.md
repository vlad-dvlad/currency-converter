---
status: Accepted
owner: "Vlad"
reviewers: []
updated_at: "2026-10-31"
feature_size: "M"
ticket: ""
---

# 0004 — Cache each pair's answer for one hour and drop answers that fail validation

- **Status:** Accepted
- **Date:** 2026-10-31
- **Deciders:** Vlad, with Claude proposing during `design`

## Context

Spec §6 requires a stored rate to become due for refresh at most 24 hours after it was received and leaves the exact interval to design. Reading `next/dist/server/lib/patch-fetch.js` in Next.js 16.4.3 showed three behaviours that matter here:

- Any answer with status 200 is stored, whatever its body holds.
- A stored answer past its interval is returned at once and refreshed in the background.
- A background refresh with another status leaves the stored answer in place.

The second and third give the spec AC-12 rule that a stored rate stays usable past the interval. The first weakens it in a rare case: a malformed answer with status 200 would stay stored, so a new attempt after a pair change would reread it without reaching the rate source.

## Decision drivers

- A new attempt after a pair change must be a real attempt (spec AC-12).
- A refresh interval of at most 24 hours (spec §6).
- A stored rate may be shown past its interval, always with its true rate date (spec §6, AC-06).
- Reused answers limit the load on the source's unstated abuse limit (spec §6.1).
- No store of the app's own: the `fetch` cache is the only server-side state (repo ADR-0003).

## Considered options

1. **One hour, dropping untrusted answers** — `next: { revalidate: 3600, tags: [<pair tag>] }`, and `revalidateTag(<pair tag>, { expire: 0 })` when `zod` rejects an answer.
2. **One hour, with no dropping** — `next: { revalidate: 3600 }` alone.
3. **24 hours, dropping untrusted answers** — the longest interval the spec allows.

## Decision outcome

**Chosen:** Option 1. A newly published rate appears within about an hour, and a bad answer blocks its pair only until the next attempt. Option 2 is a little shorter and works in normal conditions, but in that rare case it shows "unavailable" for up to an hour after the source recovers, so a new attempt would not reach the source. Option 3 saves few requests, since the source already caches its answers on its own side (`cache-control: max-age` on the response), and can leave a published rate unseen for a full day.

## Consequences

**Positive**
- While the source answers normally, each pair reaches it at most about once an hour, and repeated pair changes reuse the stored answer. While it fails, nothing new is stored, so each change of pair reaches it (§7).
- An outage of the source leaves stored rates in use, with their true dates.

**Negative**
- Tests must mock `next/cache`, because `revalidateTag` needs the Next.js request context.
- The route's cache behaviour depends on framework internals that spec §6 deliberately leaves untested (§11).
- If a malformed answer arrives during a background refresh it replaces a good stored rate, and dropping it leaves that pair with nothing stored until the next attempt (§11).

**Neutral**
- The first request after an interval ends still shows the older rate, while the refresh happens in the background.
- The interval is one constant, and the spec §6 test checks that it stays at or below 24 hours.

## Links

- Spec: [[../spec.md]]
- SAD: [[../sad.md]] §4
- Related ADR: [[0003-frankfurter-v2-one-request-per-pair]]
