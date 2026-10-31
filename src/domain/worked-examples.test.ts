import { describe, expect, it } from "vitest";
import { parseAmount } from "./amount";
import { convert } from "./conversion";
import type { Currency } from "./currency";
import { formatResult } from "./format";

// Expected strings were calculated by hand ahead of the code. Nothing here is shared with it.
const WORKED_EXAMPLES: [typed: string, rate: string, quote: Currency, expected: string][] = [
  ["100", "45.436", "UAH", "4\u00A0543,60 UAH"],
  ["1,50", "1.23", "UAH", "1,85 UAH"],
  ["1,15", "1.1", "USD", "1,27 USD"],
  ["0,10", "0.022009", "USD", "< 0,01 USD"],
  ["0", "45.436", "UAH", "0,00 UAH"],
  ["0", "0.022009", "USD", "0,00 USD"],
];

describe("worked examples, from typed text to displayed string", () => {
  it.each(WORKED_EXAMPLES)("%s at %s to %s shows %j", (typed, rate, quote, expected) => {
    const amount = parseAmount(typed);
    if (amount.kind !== "valid") throw new Error(`${typed} did not parse as valid`);

    expect(formatResult(convert(amount.value, rate), quote)).toBe(expected);
  });
});
