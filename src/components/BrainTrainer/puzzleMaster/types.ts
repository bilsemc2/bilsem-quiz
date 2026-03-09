export interface SelectionPosition {
  x: number;
  y: number;
}

export interface TargetBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PuzzleLevelData {
  imageUrl: string;
  targetBox: TargetBox;
  targetThumbnail: string;
}

export interface PointerSelectionInput {
  clientX: number;
  clientY: number;
  rectLeft: number;
  rectTop: number;
  rectWidth: number;
  rectHeight: number;
}
