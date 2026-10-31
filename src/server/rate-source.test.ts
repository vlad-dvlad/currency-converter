// @vitest-environment node
import { describe, expect, it } from "vitest";
import { parseRateAnswer } from "./rate-source";

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
