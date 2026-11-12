import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { LockIcon } from "@/components/icons";
import { HoldButton } from "@/components/kid/HoldButton";
import { useGate } from "@/state/gate";
import { useTheme } from "@/theme/theme";
import { radius, space } from "@/theme/tokens";

/** The way into the grown-up area: press and hold, which young children rarely do by accident. */
export default function Gate() {
  const { colors } = useTheme();
  const { unlock } = useGate();
  const router = useRouter();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
          <LockIcon color={colors.accent} size={32} />
        </View>
        <AppText variant="title" accessibilityRole="header" style={styles.center}>
          Grown-ups only
        </AppText>
        <AppText tone="muted" style={styles.center}>
          Settings, children's progress and the headset setup are in here. Press and hold the button
          for two seconds to open.
        </AppText>
        <HoldButton
          label="Hold to open"
          onComplete={() => {
            unlock();
            router.replace("/grown-ups");
          }}
        />
        <Button label="Back to the games" variant="ghost" onPress={() => router.replace("/")} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, alignItems: "center", justifyContent: "center", padding: space.lg },
  card: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    gap: space.lg,
    padding: space.xl,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  icon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  center: { textAlign: "center" },
});
