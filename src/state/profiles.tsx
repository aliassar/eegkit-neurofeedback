import { createContext, type ReactNode, useCallback, useContext, useMemo } from "react";
import { type Profile, parseProfiles } from "@/lib/profiles";
import { useSettings } from "./settings";
import { usePersistentState } from "./storage";

interface ProfilesContextValue {
  readonly profiles: readonly Profile[];
  readonly loaded: boolean;
  /** The child who is playing: the selected one, or the first. */
  readonly active: Profile | undefined;
  readonly setActive: (id: string) => void;
  readonly add: (profile: Profile) => void;
  readonly update: (id: string, patch: Partial<Omit<Profile, "id">>) => void;
  readonly remove: (id: string) => void;
}

const ProfilesContext = createContext<ProfilesContextValue | null>(null);

export function ProfilesProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles, loaded] = usePersistentState<readonly Profile[]>(
    "@eegkit-neurofeedback/profiles",
    [],
    parseProfiles,
  );
  const { settings, update: updateSettings } = useSettings();
  const active = profiles.find((p) => p.id === settings.activeProfileId) ?? profiles[0];

  const setActive = useCallback(
    (id: string) => updateSettings({ activeProfileId: id }),
    [updateSettings],
  );
  const add = useCallback(
    (profile: Profile) => {
      setProfiles((current) => [...current, profile]);
      updateSettings({ activeProfileId: profile.id });
    },
    [setProfiles, updateSettings],
  );
  const update = useCallback(
    (id: string, patch: Partial<Omit<Profile, "id">>) =>
      setProfiles((current) => current.map((p) => (p.id === id ? { ...p, ...patch } : p))),
    [setProfiles],
  );
  const remove = useCallback(
    (id: string) => setProfiles((current) => current.filter((p) => p.id !== id)),
    [setProfiles],
  );

  const value = useMemo(
    () => ({ profiles, loaded, active, setActive, add, update, remove }),
    [profiles, loaded, active, setActive, add, update, remove],
  );
  return <ProfilesContext.Provider value={value}>{children}</ProfilesContext.Provider>;
}

export function useProfiles(): ProfilesContextValue {
  const value = useContext(ProfilesContext);
  if (!value) throw new Error("useProfiles must be used inside <ProfilesProvider>");
  return value;
}
