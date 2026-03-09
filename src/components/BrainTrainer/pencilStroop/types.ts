export interface PencilColor {
  name: string;
  hex: string;
  colorClass: string;
  bgClass: string;
  lightBg: string;
}

export interface PencilStroopOptionStyle {
  textColor: PencilColor;
  bgColor: PencilColor;
}

export interface PencilStroopRound {
  pencilColorObj: PencilColor;
  wordObj: PencilColor;
  labelTextColor: PencilColor;
  correctAnswer: string;
  options: PencilColor[];
  optionStyles: PencilStroopOptionStyle[];
}
