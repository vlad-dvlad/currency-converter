import { z } from "zod";
import type { CurrencyPair } from "@/domain/currency";
import { rateToDecimalString, type DailyReferenceRate } from "@/domain/rate";

export type RateFailureReason = "timeout" | "source status" | "network error" | "failed validation";

export type RateAnswer =
  | { readonly ok: true; readonly rate: DailyReferenceRate }
  | { readonly ok: false; readonly reason: RateFailureReason };

/** The trust boundary: exactly one item, for this pair, with a positive rate and a real date. */
export function parseRateAnswer(body: unknown, pair: CurrencyPair): RateAnswer {
  const schema = z.tuple([
    z.object({
      base: z.literal(pair.base),
      quote: z.literal(pair.quote),
      rate: z.number().positive(),
      date: z.iso.date(),
    }),
  ]);

  const parsed = schema.safeParse(body);
  if (!parsed.success) return { ok: false, reason: "failed validation" };

  const [{ base, quote, rate, date }] = parsed.data;
  return { ok: true, rate: { base, quote, rate: rateToDecimalString(rate), date } };
}
