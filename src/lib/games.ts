/** The mini-games. All three run on the same focus meter; only the picture differs. */

export type GameId = "balloon" | "garden" | "river";

export interface Game {
  readonly id: GameId;
  /** One or two words, for children. */
  readonly title: string;
  /** What the child does, in a few friendly words. */
  readonly tagline: string;
  /** For grown-ups: how focus shows up in the game. */
  readonly description: string;
  /** Badge awarded for finishing a session of this game. */
  readonly badge: string;
}

export const GAMES: readonly Game[] = [
  {
    id: "balloon",
    title: "Sky Balloon",
    tagline: "Float up and catch stars",
    description:
      "The balloon rises while the attention score is above the child's baseline and drifts down when it drops. Sustained focus brings a star down to catch.",
    badge: "Sky Explorer",
  },
  {
    id: "garden",
    title: "Magic Garden",
    tagline: "Help the flowers bloom",
    description:
      "While focused, the current flower grows and the sun shines brighter. Each full bloom earns a star, and the garden fills up over the round.",
    badge: "Green Thumb",
  },
  {
    id: "river",
    title: "River Boat",
    tagline: "Sail to the next flag",
    description:
      "The boat sails faster with focus and floats gently when attention drops. Every flag it reaches earns a star.",
    badge: "Captain",
  },
];

export function getGame(id: string): Game | undefined {
  return GAMES.find((g) => g.id === id);
}
