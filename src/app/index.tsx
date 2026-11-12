import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path, Rect } from "react-native-svg";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { BadgeMedal } from "@/components/kid/BadgeMedal";
import { Buddy } from "@/components/kid/Buddy";
import { GameArt } from "@/components/kid/GameArt";
import { HoldButton } from "@/components/kid/HoldButton";
import { STAR_PATH } from "@/components/kid/Star";
import { GAMES } from "@/lib/games";
import { createProfile } from "@/lib/profiles";
import { qualityGate } from "@/lib/quality";
import { earnedBadges, totalStars } from "@/lib/rewards";
import { useEEGContext } from "@/state/eeg";
import { useGate } from "@/state/gate";
import { useProfiles } from "@/state/profiles";
import { useChildRecords } from "@/state/records";
import { useSettings } from "@/state/settings";
import { useTheme } from "@/theme/theme";
import { kid, MAX_CONTENT_WIDTH, radius, space } from "@/theme/tokens";

const CARD_COLORS = { balloon: "#DFF1FF", garden: "#E3F7E5", river: "#FFF0DA" } as const;
const STARS_PER_JAR = 50;

/** The kid area: pick a game. Few words, big targets, no numbers. */
export default function KidHome() {
  const { colors } = useTheme();
  const { profiles, loaded, active, setActive, add } = useProfiles();
  const { settings } = useSettings();
  const { sessions } = useChildRecords(active?.id);
  const { unlock } = useGate();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [choosing, setChoosing] = useState(false);
  const openGrownUps = () => {
    unlock();
    router.push("/grown-ups");
  };

  if (!loaded) return <View style={[styles.fill, { backgroundColor: colors.background }]} />;

  if (!active) {
    return (
      <SafeAreaView style={[styles.fill, styles.welcome, { backgroundColor: colors.background }]}>
        <View style={styles.buddies}>
          <Buddy avatar={1} size={96} />
          <Buddy avatar={2} size={120} cheering />
          <Buddy avatar={5} size={96} />
        </View>
        <AppText variant="kidTitle" accessibilityRole="header" style={styles.center}>
          Welcome to Focus Games!
        </AppText>
        <AppText variant="kidBody" tone="muted" style={styles.center}>
          Ask a grown-up to set things up for you.
        </AppText>
        {settings.source === "demo" ? (
          // Visitors to the web demo have no headset and no profile yet: let
          // them play straight away. Grown-ups can rename or delete it later.
          <Button
            label="Try the demo with pretend brainwaves"
            onPress={() => add({ ...createProfile("Explorer", 1), baselineSeconds: 20 })}
          />
        ) : null}
        <HoldButton label="Grown-ups: hold to open" onComplete={openGrownUps} />
      </SafeAreaView>
    );
  }

  const stars = totalStars(sessions);
  const badges = earnedBadges(sessions);
  const wide = width >= 760;
  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              profiles.length > 1 ? "Who's playing? Choose" : `${active.name}'s buddy`
            }
            disabled={profiles.length < 2}
            onPress={() => setChoosing((c) => !c)}
          >
            <Buddy avatar={active.avatar} size={76} />
          </Pressable>
          <View style={styles.greeting}>
            <AppText variant="kidTitle" accessibilityRole="header" numberOfLines={1}>
              Hi, {active.name}!
            </AppText>
            <AppText variant="kidBody" tone="muted">
              Pick a game
            </AppText>
          </View>
        </View>

        {choosing ? (
          <View style={[styles.chooser, { backgroundColor: colors.surface }]}>
            <AppText variant="kidHeading">Who's playing?</AppText>
            <View style={styles.chooserRow}>
              {profiles.map((p) => (
                <Pressable
                  key={p.id}
                  accessibilityRole="button"
                  accessibilityLabel={p.name}
                  onPress={() => {
                    setActive(p.id);
                    setChoosing(false);
                  }}
                  style={styles.chooserItem}
                >
                  <Buddy avatar={p.avatar} size={64} />
                  <AppText variant="label" numberOfLines={1}>
                    {p.name}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <HeadsetChip />

        <View style={[styles.games, wide && styles.gamesWide]}>
          {GAMES.map((game) => (
            <Pressable
              key={game.id}
              accessibilityRole="button"
              accessibilityLabel={`Play ${game.title}: ${game.tagline}`}
              onPress={() => router.push(`/play/${game.id}`)}
              style={({ pressed }) => [
                styles.card,
                wide && styles.cardWide,
                { backgroundColor: CARD_COLORS[game.id] },
                pressed && styles.pressed,
              ]}
            >
              <GameArt game={game.id} width={wide ? 220 : 128} />
              <View style={[styles.cardText, wide && styles.cardTextWide]}>
                <AppText variant="kidHeading" style={styles.ink}>
                  {game.title}
                </AppText>
                <AppText variant="kidBody" style={[styles.ink, styles.soft]}>
                  {game.tagline}
                </AppText>
              </View>
            </Pressable>
          ))}
        </View>

        <View
          style={[styles.treasure, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <StarJars stars={stars} />
          <View style={styles.badgeList}>
            {badges.length === 0 ? (
              <AppText variant="kidBody" tone="muted">
                Play a game to fill your star jar!
              </AppText>
            ) : (
              badges.map((b) => <BadgeMedal key={b.id} badge={b} size={64} />)
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <HoldButton label="Grown-ups: hold to open" onComplete={openGrownUps} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Headset state in kid words, with the demo clearly marked. */
function HeadsetChip() {
  const { eeg, kind, active } = useEEGContext();
  const { colors } = useTheme();
  const gate = qualityGate(eeg.result);
  const ready = active && eeg.status === "open" && gate.status === "ready";
  const label =
    kind === "demo"
      ? "Demo mode: pretend brainwaves"
      : ready
        ? "Headband ready"
        : !active
          ? "Headband not connected"
          : "Checking the headband…";
  return (
    <View style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.dot, { backgroundColor: ready ? colors.good : colors.fair }]} />
      <AppText variant="label">{label}</AppText>
    </View>
  );
}

/** Full jars for every 50 stars, and one jar filling up. No numbers. */
function StarJars({ stars }: { readonly stars: number }) {
  const full = Math.floor(stars / STARS_PER_JAR);
  const fill = (stars % STARS_PER_JAR) / STARS_PER_JAR;
  return (
    <View style={styles.jars} accessible accessibilityLabel={`Star jar: ${stars} stars collected`}>
      {Array.from({ length: Math.min(full, 4) }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: identical full jars.
        <Jar key={i} fill={1} size={56} />
      ))}
      <Jar fill={fill} size={84} />
    </View>
  );
}

function Jar({ fill, size }: { readonly fill: number; readonly size: number }) {
  // The stars inside: a rounded block from the fill level down to the jar's floor.
  const inner = { left: 11, right: 69, top: 33, bottom: 93 };
  const top = inner.bottom - fill * (inner.bottom - inner.top);
  return (
    <Svg width={size} height={size * 1.15} viewBox="0 0 80 100">
      <Path
        d="M14 30 Q8 30 8 40 V88 Q8 96 18 96 H62 Q72 96 72 88 V40 Q72 30 66 30 Z"
        fill="rgba(124,198,255,0.18)"
        stroke="#7CC6FF"
        strokeWidth={3}
      />
      {fill > 0.02 ? (
        <Rect
          x={inner.left}
          y={top}
          width={inner.right - inner.left}
          height={inner.bottom - top}
          rx={Math.min(7, (inner.bottom - top) / 2)}
          fill={kid.star}
        />
      ) : null}
      {fill > 0.25 ? (
        <Path
          d={STAR_PATH}
          transform={`translate(28 ${Math.max(top + 4, 64)})`}
          fill={kid.sunDeep}
        />
      ) : null}
      <Rect x={16} y={18} width={48} height={12} rx={4} fill={kid.coral} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  welcome: { alignItems: "center", justifyContent: "center", gap: space.lg, padding: space.xl },
  buddies: { flexDirection: "row", alignItems: "flex-end", gap: space.sm },
  center: { textAlign: "center" },
  content: {
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: "center",
    padding: space.lg,
    paddingBottom: space.xxl,
    gap: space.lg,
  },
  header: { flexDirection: "row", alignItems: "center", gap: space.md },
  greeting: { flex: 1 },
  chooser: { borderRadius: radius.lg, padding: space.lg, gap: space.md },
  chooserRow: { flexDirection: "row", flexWrap: "wrap", gap: space.lg },
  chooserItem: { alignItems: "center", gap: 4, width: 80 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: space.sm,
    paddingHorizontal: space.md,
    minHeight: 36,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  games: { gap: space.md },
  gamesWide: { flexDirection: "row" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    padding: space.md,
    borderRadius: 24,
    minHeight: 120,
    borderBottomWidth: 5,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  cardWide: { flex: 1, flexDirection: "column", alignItems: "stretch" },
  cardText: { flex: 1, gap: 2 },
  cardTextWide: { paddingHorizontal: space.xs, paddingBottom: space.xs },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  ink: { color: kid.ink },
  soft: { opacity: 0.75 },
  treasure: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: space.lg,
    padding: space.lg,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
  },
  jars: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  badgeList: { flex: 1, minWidth: 180, flexDirection: "row", flexWrap: "wrap", gap: space.md },
  footer: { alignItems: "center", paddingTop: space.md },
});
