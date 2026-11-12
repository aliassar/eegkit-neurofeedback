import { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";
import { useTheme } from "@/theme/theme";
import { space } from "@/theme/tokens";
import { AppText } from "./AppText";

const HEIGHT = 140;
const LEFT = 40;
const PAD = 10;
/** SVG text doesn't inherit the page font on the web. */
const FONT =
  Platform.OS === "web" ? "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" : undefined;

export interface TrendChartProps {
  /** Oldest first. NaN values are skipped. */
  readonly values: readonly number[];
  readonly yMin: number;
  readonly yMax: number;
  /** Labels for the bottom and top of the axis. */
  readonly formatY: (value: number) => string;
  readonly label: string;
  /** Captions under the first and last point, e.g. dates. */
  readonly firstLabel?: string;
  readonly lastLabel?: string;
}

/** A small line chart with dots, for trends across sessions. */
export function TrendChart({
  values,
  yMin,
  yMax,
  formatY,
  label,
  firstLabel,
  lastLabel,
}: TrendChartProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const plotW = Math.max(0, width - LEFT - PAD);
  const span = yMax - yMin || 1;
  const x = (i: number) =>
    LEFT + (values.length > 1 ? (i / (values.length - 1)) * plotW : plotW / 2);
  const y = (v: number) =>
    PAD + (1 - (Math.min(Math.max(v, yMin), yMax) - yMin) / span) * (HEIGHT - 2 * PAD);
  let path = "";
  values.forEach((v, i) => {
    if (!Number.isFinite(v)) return;
    path += `${path ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`;
  });
  const mid = (yMin + yMax) / 2;
  return (
    <View style={styles.wrap}>
      <View
        onLayout={(e) => setWidth(Math.floor(e.nativeEvent.layout.width))}
        accessible
        accessibilityLabel={label}
      >
        <Svg width={width} height={HEIGHT}>
          {[yMin, mid, yMax].map((v) => (
            <Line
              key={v}
              x1={LEFT}
              x2={LEFT + plotW}
              y1={y(v)}
              y2={y(v)}
              stroke={colors.grid}
              strokeWidth={1}
            />
          ))}
          {[yMin, mid, yMax].map((v) => (
            <SvgText
              key={`t${v}`}
              x={LEFT - 6}
              y={y(v) + 4}
              fontSize={11}
              fontFamily={FONT}
              fill={colors.textMuted}
              textAnchor="end"
            >
              {formatY(v)}
            </SvgText>
          ))}
          <Path
            d={path}
            stroke={colors.accent}
            strokeWidth={2}
            fill="none"
            strokeLinejoin="round"
          />
          {values.map((v, i) =>
            Number.isFinite(v) ? (
              // biome-ignore lint/suspicious/noArrayIndexKey: points are positional.
              <Circle key={i} cx={x(i)} cy={y(v)} r={3.5} fill={colors.accent} />
            ) : null,
          )}
        </Svg>
      </View>
      {firstLabel || lastLabel ? (
        <View style={[styles.axis, { paddingLeft: LEFT }]}>
          <AppText variant="caption" tone="muted">
            {firstLabel}
          </AppText>
          <AppText variant="caption" tone="muted">
            {lastLabel}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs },
  axis: { flexDirection: "row", justifyContent: "space-between" },
});
