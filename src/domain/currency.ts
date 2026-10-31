export const SUPPORTED_CURRENCIES = ["UAH", "USD", "EUR", "GBP", "PLN"] as const;

export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export interface CurrencyPair {
  readonly base: Currency;
  readonly quote: Currency;
}

export type PairField = keyof CurrencyPair;

export const DEFAULT_PAIR: CurrencyPair = { base: "USD", quote: "UAH" };

export function isSupportedCurrency(text: string): text is Currency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(text);
}

export function swapPair(pair: CurrencyPair): CurrencyPair {
  return { base: pair.quote, quote: pair.base };
}

/** Sets one field; choosing the other field's currency swaps them, so a pair never holds one twice. */
export function chooseCurrency(
  pair: CurrencyPair,
  field: PairField,
  currency: Currency,
): CurrencyPair {
  const other: PairField = field === "base" ? "quote" : "base";
  return pair[other] === currency ? swapPair(pair) : { ...pair, [field]: currency };
}
