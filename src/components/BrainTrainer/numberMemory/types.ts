export type QuestionType = "number" | "order" | "sum" | "max";

export interface Question {
  answer: number;
  options: number[];
  text: string;
  type: QuestionType;
}

export type LocalPhase = "idle" | "listening" | "question";
