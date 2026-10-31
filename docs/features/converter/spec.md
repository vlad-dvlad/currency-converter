---
status: Draft
owner: "Vlad"
reviewers: []
updated_at: "2026-10-31"
feature_size: "M"
---

# Spec — converter

> **Glossary:** [CONTEXT](../../../CONTEXT.md)
> **Reference module / docs / channels used:** `docs/idea-brief.md` (§2, §3, §5, §6, §7, §8), `docs/roadmap.md` (step 2, D1–D3), `docs/architecture-map.md`, `docs/adr/0001-next-js-full-stack-typescript.md`, `docs/adr/0003-no-persistent-datastore.md`.

## 1. Context

The owner is the only user of this app and runs it on their own machine. There is no external problem to solve: they have never built this kind of task and want to learn external integration, exact money calculation and interface work by building their own converter. They define "well implemented" as a well-built interface, a pleasant experience and readable code, and until now those qualities had no checkable threshold.

There is no external trigger or deadline. The project skeleton exists, and this is the first feature with visible behaviour. It is step 2 of the roadmap, and steps 3 and 4 build on the working screen it produces.

The committed approach is one local screen where the owner types an amount, chooses two currencies from a short fixed list, and sees the result update as they type, with its daily reference rate and rate date beside it. This direction was accepted in the brief (§7), which traded real-time rates for needing no key or paid provider. "Exact" here means exact arithmetic on the published rate with one fixed rounding rule. The result stays a reference value, because a bank or exchange can apply a different rate (brief §6, risk 2).

Traceability:

- Scope is roadmap step 2 only. Distinct loading presentation, kinds of failure, retries and last-known rates stay in step 3, and D3 stays open there. This spec adds one safeguard so the screen is never misleading before step 3: with no rate in hand, it shows no result.
- An independent critique of the accepted decisions (2026-10-31) surfaced the rules on amount parsing, on tying the result to the selected direction, on results that round to zero, and on an independent check of the numbers. All were decided by the owner in this session.
- Coverage was checked against the rate source proposed in the architecture map on 2026-10-31: all 20 directed pairs of the five currencies returned a rate. This is a one-time check, not a guarantee. The same check showed that a rate date belongs to an individual rate rather than to a whole response, and that each direction is published as its own rate.
- The owner explicitly did not select a responsive-layout threshold, a contrast threshold or a numeric response-time target as requirements for this feature.

## 2. Goals

- The owner can convert an amount between any two supported currencies in one screen, without pressing a convert button.
- Every number on screen can be trusted and traced: it is computed exactly and always appears with the rate, rate date and currencies it belongs to.
- "Well implemented" becomes checkable for this feature through full keyboard operation, code quality gates, and numbers verified independently of the code.

## 3. Non-goals

- Distinct loading indicators, kinds of failure, retries and last-known rates: these are roadmap step 3, built on the screen this step delivers.
- Visual polish and design system decisions: these are roadmap step 4, because the owner wants to judge them on a working screen.
- Real-time rates, accounts, rate charts, rate history and public deployment: all excluded by the brief (§5), to keep the first version to one screen.
- Currencies beyond the five on the list, including cryptocurrencies and metals: the owner chose a short list, and a daily rate would mislead for fast-moving assets.

## 4. User stories

### US-01: Convert an amount while typing

**As an** owner
**I want** to type an amount and see it converted as I type
**So that** I get the result with no extra action

### US-02: See what the result rests on

**As an** owner
**I want** to see the daily reference rate, the rate date and a reference-value label beside the result
**So that** I know what the number is based on and what it does not promise

### US-03: Choose and swap currencies

**As an** owner
**I want** to choose currencies from the supported list and swap them
**So that** I reach the direction I need quickly

### US-04: Understand a rejected amount

**As an** owner
**I want** to be told what an amount must look like when mine cannot be converted
**So that** I can correct what I typed

### US-05: Never see a misleading result

**As an** owner
**I want** a result to appear only when it belongs to the selected currencies
**So that** I can trust every number on screen

### US-06: Operate the screen by keyboard

**As an** owner
**I want** to do everything on the screen with the keyboard
**So that** I never need the mouse

### US-07: Keep the app on my machine

**As an** owner
**I want** the app to open only on my own machine, with no sign-in or key
**So that** nobody else on my network can use it

### US-08: Have a checkable finish line

**As an** owner
**I want** checks that show the feature is finished and its numbers are right
**So that** "well implemented" is not only a matter of taste

## 5. Acceptance criteria

### AC-01 (US-01) — happy path

**Given** the owner has the currency pair USD to UAH on screen and its daily reference rate is 45,436
**When** the owner types 100 as the amount
**Then** the screen immediately shows the reference result 4 543,60 UAH, with no button to press; a result always uses a decimal comma and a non-breaking space between thousands

### AC-02 (US-01) — happy path

