import type { Conversion } from "./conversion";
import type { Currency } from "./currency";
import type { DailyReferenceRate } from "./rate";

const NON_BREAKING_SPACE = "\u00A0";

/** The result as shown: a decimal comma and a non-breaking space between thousands. */
export function formatResult(conversion: Conversion, quote: Currency): string {
  if (conversion.kind === "below-minimum") return `< 0,01 ${quote}`;

  const [whole, fraction] = conversion.value.toFixed(2).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+$)/g, NON_BREAKING_SPACE);
  return `${grouped},${fraction} ${quote}`;
}

/** The rate with every digit as published: a decimal comma, no grouping, no rounding. */
export function formatRate({ base, quote, rate }: DailyReferenceRate): string {
  return `1 ${base} = ${rate.replace(".", ",")} ${quote}`;
}

/** Rearranges the parts rather than building a Date, so no time zone can shift the day. */
export function formatRateDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}.${month}.${year}`;
}
