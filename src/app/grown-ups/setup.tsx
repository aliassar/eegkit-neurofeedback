import { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { GrownUpScreen } from "@/components/GrownUpScreen";
import { Segmented } from "@/components/Segmented";
import { StatusPill } from "@/components/StatusPill";
import { describeError } from "@/lib/errors";
import {
  DEMO_STREAM,
  type DraftErrors,
  draftFromSettings,
  type Mains,
  mixedContentWarning,
  type SourceKind,
  type ThemePreference,
  validateWebSocketDraft,
  type WebSocketDraft,
} from "@/lib/settings";
import { useEEGContext } from "@/state/eeg";
import { useSettings } from "@/state/settings";
import { space } from "@/theme/tokens";

const SOURCE_OPTIONS = [
  { value: "demo", label: "Demo" },
  { value: "websocket", label: "WebSocket" },
] as const satisfies readonly { value: SourceKind; label: string }[];
const MAINS_OPTIONS = [
  { value: 50, label: "50 Hz" },
  { value: 60, label: "60 Hz" },
] as const satisfies readonly { value: Mains; label: string }[];
const THEME_OPTIONS = [
  { value: "system", label: "System" },
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
] as const satisfies readonly { value: ThemePreference; label: string }[];

const pageProtocol =
  Platform.OS === "web" && typeof window !== "undefined" ? window.location.protocol : undefined;

export default function SetupScreen() {
  const { settings, loaded, update } = useSettings();
  const { eeg, kind, active, connect, disconnect } = useEEGContext();

  return (
    <GrownUpScreen title="Setup" subtitle="Headset, electrodes and display.">
      <StatusPill />
      <Card title="Source">
        <Segmented
          label="EEG source"
          options={SOURCE_OPTIONS}
          value={kind}
          onChange={(source) => update({ source })}
        />
        {kind === "demo" ? (
          <>
            <AppText tone="muted">
              {DEMO_STREAM.channels.length} channels ({DEMO_STREAM.channels.join(", ")}) of
              synthetic EEG at {DEMO_STREAM.sampleRate} Hz, generated on this device by eegkit, with
              occasional blinks and a little mains hum so the quality checks have something to find.
              In the games, "Simulate focus" (hold the button, or Space on a keyboard) shifts it
              towards the pattern the protocol rewards. It is simulated data: use it to explore the
              app, not to train.
            </AppText>
            <Button
              label={active ? "Pause demo" : "Resume demo"}
              variant="secondary"
              onPress={active ? disconnect : connect}
            />
          </>
        ) : loaded ? (
          <WebSocketForm />
        ) : null}
        {kind === "demo" && eeg.error ? (
          <AppText tone="poor">{describeError(eeg.error)}</AppText>
        ) : null}
      </Card>

      <Card title="Electrodes">
        <AppText tone="muted">
          Theta/Beta and SMR training usually use one active electrode at Cz (the top of the head,
          halfway between the ears and halfway between the nose and the back of the head), or Fz and
          Cz. Reference it to an earlobe or the bone behind the ear (mastoid), with the ground on
          the other earlobe or the forehead, as your amplifier's manual describes.
        </AppText>
        <AppText tone="muted">
          Before each session, check the Signal tab: every channel you train on should read Good or
          Fair. Gel or saline and a snug fit matter more than anything else. The games pause on
          their own when the signal is poor.
        </AppText>
      </Card>

      <Card title="Mains frequency">
        <Segmented
          label="Mains frequency"
          options={MAINS_OPTIONS}
          value={settings.mains}
          onChange={(mains) => update({ mains })}
        />
        <AppText variant="caption" tone="muted">
          Power lines hum at 50 Hz in most of the world and 60 Hz in the Americas and parts of Asia.
          It is filtered out of the analysis, and measured on the raw signal to spot loose
          electrodes.
        </AppText>
      </Card>

      <Card title="Appearance">
        <Segmented
          label="Theme"
          options={THEME_OPTIONS}
          value={settings.theme}
          onChange={(theme) => update({ theme })}
        />
      </Card>
    </GrownUpScreen>
  );
}

function WebSocketForm() {
  const { settings, update } = useSettings();
  const { active, connect, disconnect } = useEEGContext();
  const saved = draftFromSettings(settings.websocket);
  const [draft, setDraft] = useState<WebSocketDraft>(saved);
  const [errors, setErrors] = useState<DraftErrors>({});
  const dirty =
    draft.url !== saved.url ||
    draft.sampleRate !== saved.sampleRate ||
    draft.channels !== saved.channels;
  const warning = mixedContentWarning(pageProtocol, draft.url);

  const edit = (patch: Partial<WebSocketDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setErrors((e) => {
      const next = { ...e };
      for (const key of Object.keys(patch) as (keyof WebSocketDraft)[]) delete next[key];
      return next;
    });
  };

  const apply = () => {
    const result = validateWebSocketDraft(draft, settings.mains);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    update({ websocket: result.value });
    setDraft(draftFromSettings(result.value));
    connect();
  };

  return (
    <View style={styles.form}>
      <Field
        label="Server address"
        value={draft.url}
        onChangeText={(url) => edit({ url })}
        placeholder="ws://localhost:8765"
        keyboardType="url"
        inputMode="url"
        error={errors.url}
        hint="Any server that sends samples as JSON arrays or CSV lines."
      />
      <Field
        label="Sample rate (Hz)"
        value={draft.sampleRate}
        onChangeText={(sampleRate) => edit({ sampleRate })}
        placeholder="256"
        keyboardType="decimal-pad"
        inputMode="decimal"
        error={errors.sampleRate}
      />
      <Field
        label="Channel labels"
        value={draft.channels}
        onChangeText={(channels) => edit({ channels })}
        placeholder="Cz"
        error={errors.channels}
        hint="Comma separated, in the order the server sends them."
      />
      {warning ? <AppText tone="fair">{warning}</AppText> : null}
      <View style={styles.actions}>
        {active ? (
          <>
            {dirty ? (
              <Button label="Reconnect with changes" onPress={apply} style={styles.grow} />
            ) : null}
            <Button
              label="Disconnect"
              variant="secondary"
              onPress={disconnect}
              style={styles.grow}
            />
          </>
        ) : (
          <Button label="Connect" onPress={apply} style={styles.grow} />
        )}
      </View>
      {active ? <ConnectionStatus /> : null}
      <AppText variant="caption" tone="muted">
        No device at hand? The repository's bridge/replay-edf.mjs streams any EDF recording in real
        time, and bridge/lsl_bridge.py forwards a Lab Streaming Layer stream.
      </AppText>
    </View>
  );
}

function ConnectionStatus() {
  const { eeg } = useEEGContext();
  const error = describeError(eeg.error);
  const text =
    eeg.status === "open"
      ? error
        ? "Connected, but the data doesn't fit the settings"
        : `Connected · ${eeg.labels.length} channels at ${eeg.sampleRate} Hz`
      : eeg.status === "connecting"
        ? error
          ? "Connection failed, retrying…"
          : "Connecting…"
        : eeg.status === "error"
          ? "Could not connect"
          : "Disconnected";
  const tone =
    eeg.status === "open" && !error
      ? "good"
      : eeg.status === "connecting" || error
        ? "fair"
        : "poor";
  return (
    <View style={styles.status} accessibilityLiveRegion="polite">
      <AppText variant="label" tone={tone}>
        {text}
      </AppText>
      {error ? <AppText>{error}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.lg },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: space.md },
  grow: { flexGrow: 1 },
  status: { gap: space.xs },
});
