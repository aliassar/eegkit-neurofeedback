import { type EEGSource, type EEGState, useEEG, webSocketSource } from "eegkit-react";
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { type DemoSource, type DemoStateId, demoSource } from "@/lib/demo-source";
import { ANALYSIS_BANDS } from "@/lib/protocols";
import { DEMO_STREAM, type SourceKind } from "@/lib/settings";
import { useSettings } from "./settings";

interface EEGContextValue {
  readonly eeg: EEGState;
  readonly kind: SourceKind;
  /** Whether the selected source should be connected. */
  readonly active: boolean;
  readonly connect: () => void;
  readonly disconnect: () => void;
  /** Simulated brain state of the demo source. */
  readonly demoState: DemoStateId;
  readonly setDemoState: (state: DemoStateId) => void;
}

const EEGContext = createContext<EEGContextValue | null>(null);

/**
 * One EEG connection for the whole app, so the signal check, the games and
 * the focus check share it. The demo connects by itself, so the web demo shows data straight away;
 * a WebSocket waits for "Connect".
 */
export function EEGProvider({ children }: { children: ReactNode }) {
  const { settings, loaded } = useSettings();
  const kind = settings.source;
  const [demoActive, setDemoActive] = useState(true);
  const [socketActive, setSocketActive] = useState(false);
  const [demoState, setDemoState] = useState<DemoStateId>("neutral");
  const active = kind === "demo" ? demoActive : socketActive;

  const { url, sampleRate, channels } = settings.websocket;
  const channelKey = channels.join("\u0000");
  const mains = settings.mains;

  const source = useMemo<EEGSource | null>(() => {
    if (!(loaded && active)) return null;
    if (kind === "demo") {
      return demoSource({
        sampleRate: DEMO_STREAM.sampleRate,
        channels: DEMO_STREAM.channels,
        mains,
      });
    }
    return webSocketSource(url, { sampleRate, channels: channelKey.split("\u0000") });
  }, [loaded, active, kind, mains, url, sampleRate, channelKey]);

  useEffect(() => {
    if (source && "setState" in source) (source as DemoSource).setState(demoState);
  }, [source, demoState]);

  // SMR is measured alongside the standard bands for the SMR protocol.
  const eeg = useEEG(source, { notch: mains, bands: ANALYSIS_BANDS });

  const value = useMemo<EEGContextValue>(
    () => ({
      eeg,
      kind,
      active,
      connect: () => (kind === "demo" ? setDemoActive(true) : setSocketActive(true)),
      disconnect: () => (kind === "demo" ? setDemoActive(false) : setSocketActive(false)),
      demoState,
      setDemoState,
    }),
    [eeg, kind, active, demoState],
  );
  return <EEGContext.Provider value={value}>{children}</EEGContext.Provider>;
}

export function useEEGContext(): EEGContextValue {
  const value = useContext(EEGContext);
  if (!value) throw new Error("useEEGContext must be used inside <EEGProvider>");
  return value;
}
