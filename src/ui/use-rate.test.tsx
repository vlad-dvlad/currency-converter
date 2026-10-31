import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CurrencyPair } from "@/domain/currency";
import { server } from "../../test/msw-server";
import { useRate, type RateState } from "./use-rate";

const USD_UAH: CurrencyPair = { base: "USD", quote: "UAH" };
const EUR_UAH: CurrencyPair = { base: "EUR", quote: "UAH" };

function rateFor({ base, quote }: CurrencyPair, rate = "45.436") {
  return { base, quote, rate, date: "2026-10-29" };
}

const failure = () => HttpResponse.json({ error: { code: "rate_unavailable" } }, { status: 502 });

/** Holds every reply until the test releases it, so the test decides the order of arrival. */
function holdReplies() {
  const held: { query: string; release: (reply: Response) => void }[] = [];
  server.use(
    http.get("*/api/rates", ({ request }) => {
      const query = new URL(request.url).search;
      return new Promise<Response>((release) => held.push({ query, release }));
    }),
  );
  return {
    held,
    queries: () => held.map(({ query }) => query),
    async arrived(count: number) {
      await waitFor(() => expect(held).toHaveLength(count));
    },
    async release(index: number, reply: Response) {
      await act(async () => {
        held[index].release(reply);
        await new Promise((resolve) => setTimeout(resolve, 20));
      });
    },
  };
}

function renderRate(initial: CurrencyPair) {
  const renders: { pair: CurrencyPair; state: RateState }[] = [];
  const hook = renderHook(
    ({ pair }) => {
      const state = useRate(pair);
      renders.push({ pair, state });
      return state;
    },
    { initialProps: { pair: initial } },
  );
  return { ...hook, renders };
}

