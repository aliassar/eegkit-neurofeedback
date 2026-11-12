import { createContext, type ReactNode, useCallback, useContext, useMemo } from "react";
import {
  type FocusCheckRecord,
  parseFocusChecks,
  parseSessions,
  type SessionRecord,
} from "@/lib/records";
import { usePersistentState } from "./storage";

/** Newest first; a cap keeps storage small. */
const MAX_SESSIONS = 1000;
const MAX_CHECKS = 300;

interface RecordsContextValue {
  readonly sessions: readonly SessionRecord[];
  readonly checks: readonly FocusCheckRecord[];
  readonly loaded: boolean;
  readonly addSession: (session: SessionRecord) => void;
  readonly addCheck: (check: FocusCheckRecord) => void;
  /** Deletes everything recorded for a child. */
  readonly removeProfileData: (profileId: string) => void;
}

const RecordsContext = createContext<RecordsContextValue | null>(null);

export function RecordsProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions, sessionsLoaded] = usePersistentState<readonly SessionRecord[]>(
    "@eegkit-neurofeedback/sessions",
    [],
    parseSessions,
  );
  const [checks, setChecks, checksLoaded] = usePersistentState<readonly FocusCheckRecord[]>(
    "@eegkit-neurofeedback/focus-checks",
    [],
    parseFocusChecks,
  );

  const addSession = useCallback(
    (s: SessionRecord) => setSessions((current) => [s, ...current].slice(0, MAX_SESSIONS)),
    [setSessions],
  );
  const addCheck = useCallback(
    (c: FocusCheckRecord) => setChecks((current) => [c, ...current].slice(0, MAX_CHECKS)),
    [setChecks],
  );
  const removeProfileData = useCallback(
    (profileId: string) => {
      setSessions((current) => current.filter((s) => s.profileId !== profileId));
      setChecks((current) => current.filter((c) => c.profileId !== profileId));
    },
    [setSessions, setChecks],
  );

  const loaded = sessionsLoaded && checksLoaded;
  const value = useMemo(
    () => ({ sessions, checks, loaded, addSession, addCheck, removeProfileData }),
    [sessions, checks, loaded, addSession, addCheck, removeProfileData],
  );
  return <RecordsContext.Provider value={value}>{children}</RecordsContext.Provider>;
}

export function useRecords(): RecordsContextValue {
  const value = useContext(RecordsContext);
  if (!value) throw new Error("useRecords must be used inside <RecordsProvider>");
  return value;
}

/** One child's sessions and checks, newest first. */
export function useChildRecords(profileId: string | undefined) {
  const { sessions, checks } = useRecords();
  return useMemo(
    () => ({
      sessions: sessions.filter((s) => s.profileId === profileId),
      checks: checks.filter((c) => c.profileId === profileId),
    }),
    [sessions, checks, profileId],
  );
}
