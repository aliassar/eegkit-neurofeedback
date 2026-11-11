import { useNeurofeedback } from "eegkit-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Switch, useWindowDimensions, View } from "react-native";
import { type Protocol, protocolMetric, REWARD_THRESHOLD } from "@/lib/protocols";
import { qualityGate } from "@/lib/quality";
import {
  formatDuration,
  type ScoreSample,
  type SessionSummary,
  summarizeSession,
} from "@/lib/session";
import { useEEGContext } from "@/state/eeg";
import { useTheme } from "@/theme/theme";
import { radius, space } from "@/theme/tokens";
import { AppText } from "./AppText";
import { Button } from "./Button";
import { Card } from "./Card";
import { Orb } from "./Orb";

/** Sessions shorter than this aren't worth keeping. */
const MIN_SAVED_SECONDS = 10;

export interface FinishedSession extends SessionSummary {
  readonly startedAt: number;
}

export interface TrainingSessionProps {
  readonly protocol: Protocol;
  readonly baselineSeconds: number;
  readonly targetSeconds: number;
  /** Called with the summary, or `null` when ended before enough training to save. */
  readonly onFinish: (session: FinishedSession | null) => void;
}

/**
 * Baseline, then training. Mounting this starts the baseline, because
 * `useNeurofeedback` starts recording when it subscribes.
 */
export function TrainingSession({
  protocol,
  baselineSeconds,
  targetSeconds,
  onFinish,
}: TrainingSessionProps) {
  const { eeg, kind, demoState, setDemoState } = useEEGContext();
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const nf = useNeurofeedback(eeg, {
    metric: (result) => protocolMetric(protocol, result),
    direction: protocol.direction,
    baselineSeconds,
  });

  const gate = qualityGate(eeg.result);
  const signalOk = eeg.status === "open" && gate.status === "ready";
  const training = nf.phase === "training";

  const startRef = useRef<number | null>(null);
  const finishedRef = useRef(false);
  const samplesRef = useRef<ScoreSample[]>([]);
  const [now, setNow] = useState(() => Date.now());

  // The baseline should describe the user at rest, not a simulation left on.
  useEffect(() => {
    setDemoState("neutral");
    return () => setDemoState("neutral");
  }, [setDemoState]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);

  // Record the score whenever it changes; NaN marks time without usable signal.
  useEffect(() => {
    if (!training) return;
    const t = Date.now();
    if (startRef.current === null) startRef.current = t;
    samplesRef.current.push({ t: t - startRef.current, score: signalOk ? nf.score : Number.NaN });
  }, [training, signalOk, nf.score]);

  const elapsed = startRef.current === null ? 0 : (now - startRef.current) / 1000;

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const start = startRef.current;
    if (start === null) {
      onFinish(null);
      return;
    }
    const summary = summarizeSession(samplesRef.current, Date.now() - start, REWARD_THRESHOLD);
    onFinish(
      summary.durationSeconds >= MIN_SAVED_SECONDS ? { ...summary, startedAt: start } : null,
    );
  }, [onFinish]);

  useEffect(() => {
    if (elapsed >= targetSeconds) finish();
  }, [elapsed, targetSeconds, finish]);

  const orbSize = Math.max(140, Math.min(260, (width - 64) / 1.5, (height - 380) / 1.5));
  const inZone = training && signalOk && nf.score >= REWARD_THRESHOLD;
  const simulating = demoState !== "neutral";

  return (
    <View style={styles.wrap}>
      <View style={styles.status}>
        <AppText variant="label" tone="accent">
          {protocol.name} · {protocol.goal}
        </AppText>
        <AppText variant="heading" accessibilityLiveRegion="polite" style={styles.center}>
          {nf.phase === "idle"
            ? "Waiting for the first analysis window…"
            : nf.phase === "baseline"
              ? "Recording your baseline"
              : inZone
                ? "In the zone"
                : "Let the orb grow"}
        </AppText>
        <AppText tone="muted" style={styles.center}>
          {training
            ? protocol.instruction
            : "Sit still with your eyes open and breathe normally. This is the reference your training is compared with."}
        </AppText>
      </View>

      <Orb score={nf.score} engaged={training && signalOk} size={orbSize} />

      {training ? (
        <View style={styles.readout}>
          <AppText
            variant="metric"
            numeric
            accessibilityLabel={`Elapsed ${formatDuration(elapsed)}`}
          >
            {formatDuration(elapsed)}
          </AppText>
          <AppText tone="muted" numeric>
            of {formatDuration(targetSeconds)} · reward {Math.round(nf.score * 100)}%
          </AppText>
        </View>
      ) : (
        <View style={styles.readout}>
          <View
            style={[styles.track, { backgroundColor: colors.surfaceRaised }]}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel="Baseline progress"
            accessibilityValue={{ min: 0, max: 100, now: Math.round(nf.progress * 100) }}
          >
            <View
              style={[
                styles.fill,
                { backgroundColor: colors.accent, width: `${nf.progress * 100}%` },
              ]}
            />
          </View>
          <AppText tone="muted" numeric>
            Baseline {Math.round(nf.progress * 100)}% of {baselineSeconds} s
          </AppText>
        </View>
      )}

      {!signalOk && nf.phase !== "idle" ? (
        <Card style={[styles.stretch, { borderColor: colors.fair }]}>
          <AppText tone="fair" accessibilityLiveRegion="polite">
            {eeg.status !== "open"
              ? "Connection lost. Feedback is paused until data flows again."
              : `${gate.message} Feedback is paused.`}
          </AppText>
        </Card>
      ) : null}

      {kind === "demo" ? (
        <Card style={styles.stretch}>
          <View style={styles.toggle}>
            <View style={styles.toggleText}>
              <AppText variant="label">Simulate the target state</AppText>
              <AppText variant="caption" tone="muted">
                Demo only: shifts the synthetic EEG towards what {protocol.name} rewards. Turn it on
                after the baseline and watch the orb respond.
              </AppText>
            </View>
            <Switch
              accessibilityLabel="Simulate the target state"
              value={simulating}
              onValueChange={(on) => setDemoState(on ? protocol.demoState : "neutral")}
              trackColor={{ true: colors.accent, false: colors.neutral }}
              thumbColor={colors.surface}
            />
          </View>
        </Card>
      ) : null}

      <Button
        label={training ? "End session" : "Cancel"}
        variant="secondary"
        onPress={finish}
        style={styles.end}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: space.lg },
  status: { alignItems: "center", gap: space.xs, maxWidth: 520 },
  center: { textAlign: "center" },
  readout: { alignItems: "center", gap: space.sm, width: "100%", maxWidth: 360 },
  track: { width: "100%", height: 8, borderRadius: radius.pill, overflow: "hidden" },
  fill: { height: "100%", borderRadius: radius.pill },
  toggle: { flexDirection: "row", alignItems: "center", gap: space.md },
  toggleText: { flex: 1, gap: 2 },
  end: { alignSelf: "stretch" },
  stretch: { alignSelf: "stretch" },
});
