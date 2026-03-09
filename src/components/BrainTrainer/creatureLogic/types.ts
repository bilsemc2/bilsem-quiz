export type CreatureColor = "red" | "blue" | "green" | "yellow" | "purple";
export type CreatureShape = "fluff" | "slime" | "block" | "spiky";
export type CreatureAccessory =
  | "none"
  | "hat"
  | "glasses"
  | "bowtie"
  | "crown";
export type CreatureEmotion =
  | "happy"
  | "sad"
  | "surprised"
  | "sleepy"
  | "angry";
export type CreatureDifficulty = "easy" | "medium" | "hard";

export interface Creature {
  id: number;
  color: CreatureColor;
  shape: CreatureShape;
  accessory: CreatureAccessory;
  emotion: CreatureEmotion;
}

export interface RuleResult {
  instruction: string;
  predicate: (creature: Creature) => boolean;
}

export interface RoundData {
  creatures: Creature[];
  instruction: string;
  targetIds: number[];
  difficulty: CreatureDifficulty;
}
