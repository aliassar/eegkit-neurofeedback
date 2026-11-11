import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Line, Path, Rect } from "react-native-svg";
import { REWARD_THRESHOLD } from "@/lib/protocols";
import { formatDuration } from "@/lib/session";
import { seriesPath } from "@/lib/trace";
import { useTheme } from "@/theme/theme";
import { space } from "@/theme/tokens";
import { AppText } from "./AppText";

const HEIGHT = 120;

/** Score over a session, with the reward zone shaded and the baseline level marked. */
export function ScoreChart({
  series,
  durationSeconds,
}: {
  readonly series: readonly number[];
  readonly durationSeconds: number;
}) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const zoneTop = 0;
  const zoneBottom = HEIGHT * (1 - REWARD_THRESHOLD);
  return (
    <View style={styles.wrap}>
      <View
        onLayout={(e) => setWidth(Math.floor(e.nativeEvent.layout.width))}
        accessible
        accessibilityLabel="Chart of the feedback score over the session"
      >
        <Svg width={width} height={HEIGHT}>
          <Rect x={0} y={zoneTop} width={width} height={zoneBottom} fill={colors.accentSoft} />
          <Line
            x1={0}
            x2={width}
            y1={HEIGHT / 2}
            y2={HEIGHT / 2}
            stroke={colors.grid}
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          <Path
            d={seriesPath(series, width, HEIGHT)}
            stroke={colors.accent}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </View>
      <View style={styles.axis}>
        <AppText variant="caption" tone="muted">
          0:00
        </AppText>
        <AppText variant="caption" tone="muted">
          Shaded: reward zone · dashed: baseline
        </AppText>
        <AppText variant="caption" tone="muted" numeric>
          {formatDuration(durationSeconds)}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs },
  axis: { flexDirection: "row", justifyContent: "space-between", gap: space.sm },
});
