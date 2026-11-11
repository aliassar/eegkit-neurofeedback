import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/theme";
import { MAX_CONTENT_WIDTH, space } from "@/theme/tokens";
import { AppText } from "./AppText";
import { StatusPill } from "./StatusPill";

export interface ScreenProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly children: ReactNode;
  /** Render without a ScrollView, e.g. for the full-screen training view. */
  readonly fixed?: boolean;
}

export function Screen({ title, subtitle, children, fixed }: ScreenProps) {
  const { colors } = useTheme();
  const header = (
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
      <StatusPill />
    </View>
  );
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safe, { backgroundColor: colors.background }]}
    >
      {fixed ? (
        <View style={[styles.content, styles.fixed]}>
          {header}
          {children}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {header}
          {children}
        </ScrollView>
      )}
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
  fixed: { flex: 1 },
  header: { flexDirection: "row", alignItems: "flex-start", gap: space.md },
  titles: { flex: 1, gap: 2 },
});
