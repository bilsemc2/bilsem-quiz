export type ReflectionStatus = "display" | "input_sequence" | "input_sum";

export interface ReflectionRound {
  digits: number[];
  isMirrored: boolean;
}
