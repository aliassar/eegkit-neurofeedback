import { StyleSheet, View } from "react-native";
import Svg, { Circle, Ellipse, G, Path, Rect } from "react-native-svg";
import type { Badge } from "@/lib/rewards";
import { kid } from "@/theme/tokens";
import { AppText } from "../AppText";
import { STAR_PATH } from "./Star";

const RIBBON: Record<Badge["icon"], string> = {
  star: kid.coral,
  balloon: kid.skyDeep,
  flower: kid.pink,
  boat: "#3E9EC9",
  medal: kid.violet,
  trophy: kid.grassDeep,
};

/** A round medal with a picture, and the badge's name under it. */
export function BadgeMedal({
  badge,
  size,
  textColor,
}: {
  readonly badge: Badge;
  readonly size: number;
  /** Defaults to the theme's text colour. */
  readonly textColor?: string;
}) {
  return (
    <View
      style={[styles.wrap, { width: size + 24 }]}
      accessible
      accessibilityLabel={`Badge: ${badge.title}`}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Path d="M30 6 L44 40 L36 44 Z M70 6 L56 40 L64 44 Z" fill={RIBBON[badge.icon]} />
        <Circle cx={50} cy={58} r={36} fill={kid.sun} />
        <Circle cx={50} cy={58} r={29} fill="#FFE58A" />
        <G transform="translate(30 38)">
          <Picture icon={badge.icon} />
        </G>
      </Svg>
      <AppText
        variant="label"
        style={[styles.title, textColor ? { color: textColor } : null]}
        numberOfLines={2}
      >
        {badge.title}
      </AppText>
    </View>
  );
}

/** Pictures drawn in a 40 × 40 box. */
function Picture({ icon }: { icon: Badge["icon"] }) {
  switch (icon) {
    case "balloon":
      return (
        <G>
          <Ellipse cx={20} cy={15} rx={12} ry={14} fill={kid.coral} />
          <Path d="M17 28 L15 34 M23 28 L25 34" stroke="#8A5A3C" strokeWidth={1.5} />
          <Rect x={13} y={33} width={14} height={7} rx={2} fill="#B9784F" />
        </G>
      );
    case "flower":
      return (
        <G>
          {[0, 72, 144, 216, 288].map((a) => (
            <Ellipse
              key={a}
              cx={20}
              cy={10}
              rx={6}
              ry={9}
              fill={kid.pink}
              transform={`rotate(${a} 20 20)`}
            />
          ))}
          <Circle cx={20} cy={20} r={6} fill={kid.sunDeep} />
        </G>
      );
    case "boat":
      return (
        <G>
          <Path
            d="M20 4 V26 M20 6 L33 22 H20 Z"
            stroke={kid.ink}
            strokeWidth={1.5}
            fill="#FFFFFF"
          />
          <Path d="M4 27 H36 L31 37 H9 Z" fill={kid.coral} />
        </G>
      );
    case "medal":
      return <Path d={STAR_PATH} transform="translate(2 2) scale(1.5)" fill={kid.violet} />;
    case "trophy":
      return (
        <G fill={kid.sunDeep}>
          <Path d="M10 4 H30 V14 C30 22 24 26 20 26 C16 26 10 22 10 14 Z" />
          <Rect x={17} y={26} width={6} height={6} />
          <Rect x={11} y={32} width={18} height={5} rx={2} />
        </G>
      );
    default:
      return <Path d={STAR_PATH} transform="translate(2 2) scale(1.5)" fill={kid.coral} />;
  }
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 4 },
  title: { textAlign: "center" },
});
