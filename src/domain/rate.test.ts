import { describe, expect, it } from "vitest";
import { rateToDecimalString } from "./rate";

describe("rateToDecimalString", () => {
  it("keeps a published rate's digits", () => {
    expect(rateToDecimalString(45.436)).toBe("45.436");
  });

  it("never uses exponent form for a tiny rate", () => {
    expect(rateToDecimalString(1e-7)).toBe("0.0000001");
  });

  it("never uses exponent form for a huge rate", () => {
    expect(rateToDecimalString(1e21)).toBe("1000000000000000000000");
  });
});
