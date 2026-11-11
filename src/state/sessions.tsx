import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { MAX_SESSIONS, parseSessions, type SessionRecord } from "@/lib/session";

const KEY = "@eegkit-neurofeedback/sessions";

interface SessionsContextValue {
  /** Newest first. */
  readonly sessions: readonly SessionRecord[];
  readonly loaded: boolean;
  readonly add: (session: SessionRecord) => void;
  readonly remove: (id: string) => void;
}

const SessionsContext = createContext<SessionsContextValue | null>(null);

export function SessionsProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<readonly SessionRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(KEY)
      .then((json) => {
        // Keep anything recorded while storage was still loading.
        if (!cancelled) setSessions((current) => [...current, ...parseSessions(json)]);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(KEY, JSON.stringify(sessions)).catch(() => {});
  }, [sessions, loaded]);

  const add = useCallback((session: SessionRecord) => {
    setSessions((current) => [session, ...current].slice(0, MAX_SESSIONS));
  }, []);
  const remove = useCallback((id: string) => {
    setSessions((current) => current.filter((s) => s.id !== id));
  }, []);

  const value = useMemo(() => ({ sessions, loaded, add, remove }), [sessions, loaded, add, remove]);
  return <SessionsContext.Provider value={value}>{children}</SessionsContext.Provider>;
}

export function useSessions(): SessionsContextValue {
  const value = useContext(SessionsContext);
  if (!value) throw new Error("useSessions must be used inside <SessionsProvider>");
  return value;
}
