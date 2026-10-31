# Tracker — converter

> Status of every task in the epic. `implement` updates **Status** and **Step** after every
> subagent it runs (and commits them with the task), so this table shows where the run is right now.
> Status: `todo` · `in_progress` · `blocked` · `review` · `done`.
> Step: `SELECT` · `RED` · `GREEN` · `REFACTOR` · `GATE` · `REVIEW` · `COMMIT` (`—` before the task starts).
> A `blocked` row carries its reason in Step, e.g. `GATE — lint red after 3 retries`.

| # | Task | Layer | Owner | Estimate | Blocked by | Status | Step |
|---|---|---|---|---|---|---|---|
| T1 | Define supported currencies, the currency pair, the choice rule and shared rate types | domain | Vlad | S | — | done | COMMIT |
| T2 | Parse typed amount text into empty, valid or rejected | domain | Vlad | S | — | done | COMMIT |
| T3 | Compute the reference result with exact arithmetic, half-up rounding and the below-minimum rule | domain | Vlad | S | — | done | COMMIT |
| T4 | Format the result, rate and rate date as displayed | domain | Vlad | S | T1, T3 | done | COMMIT |
| T5 | Bind the documented run commands to the loopback address | wiring | Vlad | S | — | done | COMMIT |
| T6 | Add the format check and a 100% branch threshold on src/domain to CI | wiring | Vlad | S | — | done | COMMIT |
| T7 | Validate the rate source's answer into a rate, rejecting every untrusted form | infra | Vlad | S | T1 | done | COMMIT |
| T8 | Request the rate with the time limit and cache options, and drop untrusted answers | infra | Vlad | M | T7 | done | COMMIT |
| T9 | Answer GET /api/rates with the rate or the error envelope | ports | Vlad | S | T1, T8 | done | COMMIT |
| T10 | Request the rate from the browser and validate the reply | ui | Vlad | S | T1 | done | COMMIT |
| T11 | Hold the rate state tied to the selected pair | ui | Vlad | M | T10 | done | COMMIT |
| T12 | Build the converter form with its fields, swap control and Ukrainian text | ui | Vlad | M | T1 | todo | — |
| T13 | Show the rate, rate date, dash and unavailable message on the screen | ui | Vlad | M | T4, T11, T12 | todo | — |
| T14 | Derive and show the reference result, the label and the amount message | ui | Vlad | M | T2, T3, T4, T13 | todo | — |
| T15 | Render the converter from the static page and set the document language | wiring | Vlad | S | T14 | todo | — |
| T16 | Check the worked examples from typed text to displayed string | tests | Vlad | S | T2, T3, T4 | todo | — |
| T17 | Probe the stored-answer behaviour on the production build | tests | Vlad | S | T9 | todo | — |
| T18 | Update the project docs and write the owner's finish-line checklist | docs | Vlad | S | T5, T6, T15, T16, T17 | todo | — |

**Total:** 18 tasks, ~5.75 person-days.
