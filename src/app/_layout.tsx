import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { EEGProvider } from "@/state/eeg";
import { GateProvider } from "@/state/gate";
import { ProfilesProvider } from "@/state/profiles";
import { RecordsProvider } from "@/state/records";
import { SettingsProvider } from "@/state/settings";
import { AppThemeProvider, useTheme } from "@/theme/theme";

/** Hands the app palette to the navigators (tab bar, screen backgrounds). */
function NavigationTheme({ children }: { children: ReactNode }) {
  const { scheme, colors } = useTheme();
  const base = scheme === "dark" ? DarkTheme : DefaultTheme;
  return (
    <ThemeProvider
      value={{
        ...base,
        dark: scheme === "dark",
        colors: {
          ...base.colors,
          primary: colors.accent,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
        },
      }}
    >
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      {children}
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SettingsProvider>
      <AppThemeProvider>
        <ProfilesProvider>
          <RecordsProvider>
            <EEGProvider>
              <GateProvider>
                <NavigationTheme>
                  <Stack screenOptions={{ headerShown: false }} />
                </NavigationTheme>
              </GateProvider>
            </EEGProvider>
          </RecordsProvider>
        </ProfilesProvider>
      </AppThemeProvider>
    </SettingsProvider>
  );
}
