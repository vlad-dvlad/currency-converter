import { isSupportedCurrency, type CurrencyPair } from "@/domain/currency";
import type { RateErrorCode } from "@/domain/rate";
import { getRate } from "@/server/rate-source";

const NO_STORE = { "Cache-Control": "no-store" };

function refusal(code: RateErrorCode, status: number, message: string): Response {
  return Response.json({ error: { code, message } }, { status, headers: NO_STORE });
}

function readPair(params: URLSearchParams): CurrencyPair | null {
  const base = params.get("base") ?? "";
  const quote = params.get("quote") ?? "";
  if (!isSupportedCurrency(base) || !isSupportedCurrency(quote) || base === quote) return null;
  return { base, quote };
}

export async function GET(request: Request): Promise<Response> {
  const pair = readPair(new URL(request.url).searchParams);
  if (!pair) {
    console.error("GET /api/rates refused: unsupported currency pair");
    return refusal("invalid_pair", 400, "The currency pair is not supported.");
  }

  const label = `${pair.base} to ${pair.quote}`;
  let reason: string;
  try {
    const answer = await getRate(pair);
    if (answer.ok) return Response.json(answer.rate, { headers: NO_STORE });
    reason = answer.reason;
  } catch (error) {
    reason = `unexpected failure: ${String(error)}`;
  }

  console.error(`GET /api/rates failed for ${label}: ${reason}`);
  return refusal("rate_unavailable", 502, "The rate is unavailable.");
}
