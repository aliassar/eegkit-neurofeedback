import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { QualityBadge } from "@/components/QualityBadge";
import { ScoreChart } from "@/components/ScoreChart";
import { Screen } from "@/components/Screen";
import { Segmented } from "@/components/Segmented";
import { SessionStats } from "@/components/SessionStats";
import { type FinishedSession, TrainingSession } from "@/components/TrainingSession";
import { PROTOCOLS, type Protocol } from "@/lib/protocols";
import { qualityGate } from "@/lib/quality";
import type { SessionRecord } from "@/lib/session";
import { BASELINE_CHOICES, SESSION_MINUTE_CHOICES } from "@/lib/settings";
import { useEEGContext } from "@/state/eeg";
import { useSessions } from "@/state/sessions";
import { useSettings } from "@/state/settings";
import { useTheme } from "@/theme/theme";
import { radius, space } from "@/theme/tokens";

type Step =
  | { readonly name: "choose"; readonly note?: string }
  | { readonly name: "check" }
  | { readonly name: "session" }
  | { readonly name: "summary"; readonly record: SessionRecord };

const BASELINE_OPTIONS = BASELINE_CHOICES.map((s) => ({ value: s, label: `${s} s` }));
const LENGTH_OPTIONS = SESSION_MINUTE_CHOICES.map((m) => ({ value: m, label: `${m} min` }));

