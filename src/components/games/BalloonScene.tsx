import { StyleSheet, View } from "react-native";
import Animated, { interpolate, useAnimatedStyle } from "react-native-reanimated";
import Svg, { Circle, G, Path, Rect } from "react-native-svg";
import { kid } from "@/theme/tokens";
import { Buddy } from "../kid/Buddy";
import { STAR_PATH } from "../kid/Star";
import { Cloud, type SceneProps, SkyGradient, useLoop } from "./shared";

/**
 * Sky Balloon: the balloon floats up while the score is above the child's
 * baseline and drifts down when it drops. Up high, the star above it charges
 * with focused time; when it is full the child catches it.
 */
export function BalloonScene({ level, progress, avatar, width, height }: SceneProps) {
  const sway = useLoop(3200, true);
  const cloudsA = useLoop(26_000);
  const cloudsB = useLoop(41_000);
  const balloonW = Math.min(200, width * 0.34, height * 0.2);
  const balloonH = balloonW * 1.5;
  const top = height * 0.16;
  const bottom = height - balloonH - height * 0.12;

  const balloon = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(level.value, [0, 1], [bottom, top]) },
      { rotate: `${interpolate(sway.value, [0, 1], [-3, 3])}deg` },
    ],
  }));
  const trail = useAnimatedStyle(() => ({
    opacity: interpolate(level.value, [0.5, 0.8], [0, 1], "clamp"),
  }));
  const star = useAnimatedStyle(() => ({
    opacity: 0.35 + 0.65 * progress.value,
    transform: [{ scale: 0.7 + 0.5 * progress.value }, { rotate: `${progress.value * 72}deg` }],
  }));
  const glow = useAnimatedStyle(() => ({
    opacity: 0.15 + 0.6 * progress.value,
    transform: [{ scale: 0.6 + 0.9 * progress.value }],
  }));
  const cloudLayerA = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(cloudsA.value, [0, 1], [width, -width * 0.6]) }],
  }));
  const cloudLayerB = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(cloudsB.value, [0, 1], [width * 0.4, -width]) }],
  }));

  const starSize = Math.min(72, width * 0.16);
  return (
    <View style={[styles.scene, { width, height }]}>
      <SkyGradient id="balloon-sky" width={width} height={height} top="#7CC6FF" bottom="#E8F7FF" />
      <Animated.View style={[styles.layer, { top: height * 0.3 }, cloudLayerA]}>
        <Cloud width={Math.min(160, width * 0.36)} />
      </Animated.View>
      <Animated.View style={[styles.layer, { top: height * 0.55, left: width * 0.3 }, cloudLayerB]}>
        <Cloud width={Math.min(120, width * 0.28)} opacity={0.8} />
      </Animated.View>
      {/* Hills */}
      <Svg width={width} height={height * 0.22} style={[styles.layer, { bottom: 0 }]}>
        <Path
          d={`M0 ${height * 0.12} Q${width * 0.25} 0 ${width * 0.55} ${height * 0.1} T${width} ${height * 0.06} V${height * 0.22} H0 Z`}
          fill={kid.grass}
        />
        <Path
          d={`M0 ${height * 0.18} Q${width * 0.4} ${height * 0.08} ${width} ${height * 0.16} V${height * 0.22} H0 Z`}
          fill={kid.grassDeep}
        />
      </Svg>
      {/* The star to catch */}
      <View
        style={[
          styles.layer,
          { left: width * 0.62, top: height * 0.06, width: starSize * 2, height: starSize * 2 },
          styles.center,
        ]}
      >
        <Animated.View
          style={[
            styles.layer,
            {
              width: starSize * 2,
              height: starSize * 2,
              borderRadius: starSize,
              backgroundColor: "#FFFBE0",
            },
            glow,
          ]}
        />
        <Animated.View style={star}>
          <Svg width={starSize} height={starSize} viewBox="0 0 24 24">
            <Path d={STAR_PATH} fill={kid.star} stroke={kid.starEdge} strokeWidth={1.2} />
          </Svg>
        </Animated.View>
      </View>
      {/* Balloon */}
      <Animated.View style={[styles.layer, { left: width * 0.18, top: 0 }, balloon]}>
        <Animated.View style={[styles.layer, { left: -18, top: balloonH * 0.2 }, trail]}>
          <Sparkles size={balloonW * 0.4} />
        </Animated.View>
        <BalloonArt width={balloonW} height={balloonH} avatar={avatar} />
      </Animated.View>
    </View>
  );
}

function BalloonArt({ width, height, avatar }: { width: number; height: number; avatar: number }) {
  const buddy = width * 0.34;
  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox="0 0 100 150">
        <G>
          <Path
            d="M50 4 C18 4 6 30 10 52 C14 74 34 88 42 100 H58 C66 88 86 74 90 52 C94 30 82 4 50 4 Z"
            fill={kid.coral}
          />
          <Path
            d="M50 4 C38 4 30 30 32 52 C34 74 42 88 46 100 H54 C58 88 66 74 68 52 C70 30 62 4 50 4 Z"
            fill={kid.sun}
          />
          <Path
            d="M50 4 C46 4 44 30 45 52 C46 74 48 88 49 100 H51 C52 88 54 74 55 52 C56 30 54 4 50 4 Z"
            fill={kid.coral}
          />
          <Path
            d="M24 22 C20 30 18 40 20 48"
            stroke="#FFFFFF"
            strokeWidth={4}
            strokeLinecap="round"
            opacity={0.5}
            fill="none"
          />
        </G>
        <Path d="M42 100 L38 118 M58 100 L62 118" stroke="#8A5A3C" strokeWidth={2} />
        <Rect x={34} y={116} width={32} height={22} rx={5} fill="#B9784F" />
        <Rect x={34} y={116} width={32} height={6} rx={3} fill="#9A5F3A" />
        <Circle cx={50} cy={100} r={1} fill="#8A5A3C" />
      </Svg>
      <View style={[styles.layer, { left: (width - buddy) / 2, top: height * 0.67 }]}>
        <Buddy avatar={avatar} size={buddy} />
      </View>
    </View>
  );
}

function Sparkles({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 2} viewBox="0 0 24 48">
      <G fill={kid.star}>
        <Path d={STAR_PATH} transform="translate(0 0) scale(0.6)" />
        <Path d={STAR_PATH} transform="translate(8 16) scale(0.45)" />
        <Path d={STAR_PATH} transform="translate(2 30) scale(0.55)" />
      </G>
    </Svg>
  );
}

const styles = StyleSheet.create({
  scene: { overflow: "hidden" },
  layer: { position: "absolute" },
  center: { alignItems: "center", justifyContent: "center" },
});
