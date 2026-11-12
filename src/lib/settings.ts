/** Device settings: types, defaults, validation and tolerant parsing of stored JSON. */

export type SourceKind = "demo" | "websocket";
export type Mains = 50 | 60;
export type ThemePreference = "system" | "dark" | "light";

export interface WebSocketSettings {
  readonly url: string;
  readonly sampleRate: number;
  readonly channels: readonly string[];
}

export interface Settings {
  readonly source: SourceKind;
  /** Mains frequency to notch out and to check for line noise. */
  readonly mains: Mains;
  readonly websocket: WebSocketSettings;
  readonly theme: ThemePreference;
  /** The child who is playing, or null before any profile exists. */
  readonly activeProfileId: string | null;
}

/** The synthetic demo stream: central and frontal sites, as used for attention training. */
export const DEMO_STREAM = { sampleRate: 256, channels: ["Fz", "Cz", "C3", "C4"] } as const;

export const MAX_CHANNELS = 64;
export const MAX_LABEL_LENGTH = 16;
export const MAX_SAMPLE_RATE = 10_000;

export const DEFAULT_SETTINGS: Settings = {
  source: "demo",
  mains: 50,
  websocket: { url: "ws://localhost:8765", sampleRate: 256, channels: ["Cz"] },
  theme: "system",
  activeProfileId: null,
};

/** Splits `"Fz, Cz,,Pz "` into `["Fz", "Cz", "Pz"]`. */
export function parseChannelLabels(text: string): string[] {
  return text
    .split(",")
    .map((label) => label.trim())
    .filter((label) => label.length > 0);
}

/** The text form of a WebSocket configuration, as typed into the setup form. */
export interface WebSocketDraft {
  readonly url: string;
  readonly sampleRate: string;
  readonly channels: string;
}

export type DraftErrors = Partial<Record<keyof WebSocketDraft, string>>;

export type DraftResult =
  | { readonly ok: true; readonly value: WebSocketSettings }
  | { readonly ok: false; readonly errors: DraftErrors };

export function draftFromSettings(ws: WebSocketSettings): WebSocketDraft {
  return { url: ws.url, sampleRate: String(ws.sampleRate), channels: ws.channels.join(", ") };
}

const WS_URL = /^wss?:\/\/[^\s/?#]+[^\s]*$/i;
const NUMBER = /^\d+(?:\.\d+)?$/;

/**
 * Validates the setup form. The sample rate must be above twice the mains
 * frequency, otherwise the notch filter can't be designed.
 */
export function validateWebSocketDraft(draft: WebSocketDraft, mains: Mains): DraftResult {
  const errors: DraftErrors = {};
  const url = draft.url.trim();
  if (!WS_URL.test(url)) errors.url = "Enter a ws:// or wss:// address, e.g. ws://localhost:8765";

  const rateText = draft.sampleRate.trim();
  const sampleRate = Number(rateText);
  if (!NUMBER.test(rateText) || !Number.isFinite(sampleRate)) {
    errors.sampleRate = "Enter the sample rate in Hz, e.g. 256";
  } else if (sampleRate <= 2 * mains) {
    errors.sampleRate = `Must be above ${2 * mains} Hz to filter ${mains} Hz mains noise`;
  } else if (sampleRate > MAX_SAMPLE_RATE) {
    errors.sampleRate = `Must be at most ${MAX_SAMPLE_RATE} Hz`;
  }

  const channels = parseChannelLabels(draft.channels);
  if (channels.length === 0) {
    errors.channels = "Enter at least one channel label, e.g. Cz";
  } else if (channels.length > MAX_CHANNELS) {
    errors.channels = `At most ${MAX_CHANNELS} channels`;
  } else if (new Set(channels).size !== channels.length) {
    errors.channels = "Channel labels must be unique";
  } else if (channels.some((c) => c.length > MAX_LABEL_LENGTH)) {
    errors.channels = `Labels can be at most ${MAX_LABEL_LENGTH} characters`;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { url, sampleRate, channels } };
}

/**
 * Browsers block insecure `ws://` connections from an `https://` page, except
 * to the local machine. Returns a hint when that is about to happen.
 */
export function mixedContentWarning(pageProtocol: string | undefined, url: string): string | null {
  if (pageProtocol !== "https:") return null;
  const match = /^ws:\/\/(\[[^\]]+\]|[^/:?#]+)/i.exec(url.trim());
  if (!match) return null;
  const host = (match[1] as string).toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return null;
  return "This page is served over https, so the browser only allows wss:// or ws://localhost. Use wss://, a local bridge, or run the app locally.";
}

export const oneOf = <T>(value: unknown, options: readonly T[], fallback: T): T =>
  options.includes(value as T) ? (value as T) : fallback;

/** Reads stored settings, keeping every valid field and defaulting the rest. Never throws. */
export function parseSettings(json: string | null | undefined): Settings {
  if (!json) return DEFAULT_SETTINGS;
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return DEFAULT_SETTINGS;
  }
  if (raw === null || typeof raw !== "object") return DEFAULT_SETTINGS;
  const r = raw as Record<string, unknown>;
  const d = DEFAULT_SETTINGS;
  const mains = oneOf<Mains>(r.mains, [50, 60], d.mains);

  let websocket = d.websocket;
  if (r.websocket !== null && typeof r.websocket === "object") {
    const w = r.websocket as Record<string, unknown>;
    const draft: WebSocketDraft = {
      url: typeof w.url === "string" ? w.url : d.websocket.url,
      sampleRate: typeof w.sampleRate === "number" ? String(w.sampleRate) : "",
      channels: Array.isArray(w.channels)
        ? w.channels.filter((c) => typeof c === "string").join(",")
        : "",
    };
    const result = validateWebSocketDraft(draft, mains);
    if (result.ok) websocket = result.value;
  }

  return {
    source: oneOf<SourceKind>(r.source, ["demo", "websocket"], d.source),
    mains,
    websocket,
    theme: oneOf<ThemePreference>(r.theme, ["system", "dark", "light"], d.theme),
    activeProfileId: typeof r.activeProfileId === "string" ? r.activeProfileId : null,
  };
}
