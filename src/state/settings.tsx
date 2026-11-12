import { createContext, type ReactNode, useCallback, useContext, useMemo } from "react";
import { DEFAULT_SETTINGS, parseSettings, type Settings } from "@/lib/settings";
import { usePersistentState } from "./storage";

interface SettingsContextValue {
  readonly settings: Settings;
  /** False until stored settings have been read. */
  readonly loaded: boolean;
  readonly update: (patch: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings, loaded] = usePersistentState(
    "@eegkit-neurofeedback/settings",
    DEFAULT_SETTINGS,
    parseSettings,
  );
  const update = useCallback(
    (patch: Partial<Settings>) => setSettings((current) => ({ ...current, ...patch })),
    [setSettings],
  );
  const value = useMemo(() => ({ settings, loaded, update }), [settings, loaded, update]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error("useSettings must be used inside <SettingsProvider>");
  return value;
}
