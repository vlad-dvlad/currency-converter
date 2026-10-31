import { describe, expect, it } from "vitest";
import { parseAmount } from "./amount";

function valueOf(text: string): string {
  const parsed = parseAmount(text);
  if (parsed.kind !== "valid") throw new Error(`expected valid, got ${parsed.kind}`);
  return parsed.value.toFixed();
}

describe("parseAmount", () => {
  it.each(["", ",", "."])("reads %j as empty", (text) => {
    expect(parseAmount(text)).toEqual({ kind: "empty" });
  });

  it.each([
    "-1",
    "+1",
    "abc",
    "1a",
    "1,2,3",
    "1,.5",
    "1.2,",
    "1,000",
    "1.234",
    "1 000",
    " 12",
    "12 ",
    "1\u00A0000",
    "   ",
    "1234567890123",
    "٣",
  ])("rejects %j", (text) => {
    expect(parseAmount(text)).toEqual({ kind: "rejected" });
  });

  it.each([
    ["123456789012", "123456789012"],
    ["000123456789012", "123456789012"],
    ["12,", "12"],
    ["12.", "12"],
    ["1,5", "1.5"],
    ["1.5", "1.5"],
    [",5", "0.5"],
    [".5", "0.5"],
    ["007", "7"],
    ["0", "0"],
    ["0,00", "0"],
    ["0000000000000", "0"],
    ["1,25", "1.25"],
  ])("reads %j as %s", (text, expected) => {
    expect(valueOf(text)).toBe(expected);
  });
});
