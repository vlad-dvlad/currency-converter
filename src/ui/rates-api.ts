import { z } from "zod";
import type { CurrencyPair } from "@/domain/currency";
import type { DailyReferenceRate } from "@/domain/rate";

export type RateReply =
  { readonly kind: "ready"; readonly rate: DailyReferenceRate } | { readonly kind: "unavailable" };

const PLAIN_POSITIVE_DECIMAL = /^(?:[1-9][0-9]*(?:\.[0-9]+)?|0\.[0-9]*[1-9][0-9]*)$/;
const UNAVAILABLE: RateReply = { kind: "unavailable" };

/** Never rejects: the screen has one unavailable state, whatever went wrong. */
export async function fetchRate(pair: CurrencyPair, signal: AbortSignal): Promise<RateReply> {
  const schema = z.strictObject({
    base: z.literal(pair.base),
    quote: z.literal(pair.quote),
    rate: z.string().regex(PLAIN_POSITIVE_DECIMAL),
    date: z.iso.date(),
  });

  try {
    const response = await fetch(`/api/rates?base=${pair.base}&quote=${pair.quote}`, { signal });
    if (response.status !== 200) return UNAVAILABLE;

    const parsed = schema.safeParse(await response.json());
    return parsed.success ? { kind: "ready", rate: parsed.data } : UNAVAILABLE;
  } catch {
    return UNAVAILABLE;
  }
}
