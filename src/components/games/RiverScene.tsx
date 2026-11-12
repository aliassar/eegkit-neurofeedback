import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
} from "react-native-reanimated";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { kid } from "@/theme/tokens";
import { Buddy } from "../kid/Buddy";
import { Cloud, type SceneProps, SkyGradient, useLoop } from "./shared";

/** Scroll speed of the water, px/s, at score 0 and score 1. */
const SLOW = 18;
const FAST = 190;

/**
 * River Boat: the boat sails faster with focus (the banks and waves stream
 * past) and floats gently when attention drops. The next flag comes closer
 * with focused time; reaching it earns a star.
 */
export function RiverScene({ level, progress, avatar, width, height, running }: SceneProps) {
  const bob = useLoop(2200, true);
  const offset = useSharedValue(0);
  const runningValue = useSharedValue(running ? 1 : 0);
  useEffect(() => {
    runningValue.value = running ? 1 : 0;
  }, [running, runningValue]);

  useFrameCallback((frame) => {
    const dt = Math.min(0.1, (frame.timeSincePreviousFrame ?? 16) / 1000);
    const speed = runningValue.value * (SLOW + (FAST - SLOW) * level.value);
    offset.value = (offset.value + speed * dt) % 100_000;
  });

  const waterTop = height * 0.46;
  /** The near bank at the bottom of the screen. */
  const nearTop = height * 0.84;
  /** Where the boat and the flag float. */
  const lane = waterTop + (nearTop - waterTop) * 0.45;
  const tile = Math.max(width, 400);
  const scroll = (factor: number) => () => {
    "worklet";
    return { transform: [{ translateX: -((offset.value * factor) % tile) }] };
  };
  const far = useAnimatedStyle(scroll(0.25));
  const bank = useAnimatedStyle(scroll(0.6));
  const waves = useAnimatedStyle(scroll(1));
  const near = useAnimatedStyle(scroll(1.5));

  const boatW = Math.min(260, width * 0.38, height * 0.3);
  const boatX = width * 0.08;
  const boat = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(bob.value, [0, 1], [-4, 4]) },
      { rotate: `${interpolate(bob.value, [0, 1], [-2.5, 2.5])}deg` },
    ],
  }));
  const flag = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(progress.value, [0, 1], [width * 0.9, boatX + boatW * 0.75]),
      },
      { translateY: interpolate(bob.value, [0, 1], [3, -3]) },
    ],
  }));
  const wake = useAnimatedStyle(() => ({
    opacity: interpolate(level.value, [0.4, 0.8], [0, 0.9], "clamp"),
  }));

  return (
    <View style={[styles.scene, { width, height }]}>
      <SkyGradient id="river-sky" width={width} height={height} top="#FFD9A8" bottom="#BFE6FF" />
      <View style={[styles.layer, { left: width * 0.64, top: height * 0.08 }]}>
        <Svg width={70} height={70}>
          <Circle cx={35} cy={35} r={28} fill={kid.sun} opacity={0.9} />
        </Svg>
      </View>
      <View style={[styles.layer, { left: width * 0.12, top: height * 0.12 }]}>
        <Cloud width={Math.min(130, width * 0.3)} />
      </View>
      {/* Far hills */}
      <Animated.View style={[styles.layer, styles.row, { top: waterTop - height * 0.2 }, far]}>
        {[0, 1].map((i) => (
          <Svg key={i} width={tile} height={height * 0.2}>
            <Path
              d={`M0 ${height * 0.12} Q${tile * 0.25} 0 ${tile * 0.5} ${height * 0.1} T${tile} ${height * 0.12} V${height * 0.2} H0 Z`}
              fill="#8CCB8F"
            />
          </Svg>
        ))}
      </Animated.View>
      {/* Near bank with trees */}
      <Animated.View style={[styles.layer, styles.row, { top: waterTop - 46 }, bank]}>
        {[0, 1].map((i) => (
          <Svg key={i} width={tile} height={56}>
            <Rect x={0} y={36} width={tile} height={20} fill={kid.grassDeep} />
            {[0.08, 0.3, 0.55, 0.8].map((x) => (
              <Tree key={x} x={x * tile} />
            ))}
          </Svg>
        ))}
      </Animated.View>
      {/* Water */}
      <View
        style={[
          styles.layer,
          { top: waterTop, width, height: nearTop - waterTop, backgroundColor: "#4FA9E6" },
        ]}
      />
      <Animated.View style={[styles.layer, styles.row, { top: waterTop + 16 }, waves]}>
        {[0, 1].map((i) => (
          <Svg key={i} width={tile} height={nearTop - waterTop - 16}>
            {Array.from({ length: 12 }, (_, k) => (
              <Path
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed decorative pattern.
                key={k}
                d={`M${(k * tile) / 12} ${12 + (((k * 29) % 3) * (nearTop - waterTop - 40)) / 2} q12 -8 24 0 t24 0`}
                stroke="#FFFFFF"
                strokeWidth={3}
                strokeLinecap="round"
                opacity={0.55}
                fill="none"
              />
            ))}
          </Svg>
        ))}
      </Animated.View>
      {/* Near bank with reeds, passing fastest */}
      <View
        style={[
          styles.layer,
          { top: nearTop, width, height: height - nearTop, backgroundColor: kid.grass },
        ]}
      />
      <Animated.View style={[styles.layer, styles.row, { top: nearTop - 14 }, near]}>
        {[0, 1].map((i) => (
          <Svg key={i} width={tile} height={40}>
            {[0.05, 0.22, 0.4, 0.61, 0.83].map((x) => (
              <Path
                key={x}
                d={`M${x * tile} 40 q-4 -18 -2 -34 M${x * tile + 8} 40 q2 -16 6 -28 M${x * tile + 16} 40 q0 -14 -4 -24`}
                stroke={kid.grassDeep}
                strokeWidth={4}
                strokeLinecap="round"
                fill="none"
              />
            ))}
          </Svg>
        ))}
      </Animated.View>
      {/* Flag buoy */}
      <Animated.View style={[styles.layer, { top: lane - 58, left: 0 }, flag]}>
        <Svg width={44} height={70} viewBox="0 0 44 70">
          <Path d="M10 6 V54" stroke={kid.ink} strokeWidth={3} strokeLinecap="round" />
          <Path d="M12 6 L38 15 L12 24 Z" fill={kid.coral} />
          <Rect x={2} y={50} width={18} height={12} rx={6} fill="#FFFFFF" />
        </Svg>
      </Animated.View>
      {/* Boat */}
      <Animated.View style={[styles.layer, { left: boatX, top: lane - boatW * 0.36 }, boat]}>
        <Animated.View style={[styles.layer, { left: -boatW * 0.35, top: boatW * 0.36 }, wake]}>
          <Svg width={boatW * 0.45} height={24} viewBox="0 0 60 24">
            <Path
              d="M58 6 q-14 -6 -28 0 t-28 0 M58 18 q-14 -6 -28 0"
              stroke="#FFFFFF"
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
            />
          </Svg>
        </Animated.View>
        <View style={[styles.layer, { left: boatW * 0.3, top: -boatW * 0.12 }]}>
          <Buddy avatar={avatar} size={boatW * 0.42} />
        </View>
        <Svg width={boatW} height={boatW * 0.5} viewBox="0 0 100 50">
          <Path d="M4 14 H96 L84 44 Q50 52 16 44 Z" fill={kid.coral} />
          <Path d="M4 14 H96 L93 22 H7 Z" fill="#FFFFFF" opacity={0.85} />
          <Circle cx={30} cy={31} r={4} fill="#FFFFFF" opacity={0.8} />
          <Circle cx={50} cy={32} r={4} fill="#FFFFFF" opacity={0.8} />
          <Circle cx={70} cy={31} r={4} fill="#FFFFFF" opacity={0.8} />
        </Svg>
      </Animated.View>
    </View>
  );
}

function Tree({ x }: { x: number }) {
  return (
    <>
      <Rect x={x + 9} y={22} width={6} height={18} fill="#8A5A3C" />
      <Circle cx={x + 12} cy={18} r={14} fill={kid.grass} />
    </>
  );
}

const styles = StyleSheet.create({
  scene: { overflow: "hidden" },
  layer: { position: "absolute" },
  row: { flexDirection: "row", left: 0 },
});
