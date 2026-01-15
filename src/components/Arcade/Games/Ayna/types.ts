
export interface Point {
  x: number;
  y: number;
}

export interface Target {
  id: string;
  x: number;
  y: number;
  hit: boolean;
}

export interface Level {
  id: number;
  title: string;
  description: string;
  targets: Target[];
  backgroundPrompt: string;
}

export interface DrawingPath {
  points: Point[];
  color: string;
}
