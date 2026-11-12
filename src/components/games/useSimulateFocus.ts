import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import { useEEGContext } from "@/state/eeg";

/**
 * Demo only: while held (the on-screen button, or Space on the web) the
 * synthetic EEG moves towards the "focused" pattern. Released, it returns to
 * resting. Does nothing for a real source.
 */
export function useSimulateFocus(enabled: boolean) {
  const { kind, setDemoState } = useEEGContext();
  const available = kind === "demo" && enabled;
  const [holding, setHolding] = useState(false);

  useEffect(() => {
    setDemoState(available && holding ? "focused" : "neutral");
  }, [available, holding, setDemoState]);
  // Never leave the demo stuck in "focused".
  useEffect(() => () => setDemoState("neutral"), [setDemoState]);

  useEffect(() => {
    if (!available || Platform.OS !== "web" || typeof window === "undefined") return;
    const down = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      e.preventDefault();
      setHolding(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") setHolding(false);
    };
    const blur = () => setHolding(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [available]);

  const press = useCallback(() => setHolding(true), []);
  const release = useCallback(() => setHolding(false), []);
  return { available, holding, press, release };
}
