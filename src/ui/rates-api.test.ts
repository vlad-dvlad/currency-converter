import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../test/msw-server";
import { fetchRate } from "./rates-api";

const pair = { base: "USD", quote: "UAH" } as const;
const valid = { base: "USD", quote: "UAH", rate: "45.436", date: "2026-10-29" };
const unavailable = { kind: "unavailable" };

function replyWith(resolver: () => Response) {
  server.use(http.get("*/api/rates", resolver));
}

function open() {
  return new AbortController().signal;
}

describe("fetchRate", () => {
  it("requests the pair from /api/rates and returns a valid reply", async () => {
    let requested = "";
    server.use(
      http.get("*/api/rates", ({ request }) => {
        const url = new URL(request.url);
        requested = url.pathname + url.search;
        return HttpResponse.json(valid);
      }),
    );

    expect(await fetchRate(pair, open())).toEqual({ kind: "ready", rate: valid });
    expect(requested).toBe("/api/rates?base=USD&quote=UAH");
  });

  it.each([
    ["400", () => HttpResponse.json({ error: { code: "invalid_pair" } }, { status: 400 })],
    ["502", () => HttpResponse.json({ error: { code: "rate_unavailable" } }, { status: 502 })],
    ["a network error", () => HttpResponse.error()],
    ["invalid JSON", () => new HttpResponse("<html>", { status: 200 })],
    ["an extra property", () => HttpResponse.json({ ...valid, extra: 1 })],
    ["a number rate", () => HttpResponse.json({ ...valid, rate: 45.436 })],
    ["another base", () => HttpResponse.json({ ...valid, base: "EUR" })],
    ["another quote", () => HttpResponse.json({ ...valid, quote: "PLN" })],
    ["the reversed pair", () => HttpResponse.json({ ...valid, base: "UAH", quote: "USD" })],
    ["an exponent rate", () => HttpResponse.json({ ...valid, rate: "1e5" })],
    ["a zero rate", () => HttpResponse.json({ ...valid, rate: "0" })],
    ["a negative rate", () => HttpResponse.json({ ...valid, rate: "-1" })],
    ["an impossible date", () => HttpResponse.json({ ...valid, date: "2026-02-30" })],
    ["a missing date", () => HttpResponse.json({ base: "USD", quote: "UAH", rate: "45.436" })],
  ])("resolves as unavailable on %s", async (_name, resolver) => {
    replyWith(resolver);

    await expect(fetchRate(pair, open())).resolves.toEqual(unavailable);
  });

  it("resolves as unavailable when aborted", async () => {
    replyWith(() => HttpResponse.json(valid));
    const controller = new AbortController();
    controller.abort();

    await expect(fetchRate(pair, controller.signal)).resolves.toEqual(unavailable);
  });
});
