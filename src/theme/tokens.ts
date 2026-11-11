/** Design tokens. Dark is the primary palette; light mirrors it with AA contrast on white. */

export interface Palette {
  readonly background: string;
  readonly surface: string;
  readonly surfaceRaised: string;
  readonly border: string;
  readonly text: string;
  readonly textMuted: string;
  readonly accent: string;
  readonly onAccent: string;
  readonly accentSoft: string;
  readonly good: string;
  readonly fair: string;
  readonly poor: string;
  readonly neutral: string;
  readonly grid: string;
  readonly bands: Readonly<Record<"delta" | "theta" | "alpha" | "beta" | "gamma", string>>;
  /** Orb colours from low to high reward. */
  readonly orb: readonly [string, string, string];
}

export const dark: Palette = {
  background: "#0A0E17",
  surface: "#121826",
  surfaceRaised: "#1A2233",
  border: "#253047",
  text: "#E8ECF4",
  textMuted: "#9DA7BC",
  accent: "#7DF0D6",
  onAccent: "#06231D",
  accentSoft: "rgba(125, 240, 214, 0.14)",
  good: "#4ADE80",
  fair: "#FBBF24",
  poor: "#F87171",
  neutral: "#6B7690",
  grid: "rgba(157, 167, 188, 0.12)",
  bands: {
    delta: "#A397FF",
    theta: "#6CB4FF",
    alpha: "#7DF0D6",
    beta: "#FBBF24",
    gamma: "#F58FC6",
  },
  orb: ["#4B3FB8", "#5B8DEF", "#7DF0D6"],
};

export const light: Palette = {
  background: "#F4F6FB",
  surface: "#FFFFFF",
  surfaceRaised: "#EDF1F7",
  border: "#D8DFEA",
  text: "#0F1726",
  textMuted: "#4B5568",
  accent: "#0B7A67",
  onAccent: "#FFFFFF",
  accentSoft: "rgba(11, 122, 103, 0.1)",
  good: "#15803D",
  fair: "#A16207",
  poor: "#B91C1C",
  neutral: "#64748B",
  grid: "rgba(75, 85, 104, 0.12)",
  bands: {
    delta: "#6D5EF0",
    theta: "#2F7FD8",
    alpha: "#0E9F86",
    beta: "#C28A0E",
    gamma: "#D9478F",
  },
  orb: ["#6D5EF0", "#4A90E2", "#2BD4B4"],
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 18, pill: 999 } as const;

export const type = {
  title: { fontSize: 28, lineHeight: 34, fontWeight: "700" },
  heading: { fontSize: 17, lineHeight: 22, fontWeight: "600" },
  body: { fontSize: 15, lineHeight: 22, fontWeight: "400" },
  label: { fontSize: 13, lineHeight: 18, fontWeight: "600" },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "400" },
  metric: { fontSize: 34, lineHeight: 40, fontWeight: "600" },
} as const;

/** Content never gets wider than this on large screens. */
export const MAX_CONTENT_WIDTH = 960;
/** Minimum size for anything tappable. */
export const TOUCH_TARGET = 44;
