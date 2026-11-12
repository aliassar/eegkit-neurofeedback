import { Redirect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, G, Path } from "react-native-svg";
import { AppText } from "@/components/AppText";
import { CloseIcon } from "@/components/icons";
import { Buddy } from "@/components/kid/Buddy";
import { KidButton } from "@/components/kid/KidButton";
import { makePlan, scoreFocusCheck, type TrialResult } from "@/lib/focus-check";
import { newId } from "@/lib/profiles";
import { getProtocol, protocolMetric } from "@/lib/protocols";
import { useEEGContext } from "@/state/eeg";
import { useProfiles } from "@/state/profiles";
import { useRecords } from "@/state/records";
import { kid, space } from "@/theme/tokens";

type Stage = "intro" | "countdown" | "running" | "done";

/**
 * The Focus check: a go/no-go task with no feedback. Tap for the sun, not for
 * the moon. Results go to the grown-up area; the child only hears "thank you".
 */
export default function FocusCheck() {
  const { active, loaded } = useProfiles();
  const { eeg, kind, active: connected } = useEEGContext();
  const { addCheck } = useRecords();
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("intro");
  const [count, setCount] = useState(3);
  const [shown, setShown] = useState<"go" | "nogo" | null>(null);

  const plan = useRef(makePlan(Date.now()));
  const results = useRef<TrialResult[]>([]);
  const onset = useRef(0);
  const responded = useRef(false);
  const startedAt = useRef(0);
  const metrics = useRef<number[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const protocol = active ? getProtocol(active.protocol) : undefined;
  const leave = () => (router.canGoBack() ? router.back() : router.replace("/grown-ups"));

  const clearTimers = () => {
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
  };
  useEffect(
    () => () => {
      for (const t of timers.current) clearTimeout(t);
    },
    [],
  );

  const respond = useCallback(() => {
    if (stage !== "running" || responded.current || onset.current === 0) return;
    responded.current = true;
    const last = results.current[results.current.length - 1];
    if (last) {
      results.current[results.current.length - 1] = { ...last, rtMs: Date.now() - onset.current };
    }
  }, [stage]);

  // Space bar on the web.
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined" || stage !== "running") return;
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        respond();
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [stage, respond]);

  // Record the protocol's EEG metric during the task, if a headset is streaming.
  useEffect(() => {
    if (stage !== "running" || !protocol) return;
    return eeg.subscribeResults((r) => {
      const value = protocolMetric(protocol, r);
      if (Number.isFinite(value)) metrics.current.push(value);
    });
  }, [stage, protocol, eeg.subscribeResults]);

  const finish = useCallback(() => {
    if (!active) return;
    const score = scoreFocusCheck(results.current);
    const eegMetric =
      metrics.current.length > 0
        ? metrics.current.reduce((a, b) => a + b, 0) / metrics.current.length
        : Number.NaN;
    addCheck({
      id: newId(startedAt.current),
      profileId: active.id,
      startedAt: new Date(startedAt.current).toISOString(),
      source: connected ? kind : null,
      durationSeconds: Math.round((Date.now() - startedAt.current) / 1000),
      ...score,
      protocol: Number.isFinite(eegMetric) && protocol ? protocol.id : null,
      eegMetric,
    });
    setShown(null);
    setStage("done");
  }, [active, addCheck, connected, kind, protocol]);

  const runTrial = useCallback(
    (i: number) => {
      const { trials, stimulusMs, gapsMs } = plan.current;
      if (i >= trials.length) {
        finish();
        return;
      }
      const trialKind = trials[i] as "go" | "nogo";
      results.current.push({ kind: trialKind, rtMs: null });
      responded.current = false;
      onset.current = Date.now();
      setShown(trialKind);
      timers.current.push(
        setTimeout(() => setShown(null), stimulusMs),
        setTimeout(() => runTrial(i + 1), stimulusMs + (gapsMs[i] as number)),
      );
    },
    [finish],
  );

  const start = () => {
    setStage("countdown");
    setCount(3);
    for (const n of [2, 1]) timers.current.push(setTimeout(() => setCount(n), (3 - n) * 1000));
    timers.current.push(
      setTimeout(() => {
        startedAt.current = Date.now();
        setStage("running");
        runTrial(0);
      }, 3000),
    );
  };

  if (!loaded) return null;
  if (!active) return <Redirect href="/" />;

  return (
    <SafeAreaView style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Stop the focus check"
        onPress={() => {
          clearTimers();
          leave();
        }}
        hitSlop={8}
        style={styles.close}
      >
        <CloseIcon color={kid.ink} size={20} />
      </Pressable>

      {stage === "intro" ? (
        <View style={styles.center}>
          <View style={styles.pair}>
            <View style={styles.example}>
              <Sun size={120} />
              <AppText variant="kidHeading" style={styles.ink}>
                Tap!
              </AppText>
            </View>
            <View style={styles.example}>
              <Moon size={120} />
              <AppText variant="kidHeading" style={styles.ink}>
                Don't tap
              </AppText>
            </View>
          </View>
          <AppText variant="kidBody" style={[styles.ink, styles.text]}>
            Tap the screen as fast as you can when you see the sun. When the moon comes, stay still!
          </AppText>
          <KidButton label="Start" color={kid.grass} onPress={start} />
          <AppText variant="caption" style={[styles.ink, styles.note]}>
            For grown-ups: about 2½ minutes, no feedback. Results appear under Progress. A practice
            measure to follow change over time, not a diagnostic test.
          </AppText>
        </View>
      ) : null}

      {stage === "countdown" ? (
        <View style={styles.center}>
          <Buddy avatar={active.avatar} size={120} />
          <AppText variant="kidTitle" style={[styles.ink, styles.count]}>
            {count}
          </AppText>
          <AppText variant="kidBody" style={styles.ink}>
            Get ready…
          </AppText>
        </View>
      ) : null}

      {stage === "running" ? (
        // The raw gesture responder fires on touch-down with no press delays, which keeps
        // reaction times honest on every platform.
        <View
          accessible
          accessibilityRole="button"
          accessibilityLabel={
            shown === "go" ? "Sun: tap" : shown === "nogo" ? "Moon: don't tap" : "Wait"
          }
          onStartShouldSetResponder={() => true}
          onResponderGrant={respond}
          style={styles.tapArea}
        >
          {shown === "go" ? <Sun size={220} /> : shown === "nogo" ? <Moon size={220} /> : null}
        </View>
      ) : null}

      {stage === "done" ? (
        <View style={styles.center}>
          <Buddy avatar={active.avatar} size={140} cheering />
          <AppText variant="kidTitle" style={[styles.ink, styles.text]}>
            All done. Thank you!
          </AppText>
          <KidButton label="Finish" color={kid.sun} onPress={leave} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function Sun({ size }: { readonly size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <G stroke={kid.sunDeep} strokeWidth={6} strokeLinecap="round">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <Path key={a} d="M50 6 V16" transform={`rotate(${a} 50 50)`} />
        ))}
      </G>
      <Circle cx={50} cy={50} r={28} fill={kid.sun} />
      <Circle cx={41} cy={46} r={3.5} fill={kid.ink} />
      <Circle cx={59} cy={46} r={3.5} fill={kid.ink} />
      <Path
        d="M40 57 q10 9 20 0"
        stroke={kid.ink}
        strokeWidth={3.5}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function Moon({ size }: { readonly size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M62 12 A40 40 0 1 0 88 72 A32 32 0 1 1 62 12 Z" fill={kid.violet} />
      <Path
        d="M36 50 q4 3 8 0 M50 58 q4 3 8 0"
        stroke={kid.ink}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
      <Circle cx={28} cy={64} r={4} fill={kid.pink} opacity={0.7} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#EAF6FF" },
  close: {
    position: "absolute",
    top: space.xl,
    left: space.lg,
    zIndex: 2,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: space.lg,
    padding: space.xl,
  },
  pair: { flexDirection: "row", gap: space.xl, flexWrap: "wrap", justifyContent: "center" },
  example: { alignItems: "center", gap: space.xs },
  ink: { color: kid.ink, textAlign: "center" },
  text: { maxWidth: 460 },
  note: { maxWidth: 420, opacity: 0.75 },
  count: { fontSize: 72, lineHeight: 80 },
  tapArea: { flex: 1, alignItems: "center", justifyContent: "center" },
});
