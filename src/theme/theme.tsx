import { createContext, type ReactNode, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";
import { useSettings } from "@/state/settings";
import { dark, light, type Palette } from "./tokens";

interface Theme {
  readonly scheme: "dark" | "light";
  readonly colors: Palette;
}

const ThemeContext = createContext<Theme>({ scheme: "dark", colors: dark });

/** Follows the appearance setting; "system" follows the OS, falling back to dark. */
export function AppThemeProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const system = useColorScheme();
  const scheme =
    settings.theme === "system" ? (system === "light" ? "light" : "dark") : settings.theme;
  const value = useMemo<Theme>(
    () => ({ scheme, colors: scheme === "dark" ? dark : light }),
    [scheme],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
