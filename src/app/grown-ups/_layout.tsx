import { Redirect } from "expo-router";
import { Tabs } from "expo-router/tabs";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChildrenIcon, InfoIcon, ProgressIcon, SetupIcon, SignalIcon } from "@/components/icons";
import { useGate } from "@/state/gate";
import { useTheme } from "@/theme/theme";

/** Below this width the tabs sit at the bottom; above it they become a side rail. */
const RAIL_BREAKPOINT = 900;

/** The grown-up area. Reachable only through the hold-to-open gate. */
export default function GrownUpsLayout() {
  const { unlocked } = useGate();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  if (!unlocked) return <Redirect href="/gate" />;
  const rail = width >= RAIL_BREAKPOINT;
  const icon =
    (Icon: typeof SignalIcon) =>
    ({ color }: { color: unknown }) => <Icon color={String(color)} />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarPosition: rail ? "left" : "bottom",
        tabBarVariant: rail ? "material" : "uikit",
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          // The default bottom bar is too short for the 28 px icon plus a 14 px
          // label line, so the label gets squeezed and clipped.
          ...(rail
            ? {}
            : { height: 64 + insets.bottom, paddingTop: 4, paddingBottom: 6 + insets.bottom }),
        },
        ...(rail ? {} : { tabBarItemStyle: { height: 54 } }),
        tabBarLabelStyle: { fontSize: 11, lineHeight: 14, fontWeight: "600" },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Progress", tabBarIcon: icon(ProgressIcon) }} />
      <Tabs.Screen
        name="children"
        options={{ title: "Children", tabBarIcon: icon(ChildrenIcon) }}
      />
      <Tabs.Screen name="setup" options={{ title: "Setup", tabBarIcon: icon(SetupIcon) }} />
      <Tabs.Screen name="signal" options={{ title: "Signal", tabBarIcon: icon(SignalIcon) }} />
      <Tabs.Screen name="about" options={{ title: "About", tabBarIcon: icon(InfoIcon) }} />
    </Tabs>
  );
}
