import { Text, type TextProps } from "react-native";
import { useTheme } from "@/theme/theme";
import { type as typeScale } from "@/theme/tokens";

export interface AppTextProps extends TextProps {
  readonly variant?: keyof typeof typeScale;
  readonly tone?: "default" | "muted" | "accent" | "good" | "fair" | "poor";
  /** Tabular figures, so changing numbers don't jitter. */
  readonly numeric?: boolean;
}

export function AppText({
  variant = "body",
  tone = "default",
  numeric,
  style,
  ...props
}: AppTextProps) {
  const { colors } = useTheme();
  const color = {
    default: colors.text,
    muted: colors.textMuted,
    accent: colors.accent,
    good: colors.good,
    fair: colors.fair,
    poor: colors.poor,
  }[tone];
  return (
    <Text
      {...props}
      style={[typeScale[variant], { color }, numeric && { fontVariant: ["tabular-nums"] }, style]}
    />
  );
}
