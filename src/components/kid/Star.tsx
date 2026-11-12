import Svg, { Path } from "react-native-svg";
import { kid } from "@/theme/tokens";

/** A rounded five-pointed star, in a 24 × 24 box. */
export const STAR_PATH =
  "M12 2.6l2.7 5.6 6.1.9c.7.1 1 1 .5 1.5l-4.4 4.3 1 6.1c.1.7-.6 1.2-1.3.9L12 19l-5.5 2.9c-.6.3-1.4-.2-1.3-.9l1-6.1-4.4-4.3c-.5-.5-.2-1.4.5-1.5l6.1-.9L11 2.6c.3-.6 1.2-.6 1.5 0z";

export function Star({ size, dim }: { readonly size: number; readonly dim?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={STAR_PATH}
        fill={dim ? "rgba(255,255,255,0.25)" : kid.star}
        stroke={dim ? "rgba(36,50,74,0.25)" : kid.starEdge}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
