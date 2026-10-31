import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const { scripts } = JSON.parse(readFileSync("package.json", "utf8")) as {
  scripts: Record<string, string>;
};

describe("documented run commands", () => {
  it("binds the dev server to the loopback address", () => {
    expect(scripts.dev).toBe("next dev -H 127.0.0.1");
  });

  it("binds the production server to the loopback address", () => {
    expect(scripts.start).toBe("next start -H 127.0.0.1");
  });
});
