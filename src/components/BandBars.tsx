import type { BandPowers } from "eegkit";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@/theme/theme";
import { radius, space } from "@/theme/tokens";
import { AppText } from "./AppText";

const BANDS = [
  { key: "delta", name: "Delta", range: "1–4 Hz" },
  { key: "theta", name: "Theta", range: "4–8 Hz" },
  { key: "alpha", name: "Alpha", range: "8–13 Hz" },
  { key: "beta", name: "Beta", range: "13–30 Hz" },
  { key: "gamma", name: "Gamma", range: "30–45 Hz" },
] as const;

/** Relative band power (share of 1–45 Hz power) as horizontal bars. */
export function BandBars({ powers }: { readonly powers: BandPowers | undefined }) {
  const { colors } = useTheme();
  return (
    <View style={styles.list}>
      {BANDS.map((band) => {
        const value = powers?.[band.key];
        const fraction = value !== undefined && Number.isFinite(value) ? value : 0;
        const percent = powers ? `${Math.round(fraction * 100)}%` : "–";
        return (
          <View
            key={band.key}
            style={styles.row}
            accessible
            accessibilityLabel={`${band.name}, ${band.range}: ${percent}`}
          >
            <View style={styles.labels}>
              <AppText variant="label">{band.name}</AppText>
              <AppText variant="caption" tone="muted">
                {band.range}
              </AppText>
            </View>
            <View style={[styles.track, { backgroundColor: colors.surfaceRaised }]}>
              <View
                style={[
                  styles.fill,
                  {
                    backgroundColor: colors.bands[band.key],
                    width: `${Math.min(fraction, 1) * 100}%`,
                  },
                ]}
              />
            </View>
            <AppText variant="label" numeric style={styles.value}>
              {percent}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.md },
  row: { flexDirection: "row", alignItems: "center", gap: space.md },
  labels: { width: 76 },
  track: { flex: 1, height: 10, borderRadius: radius.pill, overflow: "hidden" },
  fill: { height: "100%", borderRadius: radius.pill },
  value: { width: 44, textAlign: "right" },
});
