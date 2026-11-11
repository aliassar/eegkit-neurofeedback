import type { ChannelQuality } from "eegkit";
import { StyleSheet, View } from "react-native";
import { describeQuality } from "@/lib/quality";
import { useTheme } from "@/theme/theme";
import { AppText } from "./AppText";

const LEVEL_LABEL = { good: "Good", fair: "Fair", poor: "Poor", unknown: "–" } as const;

/** Coloured dot, level and the reasons, e.g. "● Fair · Line noise". */
export function QualityBadge({ quality }: { readonly quality: ChannelQuality | undefined }) {
  const { colors } = useTheme();
  const view = describeQuality(quality);
  const color =
    view.level === "unknown"
      ? colors.neutral
      : { good: colors.good, fair: colors.fair, poor: colors.poor }[view.level];
  const detail = view.reasons.length > 0 ? view.summary : null;
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`Signal quality ${LEVEL_LABEL[view.level]}${detail ? `: ${detail}` : ""}`}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <AppText variant="label" style={{ color }}>
        {LEVEL_LABEL[view.level]}
      </AppText>
      {detail ? (
        <AppText variant="caption" tone="muted" numberOfLines={1} style={styles.detail}>
          {detail}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  detail: { flexShrink: 1 },
});
