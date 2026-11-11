import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { useTheme } from "@/theme/theme";

export interface OrbProps {
  /** Reward, 0–1. Drives size, colour and glow. */
  readonly score: number;
  /** While false (e.g. during the baseline) the orb rests at a neutral level. */
  readonly engaged: boolean;
  readonly size: number;
}

/** Half a breath: the orb swells and settles about six times a minute. */
const BREATH_MS = 5000;
/** How quickly the orb follows the score. Long enough to feel calm, short enough to stay informative. */
const FOLLOW_MS = 900;

/**
 * The feedback visual: a softly breathing orb that grows, brightens and
 * shifts from violet to mint as the score rises.
 */
export function Orb({ score, engaged, size }: OrbProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const level = useSharedValue(0.35);
  const breath = useSharedValue(0);

  useEffect(() => {
    const target = engaged && Number.isFinite(score) ? score : 0.35;
    level.value = withTiming(target, { duration: FOLLOW_MS, easing: Easing.out(Easing.quad) });
  }, [score, engaged, level]);

  useEffect(() => {
    if (reduceMotion) {
      breath.value = 0;
      return;
    }
    breath.value = withRepeat(
      withTiming(1, { duration: BREATH_MS, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => cancelAnimation(breath);
  }, [reduceMotion, breath]);

  const [low, mid, high] = colors.orb;
  const core = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(level.value, [0, 0.5, 1], [low, mid, high]),
    opacity: interpolate(level.value, [0, 1], [0.6, 1]),
    transform: [{ scale: interpolate(level.value, [0, 1], [0.6, 0.92]) + breath.value * 0.03 }],
  }));
  // Two soft halos, cool and warm, cross-fade as the score rises.
  const coolHalo = useAnimatedStyle(() => ({
    opacity: interpolate(level.value, [0, 0.6], [0.5, 0], "clamp"),
    transform: [{ scale: 0.8 + breath.value * 0.06 }],
  }));
  const warmHalo = useAnimatedStyle(() => ({
    opacity: interpolate(level.value, [0.3, 1], [0, 0.9], "clamp"),
    transform: [{ scale: interpolate(level.value, [0, 1], [0.75, 1]) + breath.value * 0.06 }],
  }));

  const halo = size * 1.5;
  return (
    <View
      style={[styles.frame, { width: halo, height: halo }]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Feedback orb"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: engaged && Number.isFinite(score) ? Math.round(score * 100) : 0,
      }}
    >
      <Animated.View style={[styles.layer, coolHalo]}>
        <Glow id="orb-cool" color={low} size={halo} />
      </Animated.View>
      <Animated.View style={[styles.layer, warmHalo]}>
        <Glow id="orb-warm" color={high} size={halo} />
      </Animated.View>
      <Animated.View
        style={[
          styles.layer,
          { width: size, height: size, borderRadius: size / 2 },
          core,
          styles.clip,
        ]}
      >
        {/* Static shading on top of the animated colour gives the disc depth. */}
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id="orb-shine" cx="38%" cy="32%" r="70%">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.5} />
              <Stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0.06} />
              <Stop offset="1" stopColor="#000000" stopOpacity={0.25} />
            </RadialGradient>
          </Defs>
          <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#orb-shine)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

/** A disc that fades from `color` at the centre to transparent at the edge. */
function Glow({ id, color, size }: { id: string; color: string; size: number }) {
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0.35" stopColor={color} stopOpacity={0.55} />
          <Stop offset="0.65" stopColor={color} stopOpacity={0.18} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  frame: { alignItems: "center", justifyContent: "center" },
  layer: { position: "absolute" },
  clip: { overflow: "hidden" },
});
