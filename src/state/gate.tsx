import { createContext, type ReactNode, useContext, useMemo, useState } from "react";

interface GateContextValue {
  /** True after a grown-up passed the gate, until they return to the games. */
  readonly unlocked: boolean;
  readonly unlock: () => void;
  readonly lock: () => void;
}

const GateContext = createContext<GateContextValue>({
  unlocked: false,
  unlock: () => {},
  lock: () => {},
});

/** In memory only: reopening the app always starts in the kid area. */
export function GateProvider({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const value = useMemo(
    () => ({ unlocked, unlock: () => setUnlocked(true), lock: () => setUnlocked(false) }),
    [unlocked],
  );
  return <GateContext.Provider value={value}>{children}</GateContext.Provider>;
}

export function useGate(): GateContextValue {
  return useContext(GateContext);
}
