import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/theme";
import { MAX_CONTENT_WIDTH, space } from "@/theme/tokens";
import { AppText } from "./AppText";

export interface ScreenProps {
  readonly title: string;
  readonly subtitle?: string;
  /** Shown to the right of the title, e.g. a button back to the games. */
  readonly actions?: ReactNode;
  readonly children: ReactNode;
}

/** A scrolling grown-up screen with a title, centred and width-limited on large screens. */
export function Screen({ title, subtitle, actions, children }: ScreenProps) {
  const { colors } = useTheme();
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safe, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.titles}>
            <AppText variant="title" accessibilityRole="header">
              {title}
            </AppText>
            {subtitle ? (
              <AppText variant="body" tone="muted">
                {subtitle}
              </AppText>
            ) : null}
          </View>
          {actions}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: "center",
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.xxl,
    gap: space.lg,
  },
  header: { flexDirection: "row", alignItems: "flex-start", gap: space.md },
  titles: { flex: 1, gap: 2 },
});
