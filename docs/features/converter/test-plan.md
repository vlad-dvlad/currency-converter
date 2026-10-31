---
status: Draft
owner: "Vlad"
reviewers: []
updated_at: "2026-10-31"
feature_size: "M"
---

# Test plan — converter

One local screen converts a typed amount between two supported currencies as the owner types, and shows a result only with the rate, rate date and currencies it belongs to.

## Levels

The owner chose the level of every acceptance criterion. `sad.md` declares `backend-service` and `web-frontend`, so the UI tiers were considered. `ux-flows.md` and `screens.md` do not exist for this feature, so UI states come from the AC-13c table and the `sad.md` §6 flows.

| Level | Scope | Strategy (generic — no tool names) |
|---|---|---|
| Unit | Money logic, amount parsing, display formatting, the currency rules, validation of the source's answer, and the run command declarations. | In-memory, with literal expected values and no external dependency. |
| Integration | The server code and the rates route against the rate source; the browser client against the route's replies; the framework's stored answers in the one-time probe. | See "Integration strategy" under Test data. |
| Component | The rate state and the screen: pair changes, late replies, the nine AC-13c cells and keyboard operation. | Rendered in a simulated browser, with replies faked at the network boundary so the test controls their order. |

Not used for this feature:

- **Contract:** <!-- N/A: not selected by the owner --> The route's replies and the browser client's parsing are tested separately (T9, T10), so nothing automated catches the two sides drifting apart.
- **E2E and E2E-through-UI:** <!-- N/A: not selected by the owner; the repo has no browser test tool --> The owner's manual checks in AC-16 cover the running app (see "Manual checks" below).
- **Visual-regression:** <!-- N/A: visual polish is roadmap step 4 (spec §3) --> Approved baselines would have to be redone at that step.
- **Load:** <!-- N/A: see NFR validation -->

## AC coverage

