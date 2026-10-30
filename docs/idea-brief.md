---
status: Draft
owner: "Vlad"
updated_at: "2026-10-30"
depth: "medium"
---

# Idea brief — currency-converter

## 1. Raw idea

Хочу створити свій власний конвертор валют. Раніше такі задачі ніколи не виконував, хочу своє рішення. Це більше експериментальний і навчальний проект, але хочу щоб він був добре реалізований

## 2. Problem

There is no external user problem: the owner has never built this kind of task and wants to learn by building their own converter (owner-reported). Learning goals, selected by the owner: integrating an external API, exact money calculations, and a user interface.

The owner defines "well implemented" as a well-built UI, a pleasant UX, and clean, easy-to-read code (owner-reported). These are subjective qualities with no measurable threshold agreed so far.

## 3. Users

The owner is the only user and operator; the converter runs locally on their own machine (owner decision, accepted recommendation). No other users or segments are in view.

## 4. Why now

No external trigger or deadline established. The motivation is learning and experimentation: the owner has never built this kind of task and wants their own solution (owner-reported).

## 5. Out of scope

Confirmed by the owner:

- **Separate backend:** the owner expected it could be skipped, and the keyless rate sources in §6 make that feasible.
- **Public deployment:** the owner is the only user, and deployment is not a learning goal.
- **User accounts, rate charts, and rate history:** excluded to keep the first version to one screen and leave time for UI and code quality.
- **Real-time rates:** the owner accepted daily rates, which keep the app free of keys and a server.

Constraint: runs locally on the owner's machine, in a browser.

## 6. Risks

1. **"Well implemented" has no agreed threshold (weakest assumption).** A well-built UI, a pleasant UX, and readable code are judged only by the owner, so the project has no objective finish line. Specify should turn them into checkable criteria. Assumption; reversible.
2. **A "precise" result is limited by the published rate.** Correct arithmetic and rounding are in the owner's control, but a daily reference rate can differ from what a bank or exchange charges. The UI has to present the result as a reference value with its rate date. Inference from the sources below.
3. **One external source, no server in between.** If the rate source changes or goes down, or rate-limits the client, conversion cannot refresh. Alternatives exist in the ledger, and adding a backend later stays possible. Hypothesis, not an observed failure.

Evidence ledger:

| Claim / question | Class | Source / origin | Finding / limit |
|---|---|---|---|
| A separate backend is not needed | owner-reported hypothesis, feasibility source-verified | Owner; checks below | Feasible for a local browser client: the sources below need no key and allow cross-origin requests |
| Frankfurter needs no key and has no daily or monthly caps | source-verified | https://frankfurter.dev/ (2026-10-30) | Abuse rate limiting still applies; its threshold is not stated. Rates update daily |
| Frankfurter can be called from a browser and covers UAH | source-verified | `GET https://api.frankfurter.dev/v2/rates?base=USD&quotes=UAH,EUR` with an `Origin` header (2026-10-30) | Returned `access-control-allow-origin: *` and a UAH rate. The v1 `latest` endpoint returned no UAH |
| Open ExchangeRate-API is a keyless alternative | source-verified | https://www.exchangerate-api.com/docs/free and `GET https://open.er-api.com/v6/latest/USD` (2026-10-30) | Allows cross-origin requests and includes UAH, but requires attribution, forbids redistribution, and returns HTTP 429 when rate limited |
| The National Bank of Ukraine API allows browser calls | source-verified | `GET https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json` with an `Origin` header (2026-10-30) | Returned `access-control-allow-origin: *`. Terms and coverage were not inspected |

Limits: these are one-time checks on a single date, not guarantees of availability. No independent critique was run, because a local, single-user learning project has no material access, data, or public-contract risk.

## 7. Recommendation

**Direction (accepted by the owner):** a local browser app with no backend and one screen: an amount, two currencies, a precise result, the date of the daily rate, and clear loading and error states.

**Intended result:** the owner gets working practice in external API integration, exact money calculations, and UI, in a converter they judge to have a good UI, a pleasant UX, and readable code.

**Major tradeoff (accepted):** daily reference rates instead of real-time ones, in exchange for no keys, server, or hosting.

**Alternatives rejected:**

- Real-time rates: would likely need a separate provider with a key (not verified) and would reopen the backend decision. The learning goals do not require them.
- Public or shared deployment: adds hosting and rate-limit exposure that serve no chosen learning goal.

**Proposals, not owner decisions:** Frankfurter as the first source to evaluate; choosing the technology stack during design.

Outcome: ready-for-specify

**Next action:** run `/sdd:specify currency-converter`.

## 8. Open questions

| Unknown | Consequence | Blocking? | Verification action | Owner |
|---|---|---|---|---|
| Which currencies must the app support? | Determines source fit: the Frankfurter v1 `latest` endpoint lacks UAH, v2 includes it | Nonblocking | Decide in specify | Vlad |
| What checkable criteria define a good UI, a pleasant UX, and readable code? | Without them, "done" stays a matter of taste | Nonblocking | Define in specify | Vlad |
| What happens when rates cannot be loaded? | Shapes the error state and whether the last rates are stored | Nonblocking | Decide in specify | Vlad |
| Which technology stack? | The owner has not stated one; it sets what they practise | Nonblocking | Decide in design | Vlad |
