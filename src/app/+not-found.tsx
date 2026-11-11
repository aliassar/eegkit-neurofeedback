import { Link } from "expo-router";
import { StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { useTheme } from "@/theme/theme";
import { space } from "@/theme/tokens";

export default function NotFound() {
  const { colors } = useTheme();
  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <AppText variant="title" accessibilityRole="header">
        Page not found
      </AppText>
      <AppText tone="muted">There's nothing at this address.</AppText>
      <Link href="/" style={[styles.link, { color: colors.accent }]}>
        Go to the live signal
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: space.md,
    padding: space.xl,
  },
  link: { fontSize: 15, fontWeight: "600", paddingVertical: space.md },
});
