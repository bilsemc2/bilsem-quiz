export type InternalPhase = "exposure" | "playing";

export interface LevelConfig {
  wordLen: number;
  items: number;
  roundDur: number;
  flash: number;
  targetLen: number;
}

export interface WordHuntItem {
  id: string;
  text: string;
  hasTarget: boolean;
}

export interface WordHuntRound {
  target: string;
  items: WordHuntItem[];
  config: LevelConfig;
  maxSelections: number;
}

export interface RoundResult {
  totalTargets: number;
  correctSelections: number;
  incorrectSelections: number;
  isSuccess: boolean;
}
