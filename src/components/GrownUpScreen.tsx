import { useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import { useGate } from "@/state/gate";
import { useTheme } from "@/theme/theme";
import { radius, space } from "@/theme/tokens";
import { AppText } from "./AppText";
import { BackIcon } from "./icons";
import { Screen, type ScreenProps } from "./Screen";

/** A grown-up screen with a "Games" button that locks the area and returns to the kid home. */
export function GrownUpScreen(props: Omit<ScreenProps, "actions">) {
  const { colors } = useTheme();
  const { lock } = useGate();
  const router = useRouter();
  return (
    <Screen
      {...props}
      actions={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Leave the grown-up area and go back to the games"
          onPress={() => {
            lock();
            router.replace("/");
          }}
          style={({ pressed }) => [
            styles.exit,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && { opacity: 0.7 },
          ]}
        >
          <BackIcon color={colors.accent} size={18} />
          <AppText variant="label" tone="accent">
            Games
          </AppText>
        </Pressable>
      }
    />
  );
}

const styles = StyleSheet.create({
  exit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 44,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