| AC (spec.md §5) | Test name (intent-based) | Level | Task | Expected outcome |
|---|---|---|---|---|
| AC-01 | 100 at a rate of 45,436 displays 4 543,60 UAH with a decimal comma and a non-breaking space | unit | T4, T16 | The literal display string matches |
| AC-02 | Typing keeps the same rate and rate date and sends no new rate request | component | T14 | The result changes, the rate and date stay, and the rate request count stays at one |
| AC-03 | Exact arithmetic rounds half up on the worked examples | unit | T3, T16 | 1,50 at 1,23 gives 1,85, and 1,15 at 1,1 gives 1,27 |
| AC-04 | A non-zero amount that rounds to zero displays as below the minimum | unit | T3, T4, T16 | 0,10 at 0,022009 displays `< 0,01 USD`, never `0,00 USD` |
| AC-05 | The rate displays every published digit with no grouping or rounding | unit | T4 | The literal string `1 USD = 45,436 UAH` matches |
| AC-05 | The rate date displays as day, month and year | unit | T4 | The source's date displays in the form 31.10.2026 |
| AC-06 | The rate date is rearranged without any time zone | unit | T4 | The date 29 October 2026 displays as 29.10.2026 whatever the local zone |
| AC-06 | An old rate date passes through the server unchanged | integration | T7, T8 | The rate stays usable and keeps its stated date |
| AC-07 | The supported list and default pair are fixed | unit | T1 | The list is exactly UAH, USD, EUR, GBP and PLN, and the default pair is USD to UAH |
| AC-08 | Choosing the other field's currency swaps the pair | unit | T1 | The pair never holds one currency twice, and no error results |
| AC-09 | The swap rule reverses the pair | unit | T1 | Source and target change places |
| AC-09 | Each direction gets its own rate request | integration | T8 | The new direction is requested with its own source and target, and no rate is an inverted copy |
| AC-10 | Each rejected form of amount text is refused by the same rule outcome | unit | T2 | A sign, letters, two separators, three decimals, spaces and 13 whole digits are all rejected, with one outcome |
| AC-11 | Unfinished and simple amount text reads as specified | unit | T2 | Empty and a lone separator are neither valid nor rejected; `12,`, `1,5`, `1.5`, `,5`, `.5` and `007` read as specified |
| AC-11 | A zero amount displays as zero | unit | T3, T4 | `0` gives 0,00 |
| AC-12 | Each untrusted form of the source's answer is refused | unit | T7 | Unexpected form, missing, zero or negative rate, another pair, and missing or invalid date are all untrusted; date age alone is not |
| AC-12 | A failing or silent rate source yields no rate | integration | T8 | Another status, a network error and no answer within the time limit each fail, with a named reason |
| AC-12 | An untrusted answer is dropped from storage | integration | T8 | The stored answer for that pair is dropped |
| AC-12 | The route hides every upstream failure behind its fixed failure answer | integration | T9 | The caller gets the stable failure with fixed text and no text from the rate source |
| AC-12 | An unexpected reply reaches the browser client as unavailable | integration | T10 | The client resolves as unavailable and never throws |
| AC-12 | Stored answers behave as designed on a production build (one-time probe) | integration | T17 | A stored rate is reused and survives a source outage past its interval, an untrusted one is dropped, and with nothing stored the rate is unavailable |
| AC-13 | Changing the pair removes the old numbers at once | component | T11, T13 | Old result, rate and date disappear in the same render, and a dash shows, never the unavailable message |
| AC-13b | A late rate for an earlier selection is ignored | component | T11 | Only the selected pair's rate and date show |
| AC-13b | A late failure for an earlier selection is ignored | component | T11 | The selected pair's state stays unchanged |
| AC-13c | Each of the nine amount and rate combinations shows what the table states | component | T14 | All nine cells match, one test per cell, and a result appears only with a valid amount and a ready rate |
| AC-13c | Returning to an earlier pair requests the rate again, and no timer refreshes it | component | T11 | A new request is made on return, and none happens while the screen sits open |
| AC-14 | Every control is reachable and operable by keyboard, with a Ukrainian label | component | T12 | Tab reaches all four controls, Enter and Space use the swap control, each field is labelled, and codes stay as they are |
| AC-15 | Both documented run commands bind to the loopback address | unit | T5 | The development and production commands both carry the loopback binding |
| AC-16 | Worked examples match values calculated ahead of the code | unit | T16 | Literal expected values, with no code shared with the calculation and no mocks |

## Edge cases / error paths

Error and authorization criteria have their own rows in the table above: AC-10, AC-12 and AC-15. These cases come from the spec, the data model and the task edge tables, and each runs at the level named.

**Amount text (unit, T2)**

- 12 whole digits → expected: valid.
- 13 whole digits → expected: rejected.
- 13 characters with leading zeros and fewer than 13 significant digits → expected: valid, because leading zeros do not count.
- `1,000` → expected: rejected, because it has three decimals.

**Rounding and display (unit, T3, T4)**

- 0,01 at a rate of 0,5, exactly 0,005 → expected: rounds up and displays 0,01, not the below-minimum form.
- 0,01 at a rate of 0,49 → expected: displays `< 0,01`.
- 999,99 and 1 000,00 → expected: no separator in the first, and a non-breaking space in the second.

**The source's answer (unit, T7)**

- An empty list or more than one item → expected: untrusted.
- A rate date that is not a real calendar date, such as 30 February → expected: untrusted.
- A very small rate, such as 0.0000001 → expected: passed on as a plain decimal with no exponent form.

**Rate source failures (integration, T8)**

- A successful status with a body that cannot be parsed → expected: untrusted, and the stored answer is dropped.
- Dropping the stored answer fails → expected: the route answers with its fixed failure.
- Text in an upstream error body → expected: never part of the returned value.

**Refused pair, spec §6.1 (integration, T9)**

- An unsupported, missing or identical currency → expected: refused, with the rate source never reached.

**Privacy, spec §6.1 (integration, T10)**

