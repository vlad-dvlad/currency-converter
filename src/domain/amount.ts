import Big from "big.js";

export type ParsedAmount =
  | { readonly kind: "empty" }
  | { readonly kind: "rejected" }
  | { readonly kind: "valid"; readonly value: Big };

const MAX_WHOLE_DIGITS = 12;
const AMOUNT_TEXT = /^(\d*)(?:[.,](\d{0,2}))?$/;

/** Reads what the owner typed: unfinished text is empty, not an error. */
export function parseAmount(text: string): ParsedAmount {
  const match = AMOUNT_TEXT.exec(text);
  if (!match) return { kind: "rejected" };

  const whole = match[1];
  const fraction = match[2] ?? "";
  if (whole === "" && fraction === "") return { kind: "empty" };

  const significantWhole = whole.replace(/^0+/, "");
  if (significantWhole.length > MAX_WHOLE_DIGITS) return { kind: "rejected" };

  return { kind: "valid", value: new Big(`0${whole}.${fraction}0`) };
}
