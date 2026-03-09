export type GameMode = "simple" | "selective";

export type RoundState = "waiting" | "ready" | "go" | "early" | "result";

export interface ReactionColorOption {
  name: string;
  value: string;
  hex: string;
  className: string;
}

export interface ReactionMetrics {
  reactionTimes: number[];
  averageReaction: number;
  bestReaction: number;
}
