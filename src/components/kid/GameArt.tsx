import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import type { GameId } from "@/lib/games";
import { kid } from "@/theme/tokens";
import { STAR_PATH } from "./Star";

/** Little picture of each game for the home screen, in a 120 × 90 box. */
export function GameArt({ game, width }: { readonly game: GameId; readonly width: number }) {
  const height = (width * 90) / 120;
  return (
    <Svg width={width} height={height} viewBox="0 0 120 90">
      <Defs>
        <LinearGradient id={`art-${game}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={game === "river" ? "#FFD9A8" : "#8FD0FF"} />
          <Stop offset="1" stopColor="#EAF8FF" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={120} height={90} rx={16} fill={`url(#art-${game})`} />
      {game === "balloon" ? <Balloon /> : game === "garden" ? <Garden /> : <River />}
    </Svg>
  );
}

function Balloon() {
  return (
    <G>
      <Path d="M0 74 Q30 60 60 70 T120 66 V90 H0 Z" fill={kid.grass} />
      <Rect x={70} y={22} width={34} height={14} rx={7} fill="#FFFFFF" />
      <Path
        d={STAR_PATH}
        transform="translate(84 4) scale(1.1)"
        fill={kid.star}
        stroke={kid.starEdge}
      />
      <Path
        d="M44 10 C28 10 22 24 24 34 C26 44 36 50 40 56 H48 C52 50 62 44 64 34 C66 24 60 10 44 10 Z"
        fill={kid.coral}
      />
      <Path
        d="M44 10 C38 10 34 24 35 34 C36 44 40 50 42 56 H46 C48 50 52 44 53 34 C54 24 50 10 44 10 Z"
        fill={kid.sun}
      />
      <Path d="M40 56 L38 64 M48 56 L50 64" stroke="#8A5A3C" strokeWidth={1.5} />
      <Rect x={36} y={63} width={16} height={10} rx={3} fill="#B9784F" />
    </G>
  );
}

function Garden() {
  const flowers = [
    { x: 30, h: 26, c: kid.pink },
    { x: 58, h: 34, c: kid.violet },
    { x: 86, h: 22, c: kid.coral },
  ];
  return (
    <G>
      <Circle cx={22} cy={20} r={11} fill={kid.sun} />
      <Path d="M0 66 Q60 56 120 66 V90 H0 Z" fill="#9B6B4A" />
      <Path d="M0 66 Q60 56 120 66 V71 Q60 61 0 71 Z" fill={kid.grass} />
      {flowers.map((f) => (
        <G key={f.x}>
          <Rect x={f.x - 1.5} y={66 - f.h} width={3} height={f.h} fill={kid.grassDeep} />
          {[0, 72, 144, 216, 288].map((a) => (
            <Ellipse
              key={a}
              cx={f.x}
              cy={66 - f.h - 6}
              rx={4}
              ry={6}
              fill={f.c}
              transform={`rotate(${a} ${f.x} ${66 - f.h})`}
            />
          ))}
          <Circle cx={f.x} cy={66 - f.h} r={3.5} fill={kid.sunDeep} />
        </G>
      ))}
    </G>
  );
}

function River() {
  return (
    <G>
      <Circle cx={92} cy={20} r={10} fill={kid.sun} />
      <Path d="M0 50 Q30 34 60 46 T120 42 V56 H0 Z" fill="#8CCB8F" />
      <Rect x={0} y={54} width={120} height={36} fill="#4FA9E6" />
      <Path
        d="M10 70 q6 -4 12 0 M70 80 q6 -4 12 0 M90 64 q6 -4 12 0"
        stroke="#FFFFFF"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M100 34 V58 M101 34 L112 38 L101 42 Z"
        stroke={kid.ink}
        strokeWidth={1.5}
        fill={kid.coral}
      />
      <Path d="M18 56 H62 L56 70 Q40 74 24 70 Z" fill={kid.coral} />
      <Path d="M18 56 H62 L60 60 H20 Z" fill="#FFFFFF" />
    </G>
  );
}
