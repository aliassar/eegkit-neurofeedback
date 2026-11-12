import AsyncStorage from "@react-native-async-storage/async-storage";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";

/**
 * State mirrored to AsyncStorage under `key`. `loaded` turns true once the
 * stored value has been read; nothing is written before that, so a slow read
 * can't overwrite stored data with the initial value.
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
  parse: (json: string | null) => T,
): [T, Dispatch<SetStateAction<T>>, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: read once per key; `parse` is a module function.
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(key)
      .then((json) => {
        if (!cancelled) setValue(parse(json));
      })
      .catch(() => {
        // Storage unavailable (e.g. private browsing): start empty.
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
  }, [key, value, loaded]);

  return [value, setValue, loaded];
}