export default function TrainScreen() {
  const { eeg, kind, active } = useEEGContext();
  const { settings, update } = useSettings();
  const { add } = useSessions();
  const router = useRouter();
  const [protocol, setProtocol] = useState<Protocol>(PROTOCOLS[0] as Protocol);
  const [step, setStep] = useState<Step>({ name: "choose" });

  const onFinish = useCallback(
    (session: FinishedSession | null) => {
      if (!session) {
        setStep({
          name: "choose",
          note: "Session ended before any training was recorded, so nothing was saved.",
        });
        return;
      }
      const { startedAt, ...summary } = session;
      const record: SessionRecord = {
        ...summary,
        id: `${startedAt.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        protocol: protocol.id,
        startedAt: new Date(startedAt).toISOString(),
        source: kind,
        baselineSeconds: settings.baselineSeconds,
        channels: eeg.labels,
      };
      add(record);
      setStep({ name: "summary", record });
    },
    [add, protocol.id, kind, settings.baselineSeconds, eeg.labels],
  );

  if (!active) {
    return (
      <Screen title="Train">
        <Card title="Connect a source first">
          <AppText tone="muted">
            Training needs a live signal. Start the demo or connect your WebSocket stream in Setup.
          </AppText>
          <Button label="Open setup" onPress={() => router.navigate("/setup")} />
        </Card>
      </Screen>
    );
  }

  if (step.name === "session") {
    return (
      <Screen title="Train">
        <TrainingSession
          protocol={protocol}
          baselineSeconds={settings.baselineSeconds}
          targetSeconds={settings.sessionMinutes * 60}
          onFinish={onFinish}
        />
      </Screen>
    );
  }

  if (step.name === "summary") {
    const { record } = step;
    return (
      <Screen title="Train">
        <Card title="Session complete">
          <AppText tone="muted">
            {protocol.name} · {protocol.metricName}
            {record.source === "demo" ? " · simulated data" : ""}
          </AppText>
          <SessionStats summary={record} />
          <ScoreChart series={record.series} durationSeconds={record.durationSeconds} />
          <AppText variant="caption" tone="muted">
            Scores compare each moment with your baseline: 50% means "same as baseline". Progress
            shows up as a trend across sessions, not within one.
          </AppText>
        </Card>
        <View style={styles.actions}>
          <Button
            label="Train again"
            onPress={() => setStep({ name: "check" })}
            style={styles.grow}
          />
          <Button
            label="See history"
            variant="secondary"
            onPress={() => {
              setStep({ name: "choose" });
              router.navigate("/history");
            }}
            style={styles.grow}
          />
        </View>
      </Screen>
    );
  }

  if (step.name === "check") {
    const gate = qualityGate(eeg.result);
    return (
      <Screen title="Train" subtitle={`${protocol.name}: signal check`}>
        <Card title="Check the signal">
          <AppText tone="muted">Electrodes: {protocol.placement}.</AppText>
          <View style={styles.channels}>
            {eeg.labels.map((label, i) => (
              <View key={label} style={styles.channel}>
                <AppText variant="label" style={styles.channelLabel}>
                  {label}
                </AppText>
                <QualityBadge quality={eeg.result?.channels[i]?.quality} />
              </View>
            ))}
          </View>
          <AppText
            tone={
              gate.status === "blocked" ? "poor" : gate.status === "ready" ? "default" : "muted"
            }
            accessibilityLiveRegion="polite"
          >
            {gate.message}
          </AppText>
        </Card>
        <View style={styles.actions}>
          <Button
            label="Start baseline"
            disabled={gate.status !== "ready"}
            onPress={() => setStep({ name: "session" })}
            style={styles.grow}
          />
          <Button
            label="Back"
            variant="secondary"
            onPress={() => setStep({ name: "choose" })}
            style={styles.grow}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen title="Train" subtitle="Pick a protocol, record a baseline, then train against it.">
      {step.note ? (
        <AppText tone="muted" accessibilityLiveRegion="polite">
          {step.note}
        </AppText>
      ) : null}
      <View accessibilityRole="radiogroup" accessibilityLabel="Protocol" style={styles.protocols}>
        {PROTOCOLS.map((p) => (
          <ProtocolOption
            key={p.id}
            protocol={p}
            selected={p.id === protocol.id}
            onPress={() => setProtocol(p)}
          />
        ))}
      </View>
      <Card title="Session">
        <AppText variant="label" tone="muted">
          Baseline
        </AppText>
        <Segmented
          label="Baseline length"
          options={BASELINE_OPTIONS}
          value={settings.baselineSeconds}
          onChange={(baselineSeconds) => update({ baselineSeconds })}
        />
        <AppText variant="label" tone="muted">
          Training
        </AppText>
        <Segmented
          label="Training length"
          options={LENGTH_OPTIONS}
          value={settings.sessionMinutes}
          onChange={(sessionMinutes) => update({ sessionMinutes })}
        />
      </Card>
      <Button label="Check signal" onPress={() => setStep({ name: "check" })} />
    </Screen>
  );
}

function ProtocolOption({
  protocol,
  selected,
  onPress,
}: {
  readonly protocol: Protocol;
  readonly selected: boolean;
  readonly onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${protocol.name}: ${protocol.goal}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        {
          backgroundColor: selected ? colors.accentSoft : colors.surface,
          borderColor: selected ? colors.accent : colors.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.optionHeader}>
        <View style={[styles.radio, { borderColor: selected ? colors.accent : colors.neutral }]}>
          {selected ? <View style={[styles.radioDot, { backgroundColor: colors.accent }]} /> : null}
        </View>
        <AppText variant="heading" style={styles.grow}>
          {protocol.name}
        </AppText>
        <AppText variant="label" tone="accent">
          {protocol.goal}
        </AppText>
      </View>
      <AppText tone="muted">{protocol.description}</AppText>
      <AppText variant="caption" tone="muted">
        Trains: {protocol.metricName} · {protocol.placement}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: "row", flexWrap: "wrap", gap: space.md },
  grow: { flexGrow: 1 },
  channels: { gap: space.sm },
  channel: { flexDirection: "row", alignItems: "center", gap: space.md, minHeight: 28 },
  channelLabel: { width: 44 },
  protocols: { gap: space.md },
  option: { borderWidth: 1, borderRadius: radius.lg, padding: space.lg, gap: space.sm },
  optionHeader: { flexDirection: "row", alignItems: "center", gap: space.md },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  pressed: { opacity: 0.85 },
});
