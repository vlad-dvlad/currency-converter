---
status: Living
updated_at: "2026-10-31"
---

# Domain Context — currency-converter

## Glossary

- currency pair — An ordered source currency and target currency. NOT direction-free: USD to UAH and UAH to USD are two pairs, each with its own published rate.
- daily reference rate — The rate the rate source publishes for one currency pair, updated about once a day. NOT the rate a bank or exchange actually offers.
- owner — The one person who runs and uses the app on their own machine. NOT a user account: the app has no accounts.
- rate date — The date the rate source states for one specific daily reference rate. NOT today's date or the date of the request.
- rate source — The external service that publishes daily reference rates. NOT the app's own server side, which only passes rates on.
- reference result — An amount multiplied by a daily reference rate and rounded to two decimal places. NOT the amount a bank or exchange would pay out.
- supported currency — One of UAH, USD, EUR, GBP and PLN. NOT every currency the rate source publishes.

## Invariants

- A reference result can never appear without the currency pair, daily reference rate and rate date it was computed from.
- A currency pair can never hold the same currency twice.

## Out of scope

- Last-known rates · whether a failure may fall back to them is decided in roadmap step 3 (D3).
