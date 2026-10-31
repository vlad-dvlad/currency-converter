---
id: T6
title: "Add the format check and a 100% branch threshold on src/domain to CI"
layer: "wiring"
deps: []
blocks: ["T18"]
acs: ["AC-16"]
files_hint: ["package.json", "package-lock.json", "vitest.config.mts", "eslint.config.mjs", ".github/workflows/ci.yml"]
owner: "Vlad"
estimate: "S"
context_budget: "S"
status: "done"
step: "COMMIT"
---

# T6 — Add the format check and a 100% branch threshold on src/domain to CI

## Place in the sequence

- **Blocked by:** nothing
- **Blocks:** T18 — Update the project docs and write the owner's finish-line checklist
- **Wave:** 1 — it needs no feature code, and landing it early holds the `domain` tasks to the threshold.
- **Lane:** shares `package.json` with T5; shares `package-lock.json` with T12 — serialized.

## Why (user story)

> **As an** owner
> **I want** checks that show the feature is finished and its numbers are right
> **So that** "well implemented" is not only a matter of taste
>
> — `spec.md §4, US-08, verbatim` · full text: [spec.md](../spec.md)

This task makes the automated part of the finish line fail the run when it is not met; T18 prepares the owner's manual part.

## Inlined context

> CI today runs build, test, lint and typecheck with no coverage. This feature adds `npm run format:check`, the `@vitest/coverage-v8` dev dependency and a 100% branch threshold on `src/domain/`, as spec §6 requires.
>
> — `sad.md §2, Conventions, verbatim` · full text: [sad.md](../sad.md)

> 5 of 5 pass: build, tests, lint, type check, format check
>
> — `spec.md §6, Quality gates, verbatim` · full text: [spec.md](../spec.md)

> 100% of branches in the money logic, meaning all code in `src/domain/`: amount parsing, calculation, rounding, the `< 0,01` rule and number formatting
>
> — `spec.md §6, Money logic coverage, verbatim` · full text: [spec.md](../spec.md)

> Coverage report in the same continuous integration run; coverage below the target fails the run
>
> — `spec.md §6, Money logic coverage, verbatim` · full text: [spec.md](../spec.md)

> Keep TypeScript on `~6.0` and ESLint on 9 until `eslint-config-next`'s dependencies support newer majors.
>
> — `CLAUDE.md §Version pins, verbatim` · full text: [CLAUDE.md](../../../../CLAUDE.md)

**Fallback:** insufficient or contradicted by the code → read the named file in full ([spec.md](../spec.md) · [sad.md](../sad.md) · [data-model.md](../data-model.md) · [openapi.yaml](../contracts/openapi.yaml) · [adr/](../adr/)) and follow it. Do not guess.

## Data delta

No DB changes.

## API contract

Internal — no API surface.

## Acceptance criteria

### AC-16 — happy path

> **Given** the feature is ready for the owner's review
> **When** the owner checks whether it is finished
> **Then** it counts as finished only if the build, tests, lint, type check and format check all pass, the money logic has full branch coverage, the worked examples calculated ahead of the code match, the owner has compared one pair in both directions on the running app against the rate source, has walked the screen by keyboard, has failed to open the app from another device on the same network, has read the change, and has completed the security review in §6.1
>
> — `spec.md §5, AC-16, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] Add the `@vitest/coverage-v8` dev dependency, matching the installed Vitest major — `package.json`, `package-lock.json`
- [ ] `package.json`: add the script `test:coverage` running `vitest run --coverage`
- [ ] `vitest.config.mts`: provider `v8`, `include` limited to `src/domain/**/*.ts` without test files, and a per-glob threshold of 100% branches on `src/domain/**`
- [ ] `eslint.config.mjs`: add `coverage/**` to `globalIgnores`, because the HTML report contains JavaScript that ESLint would otherwise read
- [ ] `.github/workflows/ci.yml`: replace `npm test` with `npm run test:coverage`, and add `npm run format:check`

## Edge cases

| Case | Behaviour |
|---|---|
| An untested branch in `src/domain/` | `npm run test:coverage` exits non-zero. Prove this with a temporary branch, then remove it |
| `src/domain/` holds no code yet, or only types | The run still exits 0 |
| Lint after a coverage run | Stays clean |
| `npm test` for local use | Stays as it is, with no coverage |

## Definition of Done

- [ ] `npm run test:coverage` fails on a temporary untested branch in `src/domain/` and passes once it is removed
- [ ] `.github/workflows/ci.yml` runs build, `test:coverage`, lint, typecheck and `format:check`
- [ ] `npm run format:check` passes
- [ ] every Hard Rule inlined above still holds
- [ ] `npm run lint` and `npm run typecheck` clean
