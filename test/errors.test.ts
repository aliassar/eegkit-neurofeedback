import { describe, expect, it } from "vitest";
import { describeError } from "../src/lib/errors";

describe("describeError", () => {
  it("explains a channel-count mismatch", () => {
    const message = describeError(new RangeError("expected 4 channels per frame, got 8"));
    expect(message).toMatch(/sends 8 values per sample, but 4 channel labels/);
  });

  it("gives socket error events a useful message", () => {
    expect(describeError({ type: "error" })).toMatch(/Can't reach the server/);
  });

  it("passes other messages through", () => {
    expect(describeError(new Error("boom"))).toBe("boom");
    expect(describeError("plain")).toBe("plain");
    expect(describeError(undefined)).toBeNull();
  });
});
