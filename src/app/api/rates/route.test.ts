// @vitest-environment node
import { http, HttpResponse } from "msw";
import { revalidateTag } from "next/cache";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { server } from "../../../../test/msw-server";
import { GET } from "./route";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

const SOURCE = "https://api.frankfurter.dev/v2/rates";
const INVALID_PAIR = {
  error: { code: "invalid_pair", message: "The currency pair is not supported." },
};
const UNAVAILABLE = { error: { code: "rate_unavailable", message: "The rate is unavailable." } };

function get(query: string) {
  return GET(new Request(`http://127.0.0.1:3000/api/rates${query}`));
}

describe("GET /api/rates", () => {
  let consoleError: MockInstance<typeof console.error>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.mocked(revalidateTag).mockReset();
  });

  it("answers exactly the rate's four fields, uncached and with no console line", async () => {
    server.use(
      http.get(SOURCE, () =>
        HttpResponse.json([{ date: "2026-10-29", base: "USD", quote: "UAH", rate: 45.436, x: 1 }]),
      ),
    );

    const response = await get("?base=USD&quote=UAH");

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({
      base: "USD",
      quote: "UAH",
      rate: "45.436",
      date: "2026-10-29",
    });
    expect(consoleError).not.toHaveBeenCalled();
  });

  it.each([
    ["no parameters", ""],
    ["a missing base", "?quote=UAH"],
    ["a missing quote", "?base=USD"],
    ["an unsupported currency", "?base=XAU&quote=UAH"],
    ["an unsupported quote", "?base=USD&quote=XAU"],
    ["a lowercase currency", "?base=usd&quote=UAH"],
    ["one currency twice", "?base=USD&quote=USD"],
  ])("refuses %s without reaching the rate source", async (_name, query) => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const response = await get(query);

    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual(INVALID_PAIR);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledOnce();
  });

  it.each([
    ["an error status", () => new HttpResponse("upstream secret", { status: 500 })],
    ["a network error", () => HttpResponse.error()],
    ["an untrusted answer", () => HttpResponse.json([{ note: "upstream secret" }])],
    ["a body that is not JSON", () => new HttpResponse("upstream secret", { status: 200 })],
  ])("answers the fixed 502 body for %s, with no upstream text", async (_name, resolver) => {
    server.use(http.get(SOURCE, resolver));

    const response = await get("?base=USD&quote=UAH");
    const text = await response.text();

    expect(response.status).toBe(502);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(JSON.parse(text)).toEqual(UNAVAILABLE);
    expect(text).not.toContain("upstream secret");
    expect(consoleError).toHaveBeenCalledOnce();
  });

  it("answers 502 with one console line when dropping a stored answer throws", async () => {
    server.use(http.get(SOURCE, () => HttpResponse.json([])));
    vi.mocked(revalidateTag).mockImplementation(() => {
      throw new Error("no request context");
    });

    const response = await get("?base=USD&quote=UAH");

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual(UNAVAILABLE);
    expect(consoleError).toHaveBeenCalledOnce();
  });

  it("names the failure's reason in the console line", async () => {
    server.use(http.get(SOURCE, () => new HttpResponse(null, { status: 503 })));

    await get("?base=USD&quote=UAH");

    expect(consoleError.mock.calls[0][0]).toContain("source status 503");
  });
});
