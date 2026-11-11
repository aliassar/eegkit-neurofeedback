import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  draftFromSettings,
  mixedContentWarning,
  parseChannelLabels,
  parseSettings,
  validateWebSocketDraft,
} from "../src/lib/settings";

describe("parseChannelLabels", () => {
  it("trims labels and drops empty ones", () => {
    expect(parseChannelLabels(" Fz, Cz,,Pz ,")).toEqual(["Fz", "Cz", "Pz"]);
    expect(parseChannelLabels("")).toEqual([]);
  });
});

describe("validateWebSocketDraft", () => {
  const valid = { url: " ws://192.168.1.20:8765/eeg ", sampleRate: "250", channels: "C3, Cz, C4" };

  it("accepts a valid draft and normalises it", () => {
    expect(validateWebSocketDraft(valid, 50)).toEqual({
      ok: true,
      value: { url: "ws://192.168.1.20:8765/eeg", sampleRate: 250, channels: ["C3", "Cz", "C4"] },
    });
  });

  it("accepts wss and fractional rates", () => {
    const result = validateWebSocketDraft(
      { ...valid, url: "wss://example.org", sampleRate: "250.5" },
      60,
    );
    expect(result.ok).toBe(true);
  });

  it("reports every invalid field", () => {
    const result = validateWebSocketDraft(
      { url: "http://x", sampleRate: "abc", channels: " , " },
      50,
    );
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(Object.keys(result.errors).sort()).toEqual(["channels", "sampleRate", "url"]);
  });

  it("requires a sample rate above twice the mains frequency", () => {
    const at120 = validateWebSocketDraft({ ...valid, sampleRate: "120" }, 60);
    expect(at120.ok).toBe(false);
    if (!at120.ok) expect(at120.errors.sampleRate).toMatch(/above 120 Hz/);
    expect(validateWebSocketDraft({ ...valid, sampleRate: "120" }, 50).ok).toBe(true);
  });

  it("rejects duplicate or over-long labels", () => {
    expect(validateWebSocketDraft({ ...valid, channels: "Cz, Cz" }, 50).ok).toBe(false);
    expect(validateWebSocketDraft({ ...valid, channels: "x".repeat(17) }, 50).ok).toBe(false);
  });

  it("round-trips through draftFromSettings", () => {
    const draft = draftFromSettings(DEFAULT_SETTINGS.websocket);
    const result = validateWebSocketDraft(draft, 50);
    expect(result).toEqual({ ok: true, value: DEFAULT_SETTINGS.websocket });
  });
});

describe("mixedContentWarning", () => {
  it("warns only for insecure, non-local sockets on https pages", () => {
    expect(mixedContentWarning("https:", "ws://192.168.1.2:8765")).toMatch(/wss/);
    expect(mixedContentWarning("https:", "ws://localhost:8765")).toBeNull();
    expect(mixedContentWarning("https:", "ws://127.0.0.1:8765")).toBeNull();
    expect(mixedContentWarning("https:", "wss://example.org")).toBeNull();
    expect(mixedContentWarning("http:", "ws://192.168.1.2:8765")).toBeNull();
    expect(mixedContentWarning(undefined, "ws://192.168.1.2:8765")).toBeNull();
  });
});

describe("parseSettings", () => {
  it("returns defaults for missing or broken JSON", () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings("{oops")).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings("42")).toEqual(DEFAULT_SETTINGS);
  });

  it("keeps valid fields and defaults invalid ones", () => {
    const stored = JSON.stringify({
      source: "websocket",
      mains: 60,
      websocket: { url: "ws://10.0.0.5:9000", sampleRate: 500, channels: ["O1", "O2"] },
      baselineSeconds: 45,
      sessionMinutes: 10,
      theme: "purple",
    });
    expect(parseSettings(stored)).toEqual({
      source: "websocket",
      mains: 60,
      websocket: { url: "ws://10.0.0.5:9000", sampleRate: 500, channels: ["O1", "O2"] },
      baselineSeconds: 30,
      sessionMinutes: 10,
      theme: "system",
    });
  });

  it("drops a stored WebSocket config that no longer validates", () => {
    const stored = JSON.stringify({
      websocket: { url: "nope", sampleRate: 256, channels: ["Cz"] },
    });
    expect(parseSettings(stored).websocket).toEqual(DEFAULT_SETTINGS.websocket);
  });
});
