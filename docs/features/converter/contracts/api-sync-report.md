# API sync report — converter

**Contract:** `openapi.yaml`, version 0.1.0, one operation: `GET /api/rates` (`getRate`).
**Result:** all four drift points pass, with no flags. No `events.md` exists, because the feature has no async flows (`sad.md` §8, Events).
**Inputs:** `data-model.md` (present; it records that the feature changes no schema), `sad.md` §5, §6 and §8, `spec.md` §4, §5 and §6.1, feature ADRs 0001 to 0007, `CONTEXT.md` and `CLAUDE.md`.

## Section A — field origins

| schema_path | origin | confidence |
|---|---|---|
| `getRate.query.base` | data-model.md → `currency_pair.base`; required by flow 8 | high |
| `getRate.query.quote` | data-model.md → `currency_pair.quote`; required by flow 8 | high |
| `getRate.200.base` | data-model.md → `rate.base` | high |
| `getRate.200.quote` | data-model.md → `rate.quote` | high |
| `getRate.200.rate` | data-model.md → `rate.rate`; ADR-0006 | high |
| `getRate.200.date` | data-model.md → `rate.date` | high |
| `getRate.400.error.code` | ADR-0007 → `invalid_pair`, status 400; flow 8 | medium |
| `getRate.400.error.message` | `CLAUDE.md`, Errors; `sad.md` §8, fixed developer text | medium |
| `getRate.502.error.code` | ADR-0007 → `rate_unavailable`, status 502; flows 2, 3 and 7 | medium |
| `getRate.502.error.message` | `CLAUDE.md`, Errors; `sad.md` §8, fixed developer text | medium |
| `getRate.*.header.Cache-Control` | `sad.md` §8, Browser cache; AC-13c | medium |

The medium rows are response-only values with no field in `data-model.md`. No row is low. The `message` strings in the examples are this contract's proposal, because no source fixes their wording. The screen never shows them.

**Schema names.** `SupportedCurrency` and `DailyReferenceRate` use the `CONTEXT.md` glossary terms. `data-model.md` calls the same shapes `Currency` and `rate`, and its field names are kept as they are.

## Section B — drift findings

1. **Endpoint ↔ data-model (core): ✓** `getRate` reads `currency_pair` from the query and answers `rate`. `stored_answer` has no endpoint on purpose: the framework owns it, and the app only sets request options and drops entries (ADR-0004).
2. **Error code ↔ repo error definition (core): ✓** No error registry found, because `src/` has no such code yet. The codes are the contract's proposal, and they come from ADR-0007 and `sad.md` §8. `implement` defines them in `src/domain/rate.ts` (`sad.md` §5). Reconcile if that list differs.
3. **Validation ↔ constraint (core): ✓** The five currencies, the plain positive decimal with no exponent form and the `YYYY-MM-DD` date all match `data-model.md`. No conflict needed the stricter value.
4. **OpenAPI ↔ sequence (supporting): ✓** See the branch table below.

### Sequence branches

| Flow and branch | Contract outcome |
|---|---|
| Flows 1, 5, 6: rate answered | 200 |
| Flow 2: a usable rate is available | 200 |
| Flow 2: the rate is unavailable | 502 `rate_unavailable` |
| Flow 3: stored within or past the refresh interval, or newly fetched, and valid | 200 |
| Flow 3: the answer fails validation | 502 `rate_unavailable` |
| Flow 3: there is no answer | 502 `rate_unavailable` |
| Flow 7: the source fails or exceeds the time limit | 502 `rate_unavailable` |
| Flow 7: the answer cannot be trusted | 502 `rate_unavailable` |
| Flow 7: the reply to the browser fails or is unexpected | No server response to describe. The browser counts it as unavailable (`sad.md` §8) |
| Flow 8: a currency is unsupported, missing or identical | 400 `invalid_pair` |
| Flow 8: both currencies are supported and different | 200, or 502 as in flow 7 |
| Flow 9: currency field or swap control | 200 or 502, as in flow 6 |
| Flow 10: another device connects | No response. The operating system refuses the connection (ADR-0005) |
| Flows 4 and 11 | No service call |

No orphan sequence and no sequence gap.

### Back-feed: spec coverage

`getRate` serves US-01, US-02, US-03 and US-05.

| Acceptance criterion | Contract coverage |
|---|---|
| AC-01, AC-05, AC-07, AC-09, AC-13c | 200: the rate, both currencies and the rate date; query parameters name the pair |
| AC-06 | 200: `date` passes through as stated by the rate source |
| AC-12 | 502, and the 200 validation rules |
| AC-13, AC-13b | 200 and 502: the answer names its pair, and the browser handles the rest |
| AC-02, AC-03, AC-04, AC-08, AC-10, AC-11, AC-14 | N/A: browser only, with no service call (flows 4, 6 and 9) |
| AC-15 | N/A: the loopback binding, outside the request and response (flow 10) |
| AC-16 | N/A: a review process (flow 11) |

US-04, US-06, US-07 and US-08 have no operation, for the same reasons.

The 400 response has no acceptance criterion. It comes from the spec §6.1 abuse case, and flow 8 already records this, so it is not a new gap.

## Deviations from the pipeline's defaults

| Default | This contract | Authority |
|---|---|---|
| `BearerAuth` global | No auth, with explicit `security: []` | Deviation by ADR-0005; `sad.md` §8, Authentication |
| Envelope `{code, message, details?}` | `{ "error": { "code", "message" } }`, no `details` | Deviation by ADR-0007; `CLAUDE.md`, Errors |
| `code` as `module.error_name` | `invalid_pair`, `rate_unavailable` | Deviation by ADR-0007 |
| URL versioning `/api/v1/...` | `/api/rates` | `CLAUDE.md`, Browser to server; repo ADR-0001. ADR-0007 notes no versioning concerns |
| Production and local servers | `http://127.0.0.1:3000` only | Deviation by ADR-0005; `sad.md` §7 |

Cursor pagination and `Idempotency-Key` do not apply: there is no list and no mutating operation.

## Follow-up notes for `implement`

- **Rules the schema cannot state.** The route and its tests must enforce these: `base` differs from `quote` (400), and a 200 reply names the requested pair. `format: date` is only an annotation for most validators, so `zod` has to reject a date such as `2026-02-30`.
- **Unexpected exceptions.** The contract defines no 500. The route should answer any failure of its own, including one while dropping a stored answer, as 502 `rate_unavailable`. Anything that still escapes counts as unavailable in the browser (flow 7).

## Lint and schema checks

- `spectral lint` with `spectral:oas`: 0 errors, 1 warning (`info-contact`). The warning is accepted, because the app has one owner and no outside consumers. Spectral ran from a temporary install and is not wired into the repo's checks: the project's CI does not read this file, and adding a dev dependency for one small contract is not worth it.
- All response examples validate against their schemas. The schemas also accepted 5 valid rates and rejected 16 bad ones (zero, signed, exponent form, a JSON number and others), 4 bad dates, and envelopes with the wrong code for their status, an extra field or the wrong shape.
