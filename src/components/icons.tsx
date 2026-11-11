import Svg, { Circle, Path } from "react-native-svg";

interface IconProps {
  readonly color: string;
  readonly size?: number;
}

const stroke = {
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  fill: "none",
} as const;

export function LiveIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M2 12h3.5l2.5-6 4 13 3-9 2 4H22" stroke={color} {...stroke} />
    </Svg>
  );
}

export function TrainIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={4} stroke={color} {...stroke} />
      <Circle cx={12} cy={12} r={8.5} stroke={color} {...stroke} strokeDasharray="2 3" />
    </Svg>
  );
}

export function HistoryIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" stroke={color} {...stroke} />
      <Path d="M3 3.5V8h4.5M12 7.5V12l3 2" stroke={color} {...stroke} />
    </Svg>
  );
}

export function SetupIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1" stroke={color} {...stroke} />
      <Circle cx={15} cy={6} r={2} stroke={color} {...stroke} />
      <Circle cx={9} cy={12} r={2} stroke={color} {...stroke} />
      <Circle cx={17} cy={18} r={2} stroke={color} {...stroke} />
    </Svg>
  );
}
