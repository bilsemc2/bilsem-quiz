export interface EmojiDef {
  emoji: string;
  name: string;
}

export interface CategoryData {
  description: string;
  items: EmojiDef[];
}

export interface PuzzleItem extends EmojiDef {
  id: string;
  isMatch: boolean;
}

export interface PuzzleData {
  category: string;
  description: string;
  items: PuzzleItem[];
}

export interface SelectionResult {
  isCorrect: boolean;
  correctIds: string[];
  missedIds: string[];
  wrongIds: string[];
}
