import { useNeurofeedback } from "eegkit-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createFocusMeter, type RoundSummary, stepFocus, summarizeRound } from "@/lib/focus-meter";
import type { Game } from "@/lib/games";
import type { Profile } from "@/lib/profiles";
import { newId } from "@/lib/profiles";
import { FOCUS_THRESHOLD, getProtocol, PROTOCOLS, protocolMetric } from "@/lib/protocols";
import { qualityGate } from "@/lib/quality";
import type { SessionRecord } from "@/lib/records";
import { earnedBadges, newBadges } from "@/lib/rewards";
import { useEEGContext } from "@/state/eeg";
import { useChildRecords, useRecords } from "@/state/records";
import { kid, radius, space } from "@/theme/tokens";
import { AppText } from "../AppText";
import { CloseIcon, HeadbandIcon } from "../icons";
import { Buddy } from "../kid/Buddy";
import { KidButton } from "../kid/KidButton";
import { Star } from "../kid/Star";
import { Orb } from "../Orb";
import { BalloonScene } from "./BalloonScene";
import { Celebration, type CelebrationData } from "./Celebration";
import { GardenScene } from "./GardenScene";
import { RiverScene } from "./RiverScene";
import type { SceneProps } from "./shared";
import { useSimulateFocus } from "./useSimulateFocus";

const SCENES = { balloon: BalloonScene, garden: GardenScene, river: RiverScene } as const;

const TICK_MS = 250;
const BREAK_SECONDS = 20;
/** Rounds shorter than this (stopped early) aren't saved. */
const MIN_ROUND_SECONDS = 10;
/** The signal must stay bad (or good) this long before the game pauses (or resumes). */
const PAUSE_AFTER_MS = 1500;
const RESUME_AFTER_MS = 1000;
/** Score shown while nothing is being trained (baseline, breaks). */
const RESTING_LEVEL = 0.4;

type Phase =
  | { readonly kind: "baseline" }
  | { readonly kind: "round"; readonly index: number }
  | { readonly kind: "break"; readonly next: number }
  | { readonly kind: "done"; readonly data: CelebrationData };

export interface GameSessionProps {
  readonly game: Game;
  readonly profile: Profile;
  readonly onExit: () => void;
  readonly onPlayAgain: () => void;
}

/**
 * A full session: resting baseline, then rounds of the game with short
 * breaks, then a celebration. The attention score comes from
 * `useNeurofeedback` against the baseline recorded at the start.
 */
