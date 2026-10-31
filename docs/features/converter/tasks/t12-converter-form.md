---
id: T12
title: "Build the converter form with its fields, swap control and Ukrainian text"
layer: "ui"
deps: ["T1"]
blocks: ["T13"]
acs: ["AC-07", "AC-08", "AC-09", "AC-14"]
files_hint: ["src/ui/converter.tsx", "src/ui/converter.test.tsx", "src/ui/messages.ts", "package.json", "package-lock.json"]
owner: "Vlad"
estimate: "M"
context_budget: "M"
status: "done"
step: "COMMIT"
---

# T12 — Build the converter form with its fields, swap control and Ukrainian text

## Place in the sequence

- **Blocked by:** T1 — Define supported currencies, the currency pair, the choice rule and shared rate types
- **Blocks:** T13 — Show the rate, rate date, dash and unavailable message on the screen
- **Wave:** 2 — it needs the currency rules from T1 and no rate yet, so `ui` can start early.
- **Lane:** shares `package.json` with T5; shares `package-lock.json` with T6; shares `src/ui/converter.test.tsx` with T13; shares `src/ui/converter.test.tsx` with T14 — serialized.

## Why (user story)

> **As an** owner
> **I want** to choose currencies from the supported list and swap them
> **So that** I reach the direction I need quickly
>
> — `spec.md §4, US-03, verbatim` · full text: [spec.md](../spec.md)

> **As an** owner
> **I want** to do everything on the screen with the keyboard
> **So that** I never need the mouse
>
> — `spec.md §4, US-06, verbatim` · full text: [spec.md](../spec.md)

This task delivers everything the owner operates; T13 and T14 add what the screen answers with.

## Inlined context

> converter.tsx         client component: the fields, the swap control, the screen states
>
> — `sad.md §5, tree src/ui/, verbatim` · full text: [sad.md](../sad.md)

> messages.ts           all Ukrainian text in one place
>
> — `sad.md §5, tree src/ui/, verbatim` · full text: [sad.md](../sad.md)

> Native `input`, `select` and `button` elements with visible labels and `focus-visible` styles (AC-14). The amount field is `type="text"` with `inputMode="decimal"`, so rejected text stays as typed (AC-10)
>
> — `sad.md §8, Keyboard and form controls, verbatim` · full text: [sad.md](../sad.md)

> Ukrainian only, with all text in `src/ui/messages.ts` and the document language set to `uk`. Currency codes stay as UAH, USD, EUR, GBP and PLN (AC-14). There is no translation library
>
> — `sad.md §8, Internationalisation, verbatim` · full text: [sad.md](../sad.md)

> A native `select` whose every `change` counts as a choice: it requests the rate and may swap the fields (AC-08).
>
> — `sad.md §8, Choosing a currency, verbatim` · full text: [sad.md](../sad.md)

> **Styling:** Tailwind CSS 4 utility classes only; theme tokens in `src/app/globals.css`.
>
> — `CLAUDE.md §Conventions, Styling, verbatim` · full text: [CLAUDE.md](../../../../CLAUDE.md)

**UI reuse:** `src/ui/` is empty and `docs/design-system.md` does not exist, so there is no component to reuse and no `screens.md` manifest; the AC-13c table is the state contract. Build with native elements and Tailwind utilities in `converter.tsx`, and add no shared primitive (`docs/architecture-map.md` §Frontend: add one when a second use appears). Visual polish is roadmap step 4.

**Proposed text (breakdown proposal; no upstream fixes the wording, and the owner reads it in the change):** heading `Конвертер валют` · `Сума` · `З валюти` · `У валюту` · swap `Поміняти валюти місцями` · label `Довідкове значення: банк або обмінник може застосувати інший курс` · unavailable `Курс зараз недоступний` · amount `Введіть суму цифрами: до 12 цифр перед комою і до 2 після, наприклад 1234,56`.

**Fallback:** insufficient or contradicted by the code → read the named file in full ([spec.md](../spec.md) · [sad.md](../sad.md) · [data-model.md](../data-model.md) · [openapi.yaml](../contracts/openapi.yaml) · [adr/](../adr/)) and follow it. Do not guess.

## Data delta

No DB changes. The feature has no datastore; this task works with the shape below, where "Column" means a field.

| Column | Type | Constraints | Change |
|---|---|---|---|
| `base` | `Currency` | One of UAH, USD, EUR, GBP, PLN | read-only |
| `quote` | `Currency` | One of UAH, USD, EUR, GBP, PLN; differs from `base` | read-only |

— `data-model.md §Entities, currency_pair, abridged` · full text: [data-model.md](../data-model.md)

## API contract

Internal — no API surface. The request arrives in T13.

## Acceptance criteria

### AC-07 — happy path

> **Given** the owner opens the app
> **When** the screen appears
> **Then** the currency pair is USD to UAH, the amount is empty, and each currency field offers exactly UAH, USD, EUR, GBP and PLN
>
> — `spec.md §5, AC-07, verbatim` · full text: [spec.md](../spec.md)

### AC-08 — domain invariant

> **Given** a currency pair is selected
> **When** the owner chooses for one field the currency already in the other field
> **Then** the two fields swap, so a currency pair never holds the same currency twice and no error appears
>
> — `spec.md §5, AC-08, verbatim` · full text: [spec.md](../spec.md)

### AC-09 — happy path

> **Given** an amount and a currency pair are on screen
> **When** the owner uses the swap control
> **Then** the amount stays, the pair reverses, and the result uses the rate published for the new direction, never an inverted copy of the old rate
>
> — `spec.md §5, AC-09, verbatim` · full text: [spec.md](../spec.md)

### AC-14 — happy path

> **Given** the owner is using only the keyboard
> **When** the owner moves through the screen
> **Then** the amount, both currencies and the swap control can all be reached and operated, focus is always visible, and every field has a label in Ukrainian; currency codes stay as UAH, USD, EUR, GBP and PLN
>
> — `spec.md §5, AC-14, verbatim` · full text: [spec.md](../spec.md)

## Checklist

- [ ] Add the `@testing-library/user-event` dev dependency for keyboard tests — `package.json`, `package-lock.json`
- [ ] `src/ui/messages.ts`: every Ukrainian string for T12, T13 and T14, so those tasks add no copy
- [ ] `src/ui/converter.tsx`: a `use client` component holding the amount text and the pair, with a visible label on each field and `focus-visible` styles
- [ ] `src/ui/converter.tsx`: the selects call `chooseCurrency`, and the swap control calls `swapPair`
- [ ] `src/ui/converter.test.tsx`: opening state, both swap paths, and tabbing through all four controls with `user-event`

## Edge cases

| Case | Behaviour |
|---|---|
| Choosing the other field's currency | The fields swap, with no error |
| Swap control | The pair reverses, and the amount text stays |
| Rejected text in the amount | Stays exactly as typed: the field never blocks input |
| Swap control with Enter or Space | Works: it is a native button of `type="button"` |
| Arrow keys in a closed select | Every change of value counts as a choice, as with the mouse |
| Options in either field | Exactly UAH, USD, EUR, GBP and PLN, as codes |

## Definition of Done

- [ ] `src/ui/converter.test.tsx` passes for AC-07 and AC-08, the amount staying on swap (AC-09), and a Tab walk through all four labelled controls (AC-14)
- [ ] All Ukrainian text lives in `src/ui/messages.ts`
- [ ] every Hard Rule inlined above still holds
- [ ] `npm run lint` and `npm run typecheck` clean
