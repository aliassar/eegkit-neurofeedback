import { StyleSheet, View } from "react-native";
import { formatDuration, formatPercent, type SessionSummary } from "@/lib/session";
import { useTheme } from "@/theme/theme";
import { radius, space } from "@/theme/tokens";
import { AppText } from "./AppText";

/** Duration, mean score and time in the reward zone as three tiles. */
export function SessionStats({ summary }: { readonly summary: SessionSummary }) {
  const { colors } = useTheme();
  const stats = [
    { label: "Duration", value: formatDuration(summary.durationSeconds) },
    { label: "Mean score", value: formatPercent(summary.meanScore) },
    { label: "Reward zone", value: formatPercent(summary.rewardFraction) },
  ];
  return (
    <View style={styles.row}>
      {stats.map((stat) => (
        <View
          key={stat.label}
          style={[styles.tile, { backgroundColor: colors.surfaceRaised }]}
          accessible
          accessibilityLabel={`${stat.label}: ${stat.value}`}
        >
          <AppText variant="heading" numeric>
            {stat.value}
          </AppText>
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {stat.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: space.sm },
  tile: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: space.md,
    paddingHorizontal: space.sm,
    gap: 2,
    alignItems: "center",
  },
});
