import { useEffect } from "react";
import { StyleSheet } from "react-native";
import {
  cancelAnimation,
  Easing,
  type SharedValue,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, G, LinearGradient, Rect, Stop } from "react-native-svg";

/** What every scene gets from the game session. */
export interface SceneProps {
  /** Smoothed attention score, 0–1, animated. */
  readonly level: SharedValue<number>;
  /** Progress towards the next star, 0–1, animated. */
  readonly progress: SharedValue<number>;
  /** Stars earned in this round so far. */
  readonly stars: number;
  /** The child's buddy design. */
  readonly avatar: number;
  readonly width: number;
  readonly height: number;
  /** False while paused (bad signal, baseline, breaks): movement driven by focus stops. */
  readonly running: boolean;
}

/** A value that runs 0 → 1 over `durationMs`, forever (still under reduced motion). */
export function useLoop(durationMs: number, reverse = false): SharedValue<number> {
  const t = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (reduceMotion) return;
    t.value = withRepeat(
      withTiming(1, {
        duration: durationMs,
        easing: reverse ? Easing.inOut(Easing.sin) : Easing.linear,
      }),
      -1,
      reverse,
    );
    return () => cancelAnimation(t);
  }, [durationMs, reverse, reduceMotion, t]);
  return t;
}

/** A full-size vertical gradient, used for skies. */
export function SkyGradient({
  id,
  width,
  height,
  top,
  bottom,
}: {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly top: string;
  readonly bottom: string;
}) {
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={top} />
          <Stop offset="1" stopColor={bottom} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill={`url(#${id})`} />
    </Svg>
  );
}

/** A fluffy cloud in a 120 × 60 box. */
export function Cloud({
  width,
  opacity = 0.95,
}: {
  readonly width: number;
  readonly opacity?: number;
}) {
  return (
    <Svg width={width} height={width / 2} viewBox="0 0 120 60">
      <G opacity={opacity} fill="#FFFFFF">
        <Rect x={10} y={30} width={100} height={26} rx={13} />
        <Rect x={28} y={14} width={44} height={40} rx={20} />
        <Rect x={56} y={6} width={44} height={46} rx={22} />
      </G>
    </Svg>
  );
}
