export const getColorCountForLevel = (level: number) =>
  level <= 5 ? 2 : level <= 10 ? 3 : level <= 15 ? 4 : 5;

export const getColorDisplayDuration = (level: number) =>
  Math.max(800, 4000 - level * 150);

export const isColorSelectionCorrect = (
  selections: readonly string[],
  expectedColors: readonly string[],
) => {
  if (selections.length !== expectedColors.length) {
    return false;
  }

  const expectedSet = new Set(expectedColors);
  return selections.every((selection) => expectedSet.has(selection));
};

export const buildColorPerceptionFeedbackMessage = ({
  correct,
  currentColors,
  level,
  maxLevel,
}: {
  correct: boolean;
  currentColors: readonly string[];
  level: number;
  maxLevel: number;
}) => {
  if (correct) {
    if (level >= maxLevel) {
      return `Harika! ${currentColors.length} rengi doğru hatırladın, oyun tamamlanıyor.`;
    }

    return `Doğru seçim! ${currentColors.length} rengi doğru buldun, şimdi ${level + 1}. seviyeye geçiyorsun.`;
  }

  return `Yanlış seçim! Görmen gereken renkler: ${currentColors.join(", ")}.`;
};
