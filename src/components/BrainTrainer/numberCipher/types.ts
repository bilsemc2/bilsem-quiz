export type QuestionType =
  | "hidden_operator"
  | "pair_relation"
  | "conditional"
  | "multi_rule";

export type Operator = "+" | "-" | "×";

export interface Question {
  answer: number;
  display: string[];
  explanation: string;
  options: number[];
  question: string;
  type: QuestionType;
}
