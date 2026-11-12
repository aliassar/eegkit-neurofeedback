import { useEffect } from "react";
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { type Badge, celebrationMessage } from "@/lib/rewards";
import { kid, space } from "@/theme/tokens";
import { AppText } from "../AppText";
import { BadgeMedal } from "../kid/BadgeMedal";
import { Buddy } from "../kid/Buddy";
import { KidButton } from "../kid/KidButton";
import { Star } from "../kid/Star";

export interface CelebrationData {
  readonly stars: number;
  readonly rounds: number;
  readonly newBadges: readonly Badge[];
}

/**
 * The end of a session. It celebrates effort: the stars collected and any
 * new badge, never a score, and it looks the same on a hard day.
 */
export function Celebration({
  data,
  avatar,
  onHome,
  onPlayAgain,
}: {
  readonly data: CelebrationData;
  readonly avatar: number;
  readonly onHome: () => void;
  readonly onPlayAgain: () => void;
}) {
  const { width } = useWindowDimensions();
  const message = celebrationMessage(data.rounds, data.stars + data.rounds);
  return (
    <SafeAreaView style={styles.root}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: 14 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: decorative, fixed count.
          <FallingStar key={i} index={i} width={width} />
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Buddy avatar={avatar} size={140} cheering />
        <AppText variant="kidTitle" style={styles.center} accessibilityRole="header">
          {message}
        </AppText>
        {data.stars > 0 ? (
          <View
            style={styles.pile}
            accessible
            accessibilityLabel={`You collected ${data.stars} stars`}
          >
            {Array.from({ length: Math.min(data.stars, 40) }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: stars are identical.
              <Star key={i} size={30} />
            ))}
          </View>
        ) : null}
        {data.newBadges.length > 0 ? (
          <View style={styles.badges}>
            <AppText variant="kidHeading" style={styles.center}>
              {data.newBadges.length === 1 ? "New badge!" : "New badges!"}
            </AppText>
            <View style={styles.badgeRow}>
              {data.newBadges.map((b) => (
                <BadgeMedal key={b.id} badge={b} size={92} textColor={kid.ink} />
              ))}
            </View>
          </View>
        ) : null}
        <View style={styles.actions}>
          <KidButton label="Play again" color={kid.grass} onPress={onPlayAgain} />
          <KidButton label="Home" color={kid.sun} onPress={onHome} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FallingStar({ index, width }: { readonly index: number; readonly width: number }) {
  const t = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (reduceMotion) return;
    t.value = withDelay(
      (index * 370) % 2600,
      withRepeat(withTiming(1, { duration: 3600 + (index % 4) * 700, easing: Easing.linear }), -1),
    );
  }, [index, reduceMotion, t]);
  const x = ((index * 0.37) % 1) * (width - 30);
  const style = useAnimatedStyle(() => ({
    opacity: reduceMotion ? 0 : interpolate(t.value, [0, 0.1, 0.85, 1], [0, 1, 1, 0]),
    transform: [
      { translateY: interpolate(t.value, [0, 1], [-40, 900]) },
      { rotate: `${t.value * 360}deg` },
    ],
  }));
  return (
    <Animated.View style={[styles.falling, { left: x }, style]}>
      <Star size={18 + (index % 3) * 8} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF4D6" },
  content: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: space.xl,
    gap: space.lg,
  },
  center: { textAlign: "center", color: kid.ink },
  pile: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 4,
    maxWidth: 420,
  },
  badges: { alignItems: "center", gap: space.sm },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: space.lg, justifyContent: "center" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: space.md, justifyContent: "center" },
  falling: { position: "absolute", top: 0 },
});
