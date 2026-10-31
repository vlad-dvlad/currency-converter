import Big from "big.js";

export type Conversion =
  { readonly kind: "exact"; readonly value: Big } | { readonly kind: "below-minimum" };

/** The reference result, to two decimal places with a half going up. */
export function convert(amount: Big, rate: string): Conversion {
  const value = amount.times(rate).round(2, Big.roundHalfUp);
  return value.eq(0) && !amount.eq(0) ? { kind: "below-minimum" } : { kind: "exact", value };
}
