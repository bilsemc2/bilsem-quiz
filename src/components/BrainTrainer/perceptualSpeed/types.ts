export type ChallengeType =
  | "same"
  | "transposition"
  | "similarity"
  | "random";

export interface Challenge {
  left: string;
  right: string;
  isSame: boolean;
  type: ChallengeType;
}
