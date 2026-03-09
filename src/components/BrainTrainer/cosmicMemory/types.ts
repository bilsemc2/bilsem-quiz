export type GameMode = "NORMAL" | "REVERSE";

export type LocalPhase = "waiting" | "displaying" | "input";

export interface CosmicMemoryRound {
  sequence: number[];
  gridSize: number;
  mode: GameMode;
}
