import { revalidateTag } from "next/cache";
import { z } from "zod";
import type { CurrencyPair } from "@/domain/currency";
import { rateToDecimalString, type DailyReferenceRate } from "@/domain/rate";

export type RateFailureReason =
  "timeout" | "network error" | "failed validation" | `source status ${number}`;

export type RateAnswer =
  | { readonly ok: true; readonly rate: DailyReferenceRate }
  | { readonly ok: false; readonly reason: RateFailureReason };

export const REVALIDATE_SECONDS = 3600;

const SOURCE_URL = "https://api.frankfurter.dev/v2/rates";
const TIME_LIMIT_MS = 5000;

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

/**
 * Requests the rate for exactly this direction. The framework stores any status-200 answer,
 * so an untrusted one is dropped here rather than being served for the next hour.
 */
export async function getRate(pair: CurrencyPair): Promise<RateAnswer> {
  const tag = `rate-${pair.base}-${pair.quote}`;
  const url = `${SOURCE_URL}?base=${pair.base}&quotes=${pair.quote}`;

  let text: string;
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(TIME_LIMIT_MS),
      next: { revalidate: REVALIDATE_SECONDS, tags: [tag] },
    });
    if (response.status !== 200) {
      return { ok: false, reason: `source status ${response.status}` };
    }
    text = await response.text();
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return { ok: false, reason: timedOut ? "timeout" : "network error" };
  }

  const answer = parseRateAnswer(parseJson(text), pair);
  if (!answer.ok) revalidateTag(tag, { expire: 0 });
  return answer;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
