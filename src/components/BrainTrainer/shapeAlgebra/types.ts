export type ShapeType =
  | "circle"
  | "square"
  | "triangle"
  | "star"
  | "hexagon"
  | "diamond";

export type ColorType =
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "purple"
  | "orange"
  | "pink"
  | "cyan";

export interface VariableDef {
  id: string;
  shape: ShapeType;
  color: ColorType;
  dotted: boolean;
  value: number;
}

export interface EquationTerm {
  variableId: string;
}

export interface EquationDef {
  id: string;
  items: EquationTerm[];
  result: number;
}

export interface QuestionDef {
  items: EquationTerm[];
  answer: number;
  text: string;
}

export interface LevelData {
  variables: VariableDef[];
  equations: EquationDef[];
  question: QuestionDef;
}
