import Svg, { Circle, Ellipse, G, Path } from "react-native-svg";
import { BUDDY_COLORS, kid } from "@/theme/tokens";

export interface BuddyProps {
  /** Design index, 0 … 5. */
  readonly avatar: number;
  readonly size: number;
  /** Closed happy eyes for celebrations. */
  readonly cheering?: boolean;
}

/**
 * The child's buddy: a soft round creature with a different top on each
 * design (ears, antenna, sprout, horns, crown, long ears) and a colour.
 * Drawn in a 100 × 100 box.
 */
export function Buddy({ avatar, size, cheering }: BuddyProps) {
  const index = ((avatar % BUDDY_COLORS.length) + BUDDY_COLORS.length) % BUDDY_COLORS.length;
  const color = BUDDY_COLORS[index] as string;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Top variant={index} color={color} />
      <Ellipse cx={50} cy={60} rx={36} ry={33} fill={color} />
      <Ellipse cx={50} cy={70} rx={22} ry={16} fill="#FFFFFF" opacity={0.28} />
      {cheering ? (
        <G stroke={kid.ink} strokeWidth={3.5} strokeLinecap="round" fill="none">
          <Path d="M33 54 q5 -6 10 0" />
          <Path d="M57 54 q5 -6 10 0" />
        </G>
      ) : (
        <G>
          <Circle cx={38} cy={54} r={5.5} fill={kid.ink} />
          <Circle cx={62} cy={54} r={5.5} fill={kid.ink} />
          <Circle cx={39.8} cy={52.2} r={1.8} fill="#FFFFFF" />
          <Circle cx={63.8} cy={52.2} r={1.8} fill="#FFFFFF" />
        </G>
      )}
      <Circle cx={29} cy={64} r={4.5} fill={kid.coral} opacity={0.45} />
      <Circle cx={71} cy={64} r={4.5} fill={kid.coral} opacity={0.45} />
      <Path
        d={cheering ? "M41 64 q9 11 18 0 z" : "M43 65 q7 6 14 0"}
        stroke={kid.ink}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={cheering ? kid.ink : "none"}
      />
    </Svg>
  );
}

function Top({ variant, color }: { variant: number; color: string }) {
  switch (variant) {
    case 0: // round ears
      return (
        <G>
          <Circle cx={24} cy={34} r={11} fill={color} />
          <Circle cx={76} cy={34} r={11} fill={color} />
          <Circle cx={24} cy={34} r={5} fill="#FFFFFF" opacity={0.35} />
          <Circle cx={76} cy={34} r={5} fill="#FFFFFF" opacity={0.35} />
        </G>
      );
    case 1: // antenna
      return (
        <G>
          <Path
            d="M50 30 Q52 16 60 10"
            stroke={kid.ink}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />
          <Circle cx={61} cy={9} r={6} fill={kid.sun} />
        </G>
      );
    case 2: // sprout
      return (
        <G>
          <Path d="M50 30 V18" stroke={kid.grassDeep} strokeWidth={3.5} strokeLinecap="round" />
          <Path d="M50 20 C40 10 30 16 32 22 C38 26 46 24 50 20 Z" fill={kid.grass} />
          <Path d="M50 18 C58 6 70 10 69 17 C63 22 55 22 50 18 Z" fill={kid.grass} />
        </G>
      );
    case 3: // little horns
      return (
        <G fill={kid.cream}>
          <Path d="M30 34 L26 16 L40 29 Z" />
          <Path d="M70 34 L74 16 L60 29 Z" />
        </G>
      );
    case 4: // crown of bumps
      return (
        <G fill={color}>
          <Circle cx={35} cy={30} r={8} />
          <Circle cx={50} cy={25} r={9} />
          <Circle cx={65} cy={30} r={8} />
        </G>
      );
    default: // long ears
      return (
        <G>
          <Ellipse cx={34} cy={22} rx={8} ry={18} fill={color} transform="rotate(-12 34 22)" />
          <Ellipse cx={66} cy={22} rx={8} ry={18} fill={color} transform="rotate(12 66 22)" />
          <Ellipse
            cx={34}
            cy={22}
            rx={3.5}
            ry={11}
            fill="#FFFFFF"
            opacity={0.35}
            transform="rotate(-12 34 22)"
          />
          <Ellipse
            cx={66}
            cy={22}
            rx={3.5}
            ry={11}
            fill="#FFFFFF"
            opacity={0.35}
            transform="rotate(12 66 22)"
          />
        </G>
      );
  }
}