**Given** a reference result is on screen
**When** the owner changes the amount
**Then** the result updates from the same daily reference rate and rate date, and typing never causes a new rate request of any kind

### AC-03 (US-01) — domain invariant

**Given** an amount and a daily reference rate
**When** the system computes the reference result
**Then** it uses exact decimal arithmetic and rounds to two decimal places with a half going up, so 1,50 at a rate of 1,23 shows 1,85 and 1,15 at a rate of 1,1 shows 1,27

### AC-04 (US-01) — domain invariant

**Given** a non-zero amount whose reference result would round to zero, such as 0,10 UAH at a rate of 0,022009 to USD
**When** the system shows the result
**Then** it shows `< 0,01 USD` rather than `0,00 USD`, so a small amount never looks worthless

### AC-05 (US-02) — happy path

**Given** a reference result is on screen
**When** the owner reads it
**Then** the daily reference rate in the form `1 USD = 45,436 UAH`, with every digit as published, a decimal comma, no thousands grouping and no rounding, the rate date in the form 31.10.2026, and a label in Ukrainian saying this is a reference value all appear beside it (the rate and date also appear without a result, per AC-13c)

### AC-06 (US-02) — cross-context

**Given** the rate source's latest rate for the selected pair is dated 29 October 2026
**When** the owner sees the result on a later day
**Then** the screen shows 29.10.2026 as the rate date, never today's date

### AC-07 (US-03) — happy path

**Given** the owner opens the app
**When** the screen appears
**Then** the currency pair is USD to UAH, the amount is empty, and each currency field offers exactly UAH, USD, EUR, GBP and PLN

### AC-08 (US-03) — domain invariant

**Given** a currency pair is selected
**When** the owner chooses for one field the currency already in the other field
**Then** the two fields swap, so a currency pair never holds the same currency twice and no error appears

### AC-09 (US-03) — happy path

**Given** an amount and a currency pair are on screen
**When** the owner uses the swap control
**Then** the amount stays, the pair reverses, and the result uses the rate published for the new direction, never an inverted copy of the old rate

### AC-10 (US-04) — error

**Given** the owner is typing an amount
**When** the text has a minus or plus sign, letters, two separators, more than two digits after the separator such as `1,000`, spaces, or more than 12 digits before the separator, not counting leading zeros
**Then** the text stays in the field as typed rather than being blocked, no result appears, and one general message in plain Ukrainian explains what the amount must look like; the same message serves every rule

### AC-11 (US-04) — happy path

**Given** the owner is partway through typing
**When** the amount field holds an unfinished or simple value
**Then** an empty field or a lone separator shows neither a result nor an error, `12,` reads as 12, `1,5` and `1.5` read the same, `,5` and `.5` read as 0,5, `007` reads as 7, and `0` shows 0,00

### AC-12 (US-05) — cross-context

**Given** the rate source cannot provide a usable rate for the selected pair and the app's server side holds no stored rate for it (a stored rate counts as usable, even past the refresh interval in §6)
**When** the rate request fails, gets no answer within a time limit chosen in design, or its answer cannot be trusted. An answer cannot be trusted when it has an unexpected form, its rate is missing, zero or negative, it belongs to another pair, or its rate date is missing or invalid. The age of the rate date alone never makes a rate unusable, because the date is always shown (AC-06)
**Then** no result appears, the screen says in plain Ukrainian that the rate is unavailable and shows no technical text from the rate source, and the amount and currencies stay as they were. A new attempt happens only when the owner changes the pair, including changing a field and changing it back, or uses the swap control; typing an amount does not retry. Reloading the page starts over as in AC-07 and requests the rate for USD to UAH. Retry controls and automatic retries stay in roadmap step 3

### AC-13 (US-05) — domain invariant

**Given** a currency pair is selected, with or without a reference result on screen
**When** the owner changes the pair and the new rate has not arrived yet
**Then** any old result, rate and date disappear at once and a neutral dash appears, never the unavailable message

### AC-13b (US-05) — domain invariant

**Given** the owner changed the pair more than once in quick succession
**When** a rate or a failure for an earlier selection arrives after a later selection was made
**Then** that rate or failure is ignored, and the screen only ever shows the rate and date of the pair currently selected

### AC-13c (US-05) — domain invariant

**Given** the app requests the rate when it opens and after every change of pair, whatever the amount holds
**When** the screen shows any combination of amount and rate
**Then** the rate and the amount are presented independently, and a reference result appears only with a valid amount and a ready rate. The screen holds only the rate of the selected pair, until the pair changes or the page reloads: an open screen never refreshes it on a timer, and returning to an earlier pair requests the rate again:

| Amount | Rate not arrived yet | Rate ready | Rate unavailable |
|---|---|---|---|
| Empty | Dash, no result, no amount error | Rate and rate date, no result, no amount error | Unavailable message, no result, no amount error |
| Valid | Dash, no result | Result, rate, rate date and reference-value label | Unavailable message, no result |
| Rejected | Dash, amount explanation, no result | Rate and rate date, amount explanation, no result | Unavailable message, amount explanation, no result |

