import { describe, expect, it } from "vitest";
import { formatDuration, formatPercent, mean } from "../src/lib/format";

describe("format", () => {
  it("formats durations", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(3725)).toBe("1:02:05");
  });

  it("formats percentages", () => {
    expect(formatPercent(0.734)).toBe("73%");
    expect(formatPercent(Number.NaN)).toBe("–");
  });

  it("averages finite values", () => {
    expect(mean([1, 2, Number.NaN, 3])).toBe(2);
    expect(mean([])).toBeNaN();
  });
});
