import { describe, expect, it } from "vitest";
import {
  DEFAULT_PAIR,
  SUPPORTED_CURRENCIES,
  chooseCurrency,
  isSupportedCurrency,
  swapPair,
} from "./currency";

describe("supported currencies", () => {
  it("lists exactly UAH, USD, EUR, GBP and PLN in that order", () => {
    expect(SUPPORTED_CURRENCIES).toEqual(["UAH", "USD", "EUR", "GBP", "PLN"]);
  });

  it("opens on USD to UAH", () => {
    expect(DEFAULT_PAIR).toEqual({ base: "USD", quote: "UAH" });
  });

  it.each(["UAH", "USD", "EUR", "GBP", "PLN"])("accepts %s", (code) => {
    expect(isSupportedCurrency(code)).toBe(true);
  });

  it.each(["usd", "", "XAU", " USD"])("rejects %j: the check is exact", (text) => {
    expect(isSupportedCurrency(text)).toBe(false);
  });
});

describe("swapPair", () => {
  it("exchanges base and quote", () => {
    expect(swapPair({ base: "USD", quote: "UAH" })).toEqual({ base: "UAH", quote: "USD" });
  });
});

describe("chooseCurrency", () => {
  const pair = { base: "USD", quote: "UAH" } as const;

  it("sets base to a currency the other field does not hold", () => {
    expect(chooseCurrency(pair, "base", "EUR")).toEqual({ base: "EUR", quote: "UAH" });
  });

  it("sets quote to a currency the other field does not hold", () => {
    expect(chooseCurrency(pair, "quote", "EUR")).toEqual({ base: "USD", quote: "EUR" });
  });

  it("swaps when base is given the quote's currency", () => {
    expect(chooseCurrency(pair, "base", "UAH")).toEqual({ base: "UAH", quote: "USD" });
  });

  it("swaps when quote is given the base's currency", () => {
    expect(chooseCurrency(pair, "quote", "USD")).toEqual({ base: "UAH", quote: "USD" });
  });

  it("returns the pair unchanged when a field is given the currency it holds", () => {
    expect(chooseCurrency(pair, "base", "USD")).toEqual(pair);
    expect(chooseCurrency(pair, "quote", "UAH")).toEqual(pair);
  });
});