### AC-14 (US-06) — happy path

**Given** the owner is using only the keyboard
**When** the owner moves through the screen
**Then** the amount, both currencies and the swap control can all be reached and operated, focus is always visible, and every field has a label in Ukrainian; currency codes stay as UAH, USD, EUR, GBP and PLN

### AC-15 (US-07) — authorization

**Given** the app is running on the owner's machine, started by any documented run command, for development or production
**When** the owner opens it there, or another device on the same network tries to open it
**Then** the owner gets the screen with no sign-in or key, and the other device cannot reach the app at all

### AC-16 (US-08) — happy path

**Given** the feature is ready for the owner's review
**When** the owner checks whether it is finished
**Then** it counts as finished only if the build, tests, lint, type check and format check all pass, the money logic has full branch coverage, the worked examples calculated ahead of the code match, the owner has compared one pair in both directions on the running app against the rate source, has walked the screen by keyboard, has failed to open the app from another device on the same network, has read the change, and has completed the security review in §6.1

## 6. Non-functional requirements

| Aspect | Target | Measurement |
|---|---|---|
| Arithmetic accuracy | 100% of the worked examples in §5, calculated ahead of the code, match to the last decimal place | Automated tests with no shared code between expected values and the calculation |
| Quality gates | 5 of 5 pass: build, tests, lint, type check, format check | Continuous integration run on the final change |
| Money logic coverage | 100% of branches in the money logic, meaning all code in `src/domain/`: amount parsing, calculation, rounding, the `< 0,01` rule and number formatting | Coverage report in the same continuous integration run; coverage below the target fails the run |
| Rate refresh on the server side | A stored rate becomes due for refresh at most 24 hours after it was received; the exact interval is chosen in design. This is a refresh interval, not a limit on what can be shown: a rate past the interval may still be shown while a fresh one is obtained, or while the rate source is down, always with its true rate date | Automated test that the rates request declares a refresh interval of at most 24 hours; the actual reuse and refresh are left to the framework's cache and are not separately tested |

Latency, throughput and availability have no target here. The owner declined a numeric response-time target for this feature, and a local app with one user gives these rows nothing meaningful to measure.

## 6.1 Security / privacy

- **Data classification:** public. The only data handled is published reference rates.
- **Personal data touched:** none. The amount is not stored and is not sent to the rate source.
- **AuthZ/AuthN impact:** no accounts, sign-in or keys. The one access rule is that the app answers only on the owner's own machine (AC-15); by default it currently answers to the whole local network.
- **Abuse cases:**
  - Another device on the network opens the app: it cannot reach the app, so nobody else can use it or spend the rate source's goodwill through it.
  - A malformed or unexpected answer from the rate source: treated as no usable rate, so no result appears and no technical text reaches the screen (AC-12).
  - A currency outside the supported list is requested: refused, and the app does not pass it on to the rate source.
  - Text typed as an amount: only digits and one separator can form a valid amount (AC-10), and typed text is never used as anything but an amount.
  - Repeated pair changes reaching the rate source's unstated abuse limit: stored rates are reused for repeated requests within the interval in §6.
- **Security review:** Required (feature size M), performed by the owner during the review stage and blocking "finished" (AC-16), limited to the local-only access rule, the supported-currency check, and keeping rate source text off the screen.

## 7. Metrics / KPIs

- **Worked examples confirmed** — baseline: 0, target: all match, by the release of roadmap step 2.
- **Automated quality checks** — baseline: 4 of 5 gates run in continuous integration and coverage is not measured, target: 5 of 5 gates and 100% branch coverage of the money logic, by the release of roadmap step 2.
- **Owner's manual checks** — baseline: 0 of 4, target: 4 of 4 (one pair compared in both directions against the rate source, a full keyboard walk, a failed attempt to open the app from another device on the network, the change read), by the release of roadmap step 2.

## 8. Open questions

- [ ] Does moving through a closed currency list with the arrow keys count as choosing a currency, with a rate request and possibly a swap each time? Default now: yes, every change of the selected value counts as a choice (AC-08, AC-13b). — owner: Vlad, due: before `sdd:design`
- [ ] Is the rate source proposed in the architecture map confirmed for this feature? Default now: yes, because all 20 directed pairs returned a rate on 2026-10-31. — owner: Vlad, due: before `sdd:design`
- [ ] When rates cannot be loaded and the server side holds no stored rate for the pair, may the screen fall back to the last rate the browser received (roadmap D3)? A rate still stored on the server side is already usable under AC-12 and §6, so D3 covers only this remaining case. Default now: no, it shows no result (AC-12). — owner: Vlad, due: when roadmap step 3 is specified
