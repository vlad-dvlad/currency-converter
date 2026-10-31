// @vitest-environment node
import { delay, http, HttpResponse } from "msw";
import { revalidateTag } from "next/cache";
import { afterEach, describe, expect, it, vi } from "vitest";
import { server } from "../../test/msw-server";
import { REVALIDATE_SECONDS, getRate, parseRateAnswer } from "./rate-source";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

const pair = { base: "USD", quote: "UAH" } as const;
const item = { date: "2026-10-31", base: "USD", quote: "UAH", rate: 45.436 };
const untrusted = { ok: false, reason: "failed validation" };

describe("parseRateAnswer", () => {
  it("maps the observed form to a rate, changing only the rate's form", () => {
    expect(parseRateAnswer([item], pair)).toEqual({
      ok: true,
      rate: { base: "USD", quote: "UAH", rate: "45.436", date: "2026-10-31" },
    });
  });

  it("passes an old rate date through unchanged", () => {
    const answer = parseRateAnswer([{ ...item, date: "2026-10-29" }], pair);
    expect(answer).toMatchObject({ ok: true, rate: { date: "2026-10-29" } });

    const yearsOld = parseRateAnswer([{ ...item, date: "2019-03-04" }], pair);
    expect(yearsOld).toMatchObject({ ok: true, rate: { date: "2019-03-04" } });
  });

  it("writes a tiny rate without exponent form", () => {
    const answer = parseRateAnswer([{ ...item, rate: 1e-7 }], pair);
    expect(answer).toMatchObject({ ok: true, rate: { rate: "0.0000001" } });
  });

  it.each([
    ["an object", item],
    ["a string", "<html>"],
    ["null", null],
    ["an empty list", []],
    ["two items", [item, item]],
    ["a missing rate", [{ date: item.date, base: "USD", quote: "UAH" }]],
    ["a zero rate", [{ ...item, rate: 0 }]],
    ["a negative rate", [{ ...item, rate: -1 }]],
    ["a string rate", [{ ...item, rate: "45.4" }]],
    ["another base", [{ ...item, base: "EUR" }]],
    ["another quote", [{ ...item, quote: "PLN" }]],
    ["the reversed pair", [{ ...item, base: "UAH", quote: "USD" }]],
    ["a missing date", [{ base: "USD", quote: "UAH", rate: 45.436 }]],
    ["an impossible date", [{ ...item, date: "2026-02-30" }]],
    ["a differently written date", [{ ...item, date: "31.10.2026" }]],
  ])("does not trust %s", (_name, body) => {
    expect(parseRateAnswer(body, pair)).toEqual(untrusted);
  });
});

describe("getRate", () => {
  const SOURCE = "https://api.frankfurter.dev/v2/rates";

  afterEach(() => {
    vi.restoreAllMocks();
    vi.mocked(revalidateTag).mockReset();
  });

  function answerWith(resolver: () => Response | Promise<Response>) {
    server.use(http.get(SOURCE, resolver));
  }

  it("requests exactly the selected direction and returns its rate", async () => {
    const urls: string[] = [];
    server.use(
      http.get(SOURCE, ({ request }) => {
        urls.push(request.url);
        return HttpResponse.json([{ date: "2026-10-31", base: "UAH", quote: "USD", rate: 0.022 }]);
      }),
    );

    const answer = await getRate({ base: "UAH", quote: "USD" });

    expect(urls).toEqual([`${SOURCE}?base=UAH&quotes=USD`]);
    expect(answer).toEqual({
      ok: true,
      rate: { base: "UAH", quote: "USD", rate: "0.022", date: "2026-10-31" },
    });
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("declares a refresh interval of at most 24 hours and one tag per pair", async () => {
    answerWith(() =>
      HttpResponse.json([{ date: "2026-10-31", base: "USD", quote: "UAH", rate: 45 }]),
    );
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await getRate(pair);
    answerWith(() =>
      HttpResponse.json([{ date: "2026-10-31", base: "UAH", quote: "USD", rate: 1 }]),
    );
    await getRate({ base: "UAH", quote: "USD" });

    const [usdToUah, uahToUsd] = fetchSpy.mock.calls.map(([, init]) => init?.next);
    expect(REVALIDATE_SECONDS).toBe(3600);
    expect(usdToUah?.revalidate).toBe(3600);
    expect(usdToUah?.revalidate).toBeLessThanOrEqual(24 * 60 * 60);
    expect(usdToUah?.tags).toHaveLength(1);
    expect(uahToUsd?.tags).toHaveLength(1);
    expect(usdToUah?.tags).not.toEqual(uahToUsd?.tags);
  });

  it("gives up after 5000 ms with the reason timeout", async () => {
    answerWith(async () => {
      await delay("infinite");
      return HttpResponse.json([]);
    });
    const realTimeout = AbortSignal.timeout.bind(AbortSignal);
    const timeoutSpy = vi.spyOn(AbortSignal, "timeout").mockImplementation(() => realTimeout(5));

    const answer = await getRate(pair);

    expect(timeoutSpy).toHaveBeenCalledWith(5000);
    expect(answer).toEqual({ ok: false, reason: "timeout" });
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("names a non-200 status, keeps its body out and has nothing to drop", async () => {
    answerWith(() => new HttpResponse("upstream secret", { status: 503 }));

    expect(await getRate(pair)).toEqual({ ok: false, reason: "source status 503" });
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("names a network error and has nothing to drop", async () => {
    answerWith(() => HttpResponse.error());

    expect(await getRate(pair)).toEqual({ ok: false, reason: "network error" });
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("drops a stored answer that fails validation", async () => {
    answerWith(() =>
      HttpResponse.json([{ date: "2026-10-31", base: "EUR", quote: "UAH", rate: 1 }]),
    );
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    expect(await getRate(pair)).toEqual(untrusted);

    const tag = fetchSpy.mock.calls[0][1]?.next?.tags?.[0];
    expect(revalidateTag).toHaveBeenCalledExactlyOnceWith(tag, { expire: 0 });
  });

  it("drops a stored status-200 answer that is not JSON", async () => {
    answerWith(() => new HttpResponse("<html>down</html>", { status: 200 }));

    expect(await getRate(pair)).toEqual(untrusted);
    expect(revalidateTag).toHaveBeenCalledOnce();
  });

  it("lets a failure to drop propagate", async () => {
    answerWith(() => HttpResponse.json([]));
    vi.mocked(revalidateTag).mockImplementation(() => {
      throw new Error("no request context");
    });

    await expect(getRate(pair)).rejects.toThrow("no request context");
  });
});
