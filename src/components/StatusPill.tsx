import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useEEGContext } from "@/state/eeg";
import { useTheme } from "@/theme/theme";
import { radius, space } from "@/theme/tokens";
import { AppText } from "./AppText";

/** Source and connection state; tapping it opens Setup. */
export function StatusPill() {
  const { eeg, kind, active } = useEEGContext();
  const { colors } = useTheme();
  const router = useRouter();
  const status = active ? eeg.status : "idle";
  const [label, color] =
    status === "open"
      ? ["Streaming", colors.good]
      : status === "connecting"
        ? [eeg.error ? "Retrying" : "Connecting", colors.fair]
        : status === "error"
          ? ["Error", colors.poor]
          : ["Disconnected", colors.neutral];
  const source = kind === "demo" ? "Demo" : "WebSocket";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${source} source, ${label}. Open setup.`}
      onPress={() => router.navigate("/setup")}
      hitSlop={8}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <AppText variant="label" numberOfLines={1}>
        {source}
      </AppText>
      <AppText variant="caption" tone="muted" numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 36,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