describe("useRate", () => {
  it("starts pending and becomes ready for the requested pair", async () => {
    server.use(http.get("*/api/rates", () => HttpResponse.json(rateFor(USD_UAH))));

    const { result } = renderRate(USD_UAH);

    expect(result.current).toEqual({ status: "pending" });
    await waitFor(() =>
      expect(result.current).toEqual({ status: "ready", rate: rateFor(USD_UAH) }),
    );
  });

  it("becomes unavailable on a failure", async () => {
    server.use(http.get("*/api/rates", failure));

    const { result } = renderRate(USD_UAH);

    await waitFor(() => expect(result.current).toEqual({ status: "unavailable" }));
  });

  it("is pending in the very render that changes the pair, never the old rate", async () => {
    server.use(http.get("*/api/rates", () => HttpResponse.json(rateFor(USD_UAH))));
    const { result, rerender, renders } = renderRate(USD_UAH);
    await waitFor(() => expect(result.current).toMatchObject({ status: "ready" }));

    server.use(http.get("*/api/rates", () => new Promise<Response>(() => {})));
    rerender({ pair: EUR_UAH });

    expect(result.current).toEqual({ status: "pending" });
    const afterChange = renders.filter(({ pair }) => pair === EUR_UAH);
    expect(afterChange.length).toBeGreaterThan(0);
    expect(afterChange.every(({ state }) => state.status === "pending")).toBe(true);
  });

  it("ignores a late rate for an earlier selection", async () => {
    const replies = holdReplies();
    const { result, rerender } = renderRate(USD_UAH);
    await replies.arrived(1);

    rerender({ pair: EUR_UAH });
    await replies.arrived(2);
    await replies.release(0, HttpResponse.json(rateFor(USD_UAH)));
    expect(result.current).toEqual({ status: "pending" });

    await replies.release(1, HttpResponse.json(rateFor(EUR_UAH, "50.1")));
    await waitFor(() =>
      expect(result.current).toEqual({ status: "ready", rate: rateFor(EUR_UAH, "50.1") }),
    );
  });

  it("ignores a late failure for an earlier selection", async () => {
    const replies = holdReplies();
    const { result, rerender } = renderRate(USD_UAH);
    await replies.arrived(1);

    rerender({ pair: EUR_UAH });
    await replies.arrived(2);
    await replies.release(1, HttpResponse.json(rateFor(EUR_UAH, "50.1")));
    await waitFor(() => expect(result.current).toMatchObject({ status: "ready" }));

    await replies.release(0, failure());
    expect(result.current).toEqual({ status: "ready", rate: rateFor(EUR_UAH, "50.1") });
  });

  describe("when a reply arrives despite the abort", () => {
    afterEach(() => vi.restoreAllMocks());

    // Under msw an abort rejects at once, so only a fetch that ignores its signal reaches the guard.
    function fetchIgnoringAbort() {
      const replies: ((reply: Response) => void)[] = [];
      vi.spyOn(globalThis, "fetch").mockImplementation(
        () => new Promise<Response>((resolve) => replies.push(resolve)),
      );
      return replies;
    }

    it.each([
      ["rate", () => HttpResponse.json(rateFor(USD_UAH))],
      ["failure", failure],
    ])("keeps the selected pair's rate when a late %s comes in", async (_name, lateReply) => {
      const replies = fetchIgnoringAbort();
      const { result, rerender } = renderRate(USD_UAH);
      rerender({ pair: EUR_UAH });
      await waitFor(() => expect(replies).toHaveLength(2));

      await act(async () => replies[1](HttpResponse.json(rateFor(EUR_UAH, "50.1"))));
      await waitFor(() => expect(result.current).toMatchObject({ status: "ready" }));

      await act(async () => {
        replies[0](lateReply());
        await new Promise((resolve) => setTimeout(resolve, 20));
      });

      expect(result.current).toEqual({ status: "ready", rate: rateFor(EUR_UAH, "50.1") });
    });
  });

  it("makes a new request on A to B to A, and the first rate for A does not reappear", async () => {
    const replies = holdReplies();
    const { result, rerender, renders } = renderRate(USD_UAH);
    await replies.arrived(1);
    await replies.release(0, HttpResponse.json(rateFor(USD_UAH, "1.11")));
    await waitFor(() => expect(result.current).toMatchObject({ status: "ready" }));

    rerender({ pair: EUR_UAH });
    await replies.arrived(2);
    const backToA = { ...USD_UAH };
    rerender({ pair: backToA });
    await replies.arrived(3);

    expect(replies.queries()).toEqual([
      "?base=USD&quote=UAH",
      "?base=EUR&quote=UAH",
      "?base=USD&quote=UAH",
    ]);
    expect(result.current).toEqual({ status: "pending" });
    expect(
      renders.filter(({ pair }) => pair === backToA).every((r) => r.state.status === "pending"),
    ).toBe(true);

    await replies.release(2, HttpResponse.json(rateFor(USD_UAH, "2.22")));
    await waitFor(() =>
      expect(result.current).toEqual({ status: "ready", rate: rateFor(USD_UAH, "2.22") }),
    );
  });

  it("is pending again after unavailable, then a change of pair and back", async () => {
    server.use(http.get("*/api/rates", failure));
    const { result, rerender } = renderRate(USD_UAH);
    await waitFor(() => expect(result.current).toEqual({ status: "unavailable" }));

    server.use(http.get("*/api/rates", () => new Promise<Response>(() => {})));
    rerender({ pair: EUR_UAH });
    expect(result.current).toEqual({ status: "pending" });
    rerender({ pair: USD_UAH });
    expect(result.current).toEqual({ status: "pending" });
  });

  it("makes no new request when it rerenders with an equal pair", async () => {
    const replies = holdReplies();
    const { rerender } = renderRate(USD_UAH);
    await replies.arrived(1);

    rerender({ pair: { ...USD_UAH } });
    await act(() => new Promise((resolve) => setTimeout(resolve, 20)));

    expect(replies.held).toHaveLength(1);
  });

  it("aborts the request on unmount", async () => {
    let signal: AbortSignal | undefined;
    server.use(
      http.get("*/api/rates", ({ request }) => {
        signal = request.signal;
        return new Promise<Response>(() => {});
      }),
    );
    const { unmount } = renderRate(USD_UAH);
    await waitFor(() => expect(signal).toBeDefined());

    unmount();

    await waitFor(() => expect(signal?.aborted).toBe(true));
  });
});
