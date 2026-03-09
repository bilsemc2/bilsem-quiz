export type ColorInfo = {
  name: string;
  hex: string;
};

export type GameCardData = {
  id: string;
  number: number;
  color: ColorInfo;
};

export const QUESTION_TYPES = {
  NUMBER: "NUMBER",
  COLOR: "COLOR",
  ADDITION: "ADDITION",
  SUBTRACTION: "SUBTRACTION",
} as const;

export type QuestionType =
  (typeof QUESTION_TYPES)[keyof typeof QUESTION_TYPES];

export type QuestionData = {
  type: QuestionType;
  text: string;
  answer: string | number;
  targetIndices: number[];
};

export interface RoundSequencePlan {
  initialFocusDelay: number;
  revealDelay: number;
  allCardsOpenAt: number;
  displayTime: number;
  closeAllAt: number;
  questionAt: number;
}
