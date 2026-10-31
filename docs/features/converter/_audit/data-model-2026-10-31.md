# Data-model audit — converter (2026-10-31)

**Outcome:** no schema change, so `data-model.md` is minimal and zero migrations are staged. This is a valid outcome for this stage.

## Staged migrations

None. `docs/features/converter/migrations/` does not exist, and the repo has no live `migrations/` tree. Migrations are staged, not applied, in this pipeline, but here there is nothing for `implement` to promote, so `tasks` needs no `layer: migration` task.

**Promote-time hint:** not applicable. `migration_tool` is empty in `docs/architecture-map.md`.

## Conventions derived

| Topic | Source | Result |
|---|---|---|
| Persistence | Repo ADR-0003, `sad.md` §2, §5 and §8, `CLAUDE.md` | No datastore. The only server-side state is the Next.js `fetch` cache |
| Migration tool and naming | `docs/architecture-map.md` §Conventions | None |
| IDs, audit columns, delete strategy, constraints | `sad.md` §8, repo ADR-0003 | Not applicable, because the app has no entities of its own |
| Index candidates | `sad.md` §6, flows 5 and 7 | Both persist notes name the framework's stored answer, so neither yields an index |

Architecture and repo agree: `src/` has no datastore code. The `sad.md` §6 flag for `data-model` says the same.

## Convention deviations

None.

## Decisions made here

- **`rate` field names:** `base`, `quote`, `rate` and `date`, following the source's names. ADR-0006 fixes only the form of `rate`, and `api` fixes the names in the contract.
- **`rate` string form:** plain positive decimal with no exponent form. ADR-0006 requires a positive decimal. This adds the exponent rule, because JavaScript writes numbers below 0.000001 in exponent form when it turns them into strings. No rate seen so far is near that size.

## Drift findings

None. `src/domain/` and `src/server/` hold only `.gitkeep`, so no code exists to compare with this document. No `_drift/` files were written.

## Breaking-change decompositions

None.

## TBD markers

None.

## Self-check

| Check | Result |
|---|---|
| Naming matches the repo's convention | Pass, with no SQL identifiers to check |
| Down reversibility | Pass, with no migrations |
| FK indexes | Pass, with no foreign keys |
| Convention adherence | Pass: no schema, as repo ADR-0003 requires |

## Next stage

`/sdd:api converter`. `/api/rates` is a new endpoint, so the `api` stage applies.
