import { ActivityIndicator, Pressable, type PressableProps, StyleSheet } from "react-native";
import { useTheme } from "@/theme/theme";
import { radius, space } from "@/theme/tokens";
import { AppText } from "./AppText";

export interface ButtonProps extends Omit<PressableProps, "children" | "style"> {
  readonly label: string;
  readonly variant?: "primary" | "secondary" | "ghost" | "danger";
  readonly busy?: boolean;
  readonly compact?: boolean;
  readonly style?: PressableProps["style"];
}

export function Button({
  label,
  variant = "primary",
  busy,
  compact,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const { colors } = useTheme();
  const palette = {
    primary: { bg: colors.accent, fg: colors.onAccent, border: colors.accent },
    secondary: { bg: colors.surfaceRaised, fg: colors.text, border: colors.border },
    ghost: { bg: "transparent", fg: colors.accent, border: "transparent" },
    danger: { bg: "transparent", fg: colors.poor, border: colors.border },
  }[variant];
  const inactive = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      {...props}
      accessibilityState={{ ...props.accessibilityState, disabled: !!inactive, busy: !!busy }}
      disabled={inactive}
      style={(state) => [
        styles.base,
        compact && styles.compact,
        { backgroundColor: palette.bg, borderColor: palette.border },
        state.pressed && styles.pressed,
        inactive && styles.disabled,
        typeof style === "function" ? style(state) : style,
      ]}
    >
      {busy ? <ActivityIndicator size="small" color={palette.fg} /> : null}
      <AppText variant="label" style={[styles.label, { color: palette.fg }]}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: space.xl,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
  },
  compact: { minHeight: 44, paddingHorizontal: space.lg },
  label: { fontSize: 15 },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.45 },
});
