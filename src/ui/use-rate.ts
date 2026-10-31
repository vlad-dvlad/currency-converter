import { useEffect, useState } from "react";
import type { Currency, CurrencyPair } from "@/domain/currency";
import type { DailyReferenceRate } from "@/domain/rate";
import { fetchRate } from "./rates-api";

export type RateState =
  | { readonly status: "pending" }
  | { readonly status: "ready"; readonly rate: DailyReferenceRate }
  | { readonly status: "unavailable" };

interface HeldRate {
  readonly base: Currency;
  readonly quote: Currency;
  readonly state: RateState;
}

const PENDING: RateState = { status: "pending" };

/** The rate of the selected pair only: a new pair replaces what is held before anything renders. */
export function useRate({ base, quote }: CurrencyPair): RateState {
  const [held, setHeld] = useState<HeldRate>({ base, quote, state: PENDING });

  // Replacing the held rate here, not in the effect, also clears A's rate on A to B to A.
  if (held.base !== base || held.quote !== quote) {
    setHeld({ base, quote, state: PENDING });
  }

  useEffect(() => {
    const controller = new AbortController();
    void fetchRate({ base, quote }, controller.signal).then((reply) => {
      if (controller.signal.aborted) return;
      const state: RateState =
        reply.kind === "ready" ? { status: "ready", rate: reply.rate } : { status: "unavailable" };
      setHeld({ base, quote, state });
    });
    return () => controller.abort();
  }, [base, quote]);

  return held.base === base && held.quote === quote ? held.state : PENDING;
}
