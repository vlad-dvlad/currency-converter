import Big from "big.js";
import { describe, expect, it } from "vitest";
import { convert } from "./conversion";

function exactValue(amount: string, rate: string): string {
  const outcome = convert(new Big(amount), rate);
  if (outcome.kind !== "exact") throw new Error(`expected exact, got ${outcome.kind}`);
  return outcome.value.toFixed(2);
}

describe("convert", () => {
  it.each([
    ["100", "45.436", "4543.60"],
    ["1.50", "1.23", "1.85"],
    ["1.15", "1.1", "1.27"],
    ["0.01", "0.5", "0.01"],
    ["999999999999.99", "45.436", "45435999999999.55"],
    ["0", "45.436", "0.00"],
    ["0", "0.000001", "0.00"],
  ])("%s at %s is %s", (amount, rate, expected) => {
    expect(exactValue(amount, rate)).toBe(expected);
  });

  it.each([
    ["0.10", "0.022009"],
    ["0.01", "0.49"],
  ])("%s at %s is below the minimum", (amount, rate) => {
    expect(convert(new Big(amount), rate)).toEqual({ kind: "below-minimum" });
  });
});
