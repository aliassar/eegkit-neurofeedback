import type { ReactNode } from "react";
import { Pressable, type PressableProps, StyleSheet, View } from "react-native";
import { kid, radius, space } from "@/theme/tokens";
import { AppText } from "../AppText";

export interface KidButtonProps extends Omit<PressableProps, "children" | "style"> {
  readonly label: string;
  readonly color?: string;
  readonly textColor?: string;
  readonly icon?: ReactNode;
  readonly style?: PressableProps["style"];
}

/** A big, chunky, friendly button with a little 3D lip. */
export function KidButton({
  label,
  color = kid.sun,
  textColor = kid.ink,
  icon,
  disabled,
  style,
  ...props
}: KidButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      {...props}
      accessibilityState={{ ...props.accessibilityState, disabled: !!disabled }}
      disabled={disabled}
      style={(state) => [
        styles.base,
        { backgroundColor: color },
        state.pressed && styles.pressed,
        disabled && styles.disabled,
        typeof style === "function" ? style(state) : style,
      ]}
    >
      {icon ? <View>{icon}</View> : null}
      <AppText variant="kidHeading" style={{ color: textColor }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 64,
    paddingHorizontal: space.xl,
    borderRadius: radius.lg + 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.md,
    borderBottomWidth: 5,
    borderBottomColor: "rgba(0,0,0,0.18)",
  },
  pressed: { transform: [{ translateY: 3 }], borderBottomWidth: 2 },
  disabled: { opacity: 0.45 },
});