export function GameSession({ game, profile, onExit, onPlayAgain }: GameSessionProps) {
  const { eeg, kind } = useEEGContext();
  const { addSession } = useRecords();
  const { sessions: history } = useChildRecords(profile.id);
  const insets = useSafeAreaInsets();
  const protocol = getProtocol(profile.protocol) ?? (PROTOCOLS[0] as (typeof PROTOCOLS)[number]);
  const nf = useNeurofeedback(eeg, {
    metric: (result) => protocolMetric(protocol, result),
    direction: protocol.direction,
    baselineSeconds: profile.baselineSeconds,
    timeConstant: 1,
  });

  const [phase, setPhase] = useState<Phase>({ kind: "baseline" });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [roundStars, setRoundStars] = useState(0);
  const [roundElapsed, setRoundElapsed] = useState(0);
  const [breakLeft, setBreakLeft] = useState(BREAK_SECONDS);
  const [paused, setPaused] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  /** The game holds still while the "Stop playing?" question is open. */
  const holdRef = useRef(false);
  holdRef.current = confirmQuit;

  const meter = useRef(createFocusMeter());
  /** Set once the current round has ended, so a late tick can't end it twice. */
  const ended = useRef(false);
  const rounds = useRef<RoundSummary[]>([]);
  const startedAt = useRef<number | null>(null);
  const scoreRef = useRef(0.5);
  const signalRef = useRef({ ok: true, since: Date.now() });
  const historyAtStart = useRef(history);

  const level = useSharedValue(RESTING_LEVEL);
  const progress = useSharedValue(0);
  const pop = useSharedValue(0);

  const gate = qualityGate(eeg.result);
  const signalOk = eeg.status === "open" && gate.status !== "blocked";
  const inRound = phase.kind === "round";
  const simulate = useSimulateFocus(inRound && !paused && !confirmQuit);

  scoreRef.current = nf.score;
  useEffect(() => {
    const target = inRound && !paused ? nf.score : RESTING_LEVEL;
    level.value = withTiming(target, { duration: 400, easing: Easing.out(Easing.quad) });
  }, [nf.score, inRound, paused, level]);

  // Hysteresis on the signal, so one noisy window doesn't flash the pause screen.
  useEffect(() => {
    if (signalRef.current.ok !== signalOk) signalRef.current = { ok: signalOk, since: Date.now() };
  }, [signalOk]);

  const startRound = useCallback(
    (index: number) => {
      meter.current = createFocusMeter();
      ended.current = false;
      progress.value = 0;
      setRoundStars(0);
      setRoundElapsed(0);
      if (startedAt.current === null) startedAt.current = Date.now();
      setPhase({ kind: "round", index });
    },
    [progress],
  );

  // Baseline done: start the first round.
  useEffect(() => {
    if (phase.kind === "baseline" && nf.phase === "training") startRound(0);
  }, [phase.kind, nf.phase, startRound]);

  const finish = useCallback(
    (summaries: RoundSummary[]) => {
      const started = startedAt.current;
      let earned: CelebrationData["newBadges"] = [];
      if (started !== null && summaries.length > 0) {
        const record: SessionRecord = {
          id: newId(started),
          profileId: profile.id,
          game: game.id,
          protocol: protocol.id,
          startedAt: new Date(started).toISOString(),
          source: kind,
          baselineSeconds: profile.baselineSeconds,
          channels: eeg.labels,
          rounds: summaries,
          completed: summaries.length >= profile.rounds,
        };
        addSession(record);
        const before = earnedBadges(historyAtStart.current);
        earned = newBadges(before, earnedBadges([record, ...historyAtStart.current]));
      }
      setPhase({
        kind: "done",
        data: {
          stars: summaries.reduce((sum, r) => sum + r.stars, 0),
          rounds: summaries.length,
          newBadges: earned,
        },
      });
    },
    [addSession, eeg.labels, game.id, kind, profile, protocol.id],
  );

  const endRound = useCallback(
    (index: number, completed: boolean) => {
      if (ended.current) return;
      ended.current = true;
      const summary = summarizeRound(meter.current, completed);
      if (completed || summary.durationSeconds >= MIN_ROUND_SECONDS) rounds.current.push(summary);
      if (completed && index + 1 < profile.rounds) {
        setBreakLeft(BREAK_SECONDS);
        setPhase({ kind: "break", next: index + 1 });
      } else {
        finish(rounds.current);
      }
    },
    [finish, profile.rounds],
  );

  // The game clock: pause handling, round stepping and the break countdown.
  useEffect(() => {
    if (phase.kind === "done") return;
    let last = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      const dt = Math.min(0.5, (now - last) / 1000);
      last = now;
      const { ok, since } = signalRef.current;
      setPaused((was) =>
        was ? !(ok && now - since >= RESUME_AFTER_MS) : !ok && now - since >= PAUSE_AFTER_MS,
      );
      if (phase.kind === "break") {
        setBreakLeft((left) => Math.max(0, left - dt));
        return;
      }
      if (phase.kind !== "round" || !ok || holdRef.current) return;
      const m = meter.current;
      const earned = stepFocus(m, dt, scoreRef.current, { threshold: FOCUS_THRESHOLD });
      if (earned > 0) {
        progress.value = 0;
        pop.value = withSequence(
          withTiming(1, { duration: 280 }),
          withTiming(0, { duration: 700 }),
        );
        setRoundStars(m.stars);
      } else {
        progress.value = withTiming(m.progress, { duration: TICK_MS, easing: Easing.linear });
      }
      setRoundElapsed(m.elapsed);
      if (m.elapsed >= profile.roundSeconds) endRound(phase.index, true);
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [phase, profile.roundSeconds, endRound, progress, pop]);

  useEffect(() => {
    if (phase.kind === "break" && breakLeft <= 0) startRound(phase.next);
  }, [phase, breakLeft, startRound]);

  const quit = () => {
    setConfirmQuit(false);
    if (phase.kind === "round") endRound(phase.index, false);
    else if (phase.kind === "done") onExit();
    else finish(rounds.current);
  };

  const popStyle = useAnimatedStyle(() => ({
    opacity: pop.value,
    transform: [{ scale: 0.4 + pop.value * 0.9 }, { translateY: -40 * pop.value }],
  }));

  const Scene = SCENES[game.id];
  const sceneProps: SceneProps = useMemo(
    () => ({
      level,
      progress,
      stars: roundStars,
      avatar: profile.avatar,
      width: size.width,
      height: size.height,
      running: inRound && !paused && !confirmQuit,
    }),
    [level, progress, roundStars, profile.avatar, size, inRound, paused, confirmQuit],
  );

  if (phase.kind === "done") {
    return (
      <Celebration
        data={phase.data}
        avatar={profile.avatar}
        onHome={onExit}
        onPlayAgain={onPlayAgain}
      />
    );
  }

  const roundIndex =
    phase.kind === "round" ? phase.index : phase.kind === "break" ? phase.next : -1;
  return (
    <View
      style={styles.root}
      onLayout={(e) =>
        setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })
      }
    >
      {size.width > 0 ? <Scene {...sceneProps} /> : null}

      {/* Top bar: quit, rounds, stars */}
      <View style={[styles.topBar, { paddingTop: insets.top + space.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Stop playing"
          onPress={() => setConfirmQuit(true)}
          hitSlop={8}
          style={styles.roundButton}
        >
          <CloseIcon color={kid.ink} size={20} />
        </Pressable>
        <View
          style={styles.dots}
          accessible
          accessibilityLabel={`Round ${Math.max(1, roundIndex + 1)} of ${profile.rounds}`}
        >
          {Array.from({ length: profile.rounds }, (_, i) => (
            <View
              // biome-ignore lint/suspicious/noArrayIndexKey: one dot per round.
              key={i}
              style={[
                styles.dot,
                i < rounds.current.length && styles.dotDone,
                i === roundIndex && phase.kind === "round" && styles.dotNow,
              ]}
            />
          ))}
        </View>
        <View style={styles.tray} accessible accessibilityLabel={`${roundStars} stars this round`}>
          {roundStars === 0 ? <Star size={20} dim /> : null}
          {Array.from({ length: Math.min(roundStars, 20) }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: stars are identical.
            <Star key={i} size={20} />
          ))}
        </View>
      </View>
      {phase.kind === "round" ? (
        <View style={[styles.timeTrack, { top: insets.top + 64 }]}>
          <View
            style={[
              styles.timeFill,
              { width: `${Math.min(100, (roundElapsed / profile.roundSeconds) * 100)}%` },
            ]}
          />
        </View>
      ) : null}

      <Animated.View pointerEvents="none" style={[styles.pop, popStyle]}>
        <Star size={96} />
      </Animated.View>

      {phase.kind === "baseline" && !paused ? (
        <Overlay>
          <Orb score={0.4} engaged={false} size={Math.min(150, size.width * 0.35)} />
          <AppText variant="kidHeading" style={styles.center}>
            Get comfy and sit still
          </AppText>
          <AppText variant="kidBody" style={[styles.center, styles.soft]}>
            Watch the bubble and breathe slowly. The game starts soon!
          </AppText>
          <View style={styles.track}>
            <View style={[styles.trackFill, { width: `${nf.progress * 100}%` }]} />
          </View>
          {kind === "demo" ? (
            <AppText variant="caption" style={[styles.center, styles.soft]}>
              Demo: simulated EEG. "Simulate focus" works once the game starts.
            </AppText>
          ) : null}
        </Overlay>
      ) : null}

      {phase.kind === "break" ? (
        <Overlay>
          <Buddy avatar={profile.avatar} size={110} cheering />
          <AppText variant="kidHeading" style={styles.center}>
            Stretch break!
          </AppText>
          <AppText variant="kidBody" style={[styles.center, styles.soft]}>
            Wiggle your fingers and roll your shoulders.
          </AppText>
          <View style={styles.track}>
            <View
              style={[styles.trackFill, { width: `${(1 - breakLeft / BREAK_SECONDS) * 100}%` }]}
            />
          </View>
          <KidButton label="I'm ready!" onPress={() => startRound(phase.next)} />
        </Overlay>
      ) : null}

      {paused && phase.kind !== "break" ? (
        <Overlay>
          <View style={styles.headband}>
            <HeadbandIcon color={kid.skyDeep} size={56} />
          </View>
          <AppText variant="kidHeading" style={styles.center}>
            Let's fix the headband
          </AppText>
          <AppText variant="kidBody" style={[styles.center, styles.soft]}>
            Ask a grown-up to check it fits snugly. The game waits for you.
          </AppText>
          <AppText variant="caption" style={[styles.center, styles.soft]}>
            {eeg.status !== "open" ? "No data from the headset." : gate.message}
          </AppText>
        </Overlay>
      ) : null}

      {confirmQuit ? (
        <Overlay>
          <Buddy avatar={profile.avatar} size={96} />
          <AppText variant="kidHeading" style={styles.center}>
            Stop playing?
          </AppText>
          <View style={styles.actions}>
            <KidButton
              label="Keep playing"
              color={kid.grass}
              onPress={() => setConfirmQuit(false)}
            />
            <KidButton label="Stop" color="#E9DFCC" onPress={quit} />
          </View>
        </Overlay>
      ) : null}

      {simulate.available ? (
        <View style={[styles.simulate, { paddingBottom: insets.bottom + space.md }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Hold to simulate focus (demo)"
            onPressIn={simulate.press}
            onPressOut={simulate.release}
            style={[styles.simButton, simulate.holding && styles.simButtonOn]}
          >
            <AppText variant="label" style={styles.simText}>
              {simulate.holding ? "Simulating focus…" : "Hold to simulate focus"}
            </AppText>
            <AppText variant="caption" style={styles.simCaption}>
              Demo with simulated EEG · or hold Space
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function Overlay({ children }: { readonly children: React.ReactNode }) {
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#BFE6FF", overflow: "hidden" },
  topBar: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingHorizontal: space.lg,
  },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  dots: { flexDirection: "row", gap: 6, flex: 1, justifyContent: "center" },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderWidth: 2,
    borderColor: "rgba(36,50,74,0.25)",
  },
  dotDone: { backgroundColor: kid.sun, borderColor: kid.starEdge },
  dotNow: { borderColor: kid.ink, backgroundColor: "#FFFFFF" },
  tray: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    maxWidth: 220,
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    gap: 2,
    padding: 6,
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  timeTrack: {
    position: "absolute",
    left: space.xl,
    right: space.xl,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.6)",
    overflow: "hidden",
  },
  timeFill: { height: "100%", backgroundColor: kid.sunDeep, borderRadius: 4 },
  pop: { position: "absolute", alignSelf: "center", top: "38%" },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(20, 32, 56, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: space.lg,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: kid.cream,
    borderRadius: 28,
    padding: space.xl,
    alignItems: "center",
    gap: space.md,
  },
  center: { textAlign: "center", color: kid.ink },
  soft: { opacity: 0.8 },
  track: {
    width: "100%",
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(36,50,74,0.12)",
    overflow: "hidden",
  },
  trackFill: { height: "100%", backgroundColor: kid.grass, borderRadius: 7 },
  headband: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#DDF0FF",
    alignItems: "center",
    justifyContent: "center",
  },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: space.md, justifyContent: "center" },
  simulate: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    paddingHorizontal: space.lg,
  },
  simButton: {
    minHeight: 56,
    minWidth: 260,
    paddingHorizontal: space.xl,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: "rgba(36,50,74,0.82)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  simButtonOn: { backgroundColor: "#0E9F86", borderColor: "#FFFFFF" },
  simText: { color: "#FFFFFF", fontSize: 16 },
  simCaption: { color: "rgba(255,255,255,0.85)" },
});
