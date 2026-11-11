import { StyleSheet, View, type ViewProps } from "react-native";
import { useTheme } from "@/theme/theme";
import { radius, space } from "@/theme/tokens";
import { AppText } from "./AppText";

export interface CardProps extends ViewProps {
  readonly title?: string;
  /** Shown to the right of the title. */
  readonly accessory?: React.ReactNode;
}

export function Card({ title, accessory, style, children, ...props }: CardProps) {
  const { colors } = useTheme();
  return (
    <View
      {...props}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}
    >
      {title || accessory ? (
        <View style={styles.header}>
          {title ? (
            <AppText variant="heading" accessibilityRole="header" style={styles.title}>
              {title}
            </AppText>
          ) : null}
          {accessory}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.lg,
    gap: space.md,
  },
  header: { flexDirection: "row", alignItems: "center", gap: space.sm, minHeight: 28 },
  title: { flex: 1 },
});
