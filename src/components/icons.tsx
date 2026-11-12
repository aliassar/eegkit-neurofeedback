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

export function SignalIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M2 12h3.5l2.5-6 4 13 3-9 2 4H22" stroke={color} {...stroke} />
    </Svg>
  );
}

export function ProgressIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 20h16M7 16v-4M12 16V8M17 16V5" stroke={color} {...stroke} />
    </Svg>
  );
}

export function ChildrenIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={9} cy={8} r={3.2} stroke={color} {...stroke} />
      <Circle cx={17} cy={9.5} r={2.4} stroke={color} {...stroke} />
      <Path
        d="M3.5 19c.6-3.3 2.8-5 5.5-5s4.9 1.7 5.5 5M14.8 14.3c2.6-.6 4.9.7 5.7 4"
        stroke={color}
        {...stroke}
      />
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

export function InfoIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} stroke={color} {...stroke} />
      <Path d="M12 11v6M12 7.5v.01" stroke={color} {...stroke} />
    </Svg>
  );
}

export function LockIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3" stroke={color} {...stroke} />
    </Svg>
  );
}

export function CloseIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 6l12 12M18 6L6 18" stroke={color} {...stroke} strokeWidth={3} />
    </Svg>
  );
}

export function BackIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 5l-7 7 7 7" stroke={color} {...stroke} strokeWidth={2.5} />
    </Svg>
  );
}

/** A soft headband with a sensor, for signal messages. */
export function HeadbandIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 15a8 8 0 0 1 16 0" stroke={color} {...stroke} strokeWidth={3} />
      <Circle cx={12} cy={7} r={2.2} fill={color} />
    </Svg>
  );
}
