import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "@/theme/theme";
import { radius, space } from "@/theme/tokens";
import { AppText } from "../AppText";
import { LockIcon } from "../icons";

const RING = 28;
const STROKE = 3;
const CIRCUMFERENCE = 2 * Math.PI * (RING / 2 - STROKE);

export interface HoldButtonProps {
  readonly label: string;
  /** How long to hold, ms. */
  readonly holdMs?: number;
  readonly onComplete: () => void;
}

/**
 * Press and hold to confirm: a ring fills while held and empties when let go.
 * Keeps young children from opening the grown-up area by accident.
 */
export function HoldButton({ label, holdMs = 2000, onComplete }: HoldButtonProps) {
  const { colors } = useTheme();
  const [progress, setProgress] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const started = useRef(0);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setProgress(0);
  };
  const start = () => {
    stop();
    started.current = Date.now();
    timer.current = setInterval(() => {
      const p = Math.min(1, (Date.now() - started.current) / holdMs);
      setProgress(p);
      if (p >= 1) {
        stop();
        onComplete();
      }
    }, 30);
  };
  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={`Press and hold for ${Math.round(holdMs / 1000)} seconds`}
      onPressIn={start}
      onPressOut={stop}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.surface, borderColor: pressed ? colors.accent : colors.border },
      ]}
    >
      <View style={styles.ring}>
        <Svg width={RING} height={RING} style={StyleSheet.absoluteFill}>
          <Circle
            cx={RING / 2}
            cy={RING / 2}
            r={RING / 2 - STROKE}
            stroke={colors.border}
            strokeWidth={STROKE}
            fill="none"
          />
          <Circle
            cx={RING / 2}
            cy={RING / 2}
            r={RING / 2 - STROKE}
            stroke={colors.accent}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
            transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
          />
        </Svg>
        <LockIcon color={colors.textMuted} size={14} />
      </View>
      <AppText variant="label" tone="muted">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    minHeight: 48,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  ring: { width: RING, height: RING, alignItems: "center", justifyContent: "center" },
});
