import { describe, expect, it } from "vitest";
import {
  CHECK_COLUMNS,
  csvField,
  exportBaseName,
  exportJson,
  focusChecksToCsv,
  SESSION_COLUMNS,
  sessionsToCsv,
} from "../src/lib/export";
import { parseFocusChecks, parseSessions } from "../src/lib/records";
import { check, profile, round, session } from "./fixtures";

describe("csvField", () => {
  it("quotes only when needed and blanks non-finite numbers", () => {
    expect(csvField("plain")).toBe("plain");
    expect(csvField('say "hi", ok')).toBe('"say ""hi"", ok"');
    expect(csvField(0.123456)).toBe("0.1235");
    expect(csvField(Number.NaN)).toBe("");
    expect(csvField(null)).toBe("");
    expect(csvField(true)).toBe("true");
  });
});

describe("sessionsToCsv", () => {
  it("writes one row per round, oldest session first", () => {
    const csv = sessionsToCsv(profile, [
      session({ id: "b", startedAt: "2026-11-11T10:00:00.000Z" }),
      session({ id: "a", rounds: [round(), round({ stars: 3, meanScore: Number.NaN })] }),
    ]);
    const lines = csv.trimEnd().split("\r\n");
    expect(lines[0]).toBe(SESSION_COLUMNS.join(","));
    expect(lines).toHaveLength(4);
    expect(lines[1]).toBe(
      `Sam O'Neil,a,2026-11-10T16:00:00.000Z,balloon,tbr,demo,30,Cz,true,1,120,0.5,14.5,0.61,8`,
    );
    expect(lines[2]?.endsWith(",2,120,0.5,14.5,,3")).toBe(true);
    expect(lines[3]?.split(",")[1]).toBe("b");
  });
});

describe("focusChecksToCsv", () => {
  it("writes one row per check", () => {
    const lines = focusChecksToCsv(profile, [check()]).trimEnd().split("\r\n");
    expect(lines[0]).toBe(CHECK_COLUMNS.join(","));
    expect(lines[1]).toBe(
      `Sam O'Neil,c1,2026-11-11T16:00:00.000Z,demo,150,45,15,42,3,4,480,110,tbr,2.4`,
    );
  });
});

describe("exportJson", () => {
  it("includes the profile, totals and a disclaimer, and reads back", () => {
    const json = exportJson(
      profile,
      [session({ rounds: [round({ meanScore: Number.NaN })] })],
      [check()],
      new Date("2026-11-12T00:00:00Z"),
    );
    const data = JSON.parse(json);
    expect(data).toMatchObject({
      format: "eegkit-neurofeedback/child-export",
      version: 1,
      exportedAt: "2026-11-12T00:00:00.000Z",
      profile: { id: "kid-1", name: "Sam O'Neil" },
    });
    expect(data.note).toMatch(/Not a medical record/);
    expect(data.sessions[0].totals.stars).toBe(8);
    expect(data.sessions[0].rounds[0].meanScore).toBeNull();
    expect(parseSessions(JSON.stringify(data.sessions))).toHaveLength(1);
    expect(parseFocusChecks(JSON.stringify(data.focusChecks))).toEqual([check()]);
  });
});

describe("exportBaseName", () => {
  it("makes a safe file name", () => {
    expect(exportBaseName(profile, new Date("2026-11-12T08:00:00Z"))).toBe("sam-o-neil-2026-11-12");
    expect(exportBaseName({ ...profile, name: "Łukasz" }, new Date("2026-11-12T08:00:00Z"))).toBe(
      "ukasz-2026-11-12",
    );
  });
});
