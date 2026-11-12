import { Pressable, StyleSheet, View } from "react-native";
import type { Profile } from "@/lib/profiles";
import { useTheme } from "@/theme/theme";
import { radius, space } from "@/theme/tokens";
import { AppText } from "./AppText";
import { Buddy } from "./kid/Buddy";

/** Pills with each child's buddy and name; one is selected. */
export function ChildPicker({
  profiles,
  selected,
  onSelect,
}: {
  readonly profiles: readonly Profile[];
  readonly selected: string | undefined;
  readonly onSelect: (id: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="Child">
      {profiles.map((p) => {
        const on = p.id === selected;
        return (
          <Pressable
            key={p.id}
            accessibilityRole="radio"
            accessibilityLabel={p.name}
            accessibilityState={{ checked: on }}
            onPress={() => onSelect(p.id)}
            style={[
              styles.pill,
              {
                backgroundColor: on ? colors.accentSoft : colors.surface,
                borderColor: on ? colors.accent : colors.border,
              },
            ]}
          >
            <Buddy avatar={p.avatar} size={28} />
            <AppText variant="label">{p.name}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    minHeight: 44,
    paddingLeft: space.sm,
    paddingRight: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
