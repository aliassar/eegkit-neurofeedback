import { useTrace } from "eegkit-react";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Line, Path } from "react-native-svg";
import { tracePath } from "@/lib/trace";
import { useEEGContext } from "@/state/eeg";
import { useTheme } from "@/theme/theme";
import { space } from "@/theme/tokens";
import { AppText } from "./AppText";
import { QualityBadge } from "./QualityBadge";

const SECONDS = 5;
const ROW_HEIGHT = 64;

/** Scrolling traces, one row per channel, with that channel's signal quality. */
export function LiveTraces({ microvolts }: { readonly microvolts: number }) {
  const { eeg } = useEEGContext();
  const { colors } = useTheme();
  const trace = useTrace(eeg, { seconds: SECONDS, fps: 30 });
  const [width, setWidth] = useState(0);
  const capacity = Math.round(SECONDS * eeg.sampleRate);

  return (
    <View style={styles.rows} onLayout={(e) => setWidth(Math.floor(e.nativeEvent.layout.width))}>
      {eeg.labels.map((label, c) => (
        <View key={label} style={styles.row}>
          <View style={styles.rowHeader}>
            <AppText variant="label" style={styles.label}>
              {label}
            </AppText>
            <QualityBadge quality={eeg.result?.channels[c]?.quality} />
          </View>
          <Svg
            width={width}
            height={ROW_HEIGHT}
            accessibilityLabel={`${label} trace, last ${SECONDS} seconds`}
          >
            <Line
              x1={0}
              x2={width}
              y1={ROW_HEIGHT / 2}
              y2={ROW_HEIGHT / 2}
              stroke={colors.grid}
              strokeWidth={1}
            />
            <Path
              d={tracePath(trace.data[c] ?? [], capacity, width, ROW_HEIGHT, microvolts)}
              stroke={colors.accent}
              strokeWidth={1.5}
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  rows: { gap: space.md },
  row: { gap: space.xs },
  rowHeader: { flexDirection: "row", alignItems: "center", gap: space.md },
  label: { minWidth: 36 },
});
