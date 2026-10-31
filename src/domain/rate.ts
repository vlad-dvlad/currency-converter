import Big from "big.js";
import type { Currency } from "./currency";

/** A rate as it crosses the wire: `rate` is a plain positive decimal string, `date` is YYYY-MM-DD. */
export interface DailyReferenceRate {
  readonly base: Currency;
  readonly quote: Currency;
  readonly rate: string;
  readonly date: string;
}

export type RateErrorCode = "invalid_pair" | "rate_unavailable";

/** The one place a rate source's number becomes a decimal string, never in exponent form. */
export function rateToDecimalString(rate: number): string {
  return new Big(rate).toFixed();
}
