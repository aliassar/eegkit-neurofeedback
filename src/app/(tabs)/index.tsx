import { useBandPowers } from "eegkit-react";
import { useIsFocused, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { AppText } from "@/components/AppText";
import { BandBars } from "@/components/BandBars";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { LiveTraces } from "@/components/LiveTraces";
import { Screen } from "@/components/Screen";
import { Segmented } from "@/components/Segmented";
import { DEMO_STATES, type DemoStateId } from "@/lib/demo-source";
import { describeError } from "@/lib/errors";
import { meanPeakAlpha } from "@/lib/quality";
import { useEEGContext } from "@/state/eeg";
import { useSettings } from "@/state/settings";
import { space } from "@/theme/tokens";

const SCALES = [
  { value: 25, label: "±25 µV" },
  { value: 50, label: "±50" },
  { value: 100, label: "±100" },
] as const;

const DEMO_OPTIONS = (Object.keys(DEMO_STATES) as DemoStateId[]).map((id) => ({
  value: id,
  label: DEMO_STATES[id].label,
}));

export default function LiveScreen() {
  const { eeg, kind, active, connect, demoState, setDemoState } = useEEGContext();
  const { settings } = useSettings();
  const router = useRouter();
  const focused = useIsFocused();
  const { width } = useWindowDimensions();
  const [microvolts, setMicrovolts] = useState<number>(50);
  const powers = useBandPowers(eeg);
  const peak = meanPeakAlpha(eeg.result);
  const wide = width >= 1100;
  const error = describeError(eeg.error);

  const subtitle =
    kind === "demo"
      ? "Simulated EEG, generated on this device by eegkit."
      : `${settings.websocket.url} · ${settings.websocket.sampleRate} Hz`;

  if (!active) {
    return (
      <Screen title="Live signal" subtitle={subtitle}>
        <Card title="Not connected">
          <AppText tone="muted">
            {kind === "demo"
              ? "The demo stream is paused."
              : "Connect to your WebSocket stream to see live data. Check the address in Setup first."}
          </AppText>
          <View style={styles.actions}>
            <Button label="Connect" onPress={connect} />
            <Button
              label="Open setup"
              variant="secondary"
              onPress={() => router.navigate("/setup")}
            />
          </View>
        </Card>
      </Screen>
    );
  }

  const signal = (
    <Card
      title="Signal"
      style={wide && styles.main}
      accessory={
        <View style={styles.scale}>
          <Segmented
            label="Vertical scale"
            options={SCALES}
            value={microvolts}
            onChange={setMicrovolts}
          />
        </View>
      }
    >
      {eeg.labels.length > 0 && focused ? (
        <LiveTraces microvolts={microvolts} />
      ) : (
        <AppText tone="muted">Waiting for data…</AppText>
      )}
      <AppText variant="caption" tone="muted">
        Last 5 seconds, high-passed at 1 Hz for display. Quality is checked on the raw signal every
        quarter second.
      </AppText>
    </Card>
  );

  const analysis = (
    <View style={[styles.column, wide && styles.side]}>
      <Card title="Band power">
        <BandBars powers={powers} />
        <AppText variant="caption" tone="muted">
          Share of 1–45 Hz power over the last 2 seconds, averaged across channels.
        </AppText>
      </Card>
      <Card title="Peak alpha frequency">
        <AppText variant="metric" numeric accessibilityLiveRegion="none">
          {Number.isFinite(peak) ? `${peak.toFixed(1)} Hz` : "–"}
        </AppText>
        <AppText variant="caption" tone="muted">
          Where alpha (7–14 Hz) is strongest, averaged across channels. Most adults sit between 9
          and 11 Hz.
        </AppText>
      </Card>
    </View>
  );

  return (
    <Screen title="Live signal" subtitle={subtitle}>
      {error ? (
        <Card style={styles.error}>
          <AppText tone="poor" accessibilityLiveRegion="polite">
            {error}
          </AppText>
        </Card>
      ) : null}
      {kind === "demo" ? (
        <Card title="Simulated state">
          <Segmented
            label="Simulated brain state"
            options={DEMO_OPTIONS}
            value={demoState}
            onChange={setDemoState}
          />
          <AppText variant="caption" tone="muted">
            {DEMO_STATES[demoState].description}. Shifts the synthetic band powers over a few
            seconds so you can watch the analysis respond. This is simulated data, not a brain.
          </AppText>
        </Card>
      ) : null}
      {wide ? (
        <View style={styles.row}>
          {signal}
          {analysis}
        </View>
      ) : (
        <>
          {signal}
          {analysis}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: "row", flexWrap: "wrap", gap: space.md },
  row: { flexDirection: "row", gap: space.lg, alignItems: "flex-start" },
  main: { flex: 3 },
  side: { flex: 2 },
  column: { gap: space.lg },
  scale: { width: 210 },
  error: { borderColor: "transparent" },
});