- A rate request from the browser → expected: it names only the pair, and the amount is never sent.

## Task-level checks

The table above holds the levels the owner chose. T12, T13, T14 and T15 also require component tests in their Definition of Done, and the owner kept those requirements, so `implement` writes these tests too. They cover what the chosen levels cannot see on screen:

- **AC-01, AC-04 (T14):** `4 543,60 UAH` and `< 0,01 USD` appear on screen.
- **AC-05, AC-06, AC-12 (T13):** the rate, rate date and unavailable message appear with literal strings.
- **AC-07 (T12, T15):** the screen opens on USD to UAH with an empty amount and the five currencies in each field.
- **AC-08, AC-09 (T12, T13):** both swap paths work on screen, the amount stays, and the new direction is requested.
- **AC-10, AC-11 (T14 edge table):** rejected text stays in the field, one message shows, and `0` shows 0,00.
- **AC-12 (T13):** typing an amount makes no new attempt.

## Manual checks

These are not tests, so they have no level. The owner performs them during `review`, and T18 lists them in `_audit/finish-line.md`.

- **AC-14:** walk the whole screen by keyboard. This is the only check that focus is actually visible, because a simulated browser cannot show it.
- **AC-15:** fail to open the app from another device on the same network. The automated row only reads the run commands. T5 also checks the listener once, on the production command only, so the development command's real binding rests on its declared flag and on this check if run under that command.
- **AC-16:** compare one pair in both directions against the rate source, read the change, and complete the security review in spec §6.1.
- **AC-16 (T6):** the five gates and the coverage threshold are enforced by the continuous integration run, not by a test row. T6 shows once that an untested branch fails the run.

## Test data

- **Seed strategy:** plain literal values next to the tests that use them, following "Test fixtures" in `data-model.md`: a valid answer for a pair, one untrusted answer per AC-12 form, and each source failure. There are no seeds and no personal data.
- **Worked examples:** expected values are written by hand ahead of the code and share no code with the calculation (spec §6).
- **Time:** tests that depend on the date pin the clock, and the time limit test does not wait the full five seconds, so results do not depend on when the suite runs.
- **Integration strategy:** the app has no datastore to run in a throwaway container, and project rules forbid tests from calling the real rate source.
  - Automated tests run the real server code and route, with the rate source faked at the network boundary. Unhandled requests fail the test.
  - The framework's stored answers are inactive in these tests, and the call that drops an entry is replaced (`sad.md` §8). This is a deliberate exception to using a real dependency.
  - T17 covers that gap: it runs the production build with its real stored answers against a throwaway local stand-in for the rate source. It is manual, so continuous integration will not notice a change in stored-answer behaviour. Repeat it after a major framework upgrade.
- **Cleanup boundary:** per test. Fakes and the rendered screen are reset after each test, by the existing test setup. The T17 probe deletes the stored answers between scenarios, and leaves no change in `src/`.

## NFR validation (load)

<!-- N/A: no numeric NFR -->

Spec §6 sets no latency, throughput or availability target, because the owner declined them for a local app with one user, so there is no load scenario. The numbers §6 does carry are verified this way:

| NFR (spec §6) | Target | Verified by |
|---|---|---|
| Arithmetic accuracy | 100% of the worked examples match | Unit rows for AC-01, AC-03, AC-04 and AC-16 (T16) |
| Quality gates | 5 of 5 pass | The continuous integration run on the final change (T6) |
| Money logic coverage | 100% of branches in `src/domain/` | A coverage threshold that fails the run (T6) |
| Rate refresh | Due for refresh at most 24 hours after receipt | An integration test that reads the interval declared on the rates request (T8) |

## CI placement

- **On every PR:** all unit, integration and component tests, because they are fast and share one run with the five gates and the coverage threshold (T6).
- **Before review:** the owner's manual checks (T18).
- **Once, and after a major framework upgrade:** the T17 stored-answer probe. It needs a production build and temporary edits, so it stays out of the pipeline.
