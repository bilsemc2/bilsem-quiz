export interface Card {
  id: string;
  symbolIdx: number;
  colorIdx: number;
  isFlipped: boolean;
  isMatched: boolean;
  position: number;
}

export type LocalPhase = "preview" | "playing" | "feedback";
