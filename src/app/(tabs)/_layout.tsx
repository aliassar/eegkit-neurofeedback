import { Tabs } from "expo-router/tabs";
import { useWindowDimensions } from "react-native";
import { HistoryIcon, LiveIcon, SetupIcon, TrainIcon } from "@/components/icons";
import { useTheme } from "@/theme/theme";

/** Below this width the tabs sit at the bottom; above it they become a side rail. */
const RAIL_BREAKPOINT = 900;

export default function TabsLayout() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const rail = width >= RAIL_BREAKPOINT;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarPosition: rail ? "left" : "bottom",
        tabBarVariant: rail ? "material" : "uikit",
        tabBarStyle: { backgroundColor: colors.surface, borderColor: colors.border },
        tabBarLabelStyle: { fontWeight: "600" },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Live", tabBarIcon: ({ color }) => <LiveIcon color={String(color)} /> }}
      />
      <Tabs.Screen
        name="train"
        options={{ title: "Train", tabBarIcon: ({ color }) => <TrainIcon color={String(color)} /> }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => <HistoryIcon color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="setup"
        options={{ title: "Setup", tabBarIcon: ({ color }) => <SetupIcon color={String(color)} /> }}
      />
    </Tabs>
  );
}
