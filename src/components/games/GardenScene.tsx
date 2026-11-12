import { StyleSheet, View } from "react-native";
import Animated, { interpolate, useAnimatedStyle } from "react-native-reanimated";
import Svg, { Circle, Ellipse, G, Path } from "react-native-svg";
import { kid } from "@/theme/tokens";
import { Buddy } from "../kid/Buddy";
import { type SceneProps, SkyGradient, useLoop } from "./shared";

const PETALS = [kid.pink, kid.violet, kid.coral, kid.sun, "#6FD3F5", "#FF9FD0"];

/**
 * Magic Garden: while focused, the current flower grows from a sprout to a
 * full bloom and the sun shines brighter. Every bloom is a star, and the bed
 * fills up with flowers over the round.
 */
export function GardenScene({ level, progress, stars, avatar, width, height }: SceneProps) {
  const flutter = useLoop(900, true);
  const drift = useLoop(7000, true);
  const ground = height * 0.22;
  const buddySize = Math.min(110, width * 0.24);
  const bedLeft = buddySize + 12;
  const slot = Math.max(76, Math.min(120, (width - bedLeft) / 5));
  const slots = Math.max(2, Math.floor((width - bedLeft - 8) / slot));
  // When the bed is full, older blooms make room on the left.
  const bloomed = Math.min(stars, slots - 1);
  const growingIndex = bloomed;
  const stemMax = Math.min(height * 0.36, 230);
  /** Where stems meet the soil, from the bottom of the scene. */
  const soilLine = ground - 22;

  const sun = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(level.value, [0, 1], [0.75, 1.15]) }],
  }));
  const sunGlow = useAnimatedStyle(() => ({
    opacity: interpolate(level.value, [0, 1], [0.1, 0.55]),
    transform: [{ scale: interpolate(level.value, [0, 1], [0.8, 1.6]) }],
  }));
  const stem = useAnimatedStyle(() => ({ height: 24 + stemMax * progress.value }));
  const head = useAnimatedStyle(() => ({
    transform: [
      { translateY: slot / 2 - (24 + stemMax * progress.value) },
      { scale: interpolate(progress.value, [0, 0.55, 1], [0.5, 0.65, 1]) },
    ],
  }));
  const petals = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.55, 0.9], [0, 1], "clamp"),
  }));
  const butterfly = useAnimatedStyle(() => ({
    opacity: interpolate(level.value, [0.45, 0.75], [0, 1], "clamp"),
    transform: [
      { translateX: interpolate(drift.value, [0, 1], [-width * 0.12, width * 0.12]) },
      { translateY: interpolate(drift.value, [0, 0.5, 1], [0, -18, 0]) },
      { scaleX: interpolate(flutter.value, [0, 1], [0.4, 1]) },
    ],
  }));
  const buddyBounce = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(level.value, [0, 1], [4, -10]) }],
  }));

  const sunSize = Math.min(110, width * 0.24);
  const color = PETALS[growingIndex % PETALS.length] as string;
  return (
    <View style={[styles.scene, { width, height }]}>
      <SkyGradient id="garden-sky" width={width} height={height} top="#A8DCFF" bottom="#F1FBFF" />
      <View
        style={[
          styles.layer,
          { left: width * 0.06, top: height * 0.06, width: sunSize, height: sunSize },
        ]}
      >
        <Animated.View
          style={[styles.fill, { borderRadius: sunSize / 2, backgroundColor: "#FFFBE0" }, sunGlow]}
        />
        <Animated.View style={[styles.fill, sun]}>
          <Svg width={sunSize} height={sunSize} viewBox="0 0 100 100">
            <Circle cx={50} cy={50} r={30} fill={kid.sun} />
            <Circle cx={41} cy={46} r={3.5} fill={kid.ink} />
            <Circle cx={59} cy={46} r={3.5} fill={kid.ink} />
            <Path
              d="M41 58 q9 8 18 0"
              stroke={kid.ink}
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
            />
          </Svg>
        </Animated.View>
      </View>
      <Animated.View style={[styles.layer, { left: width * 0.5, top: height * 0.24 }, butterfly]}>
        <Svg width={44} height={36} viewBox="0 0 44 36">
          <Ellipse cx={12} cy={14} rx={11} ry={12} fill={kid.pink} />
          <Ellipse cx={32} cy={14} rx={11} ry={12} fill={kid.violet} />
          <Ellipse cx={22} cy={18} rx={3} ry={12} fill={kid.ink} />
        </Svg>
      </Animated.View>
      {/* Soil and grass */}
      <Svg width={width} height={ground} style={[styles.layer, { bottom: 0 }]}>
        <Path d={`M0 18 Q${width / 2} 0 ${width} 18 V${ground} H0 Z`} fill="#9B6B4A" />
        <Path
          d={`M0 18 Q${width / 2} 0 ${width} 18 V30 Q${width / 2} 14 0 30 Z`}
          fill={kid.grass}
        />
      </Svg>
      {/* Seeds waiting in the empty spots */}
      {Array.from({ length: Math.max(0, slots - bloomed - 1) }, (_, k) => (
        <View
          // biome-ignore lint/suspicious/noArrayIndexKey: slots are positional and never reorder.
          key={k}
          style={[
            styles.layer,
            { left: bedLeft + (growingIndex + 1 + k) * slot + slot / 2 - 18, bottom: soilLine - 8 },
          ]}
        >
          <Svg width={36} height={16} viewBox="0 0 36 16">
            <Path d="M2 16 Q18 0 34 16 Z" fill="#7E5236" />
            <Ellipse cx={18} cy={10} rx={3.5} ry={2.5} fill="#E8C07A" />
          </Svg>
        </View>
      ))}
      {/* Blooms so far */}
      {Array.from({ length: bloomed }, (_, i) => (
        <View
          // biome-ignore lint/suspicious/noArrayIndexKey: slots are positional and never reorder.
          key={i}
          style={[styles.layer, { left: bedLeft + i * slot, bottom: soilLine, width: slot }]}
        >
          <Flower
            size={slot}
            stem={12 + stemMax * (0.8 + (0.2 * ((i * 37) % 5)) / 4)}
            color={PETALS[(stars - bloomed + i) % PETALS.length] as string}
          />
        </View>
      ))}
      {/* The flower growing now */}
      <View
        style={[
          styles.layer,
          styles.grow,
          { left: bedLeft + growingIndex * slot, bottom: soilLine, width: slot },
        ]}
      >
        <Animated.View style={[styles.stem, stem]} />
        <Animated.View style={[styles.head, { width: slot, height: slot }, head]}>
          <Svg width={slot} height={slot} viewBox="0 0 60 60">
            <Circle cx={30} cy={30} r={10} fill={kid.grass} />
          </Svg>
          <Animated.View style={[styles.fill, petals]}>
            <Bloom color={color} size={slot} />
          </Animated.View>
        </Animated.View>
      </View>
      <Animated.View
        style={[styles.layer, { left: 6, bottom: ground - buddySize * 0.45 }, buddyBounce]}
      >
        <Buddy avatar={avatar} size={buddySize} />
      </Animated.View>
    </View>
  );
}

function Bloom({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60">
      <G fill={color}>
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <Ellipse
            key={angle}
            cx={30}
            cy={15}
            rx={9}
            ry={13}
            transform={`rotate(${angle} 30 30)`}
          />
        ))}
      </G>
      <Circle cx={30} cy={30} r={9} fill={kid.sun} />
      <Circle cx={27} cy={28} r={2.5} fill="#FFFFFF" opacity={0.6} />
    </Svg>
  );
}

function Flower({ size, stem, color }: { size: number; stem: number; color: string }) {
  return (
    <View style={styles.grow}>
      <View style={[styles.stem, { height: 12 + stem }]} />
      <View
        style={[
          styles.head,
          { width: size, height: size, transform: [{ translateY: size / 2 - (12 + stem) }] },
        ]}
      >
        <Bloom color={color} size={size} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scene: { overflow: "hidden" },
  layer: { position: "absolute" },
  fill: { ...StyleSheet.absoluteFill },
  grow: { alignItems: "center", justifyContent: "flex-end" },
  stem: { width: 6, borderRadius: 3, backgroundColor: kid.grassDeep },
  head: { position: "absolute", bottom: 0 },
});
