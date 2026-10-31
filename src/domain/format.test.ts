import Big from "big.js";
import { describe, expect, it } from "vitest";
import { formatRate, formatRateDate, formatResult } from "./format";

describe("formatResult", () => {
  it.each([
    ["4543.60", "4\u00A0543,60 UAH"],
    ["999.99", "999,99 UAH"],
    ["1000", "1\u00A0000,00 UAH"],
    ["1234567.89", "1\u00A0234\u00A0567,89 UAH"],
    ["0", "0,00 UAH"],
    ["7.5", "7,50 UAH"],
  ])("writes %s as %j", (value, expected) => {
    expect(formatResult({ kind: "exact", value: new Big(value) }, "UAH")).toBe(expected);
  });

  it("writes a below-minimum outcome with its currency", () => {
    expect(formatResult({ kind: "below-minimum" }, "USD")).toBe("< 0,01 USD");
  });
});

describe("formatRate", () => {
  const rateOf = (rate: string) =>
    ({ base: "USD", quote: "UAH", rate, date: "2026-10-31" }) as const;

  it.each([
    ["45.436", "1 USD = 45,436 UAH"],
    ["1234.5", "1 USD = 1234,5 UAH"],
    ["45", "1 USD = 45 UAH"],
    ["0.022009", "1 USD = 0,022009 UAH"],
  ])("writes %s as %j, keeping every digit", (rate, expected) => {
    expect(formatRate(rateOf(rate))).toBe(expected);
  });
});

describe("formatRateDate", () => {
  it.each([
    ["2026-10-29", "29.10.2026"],
    ["2026-01-02", "02.01.2026"],
  ])("rearranges %s into %s", (date, expected) => {
    expect(formatRateDate(date)).toBe(expected);
  });
});
