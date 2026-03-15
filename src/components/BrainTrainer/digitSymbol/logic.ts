export const getDigitSymbolTargetScore = (level: number) =>
  5 + Math.floor(level / 4);

export const buildDigitSymbolFeedbackMessage = ({
  correct,
  currentNumber,
  correctSymbol,
  level,
  maxLevel,
  remainingMatches,
}: {
  correct: boolean;
  currentNumber: number;
  correctSymbol: string;
  level: number;
  maxLevel: number;
  remainingMatches: number;
}) => {
  if (correct) {
    if (remainingMatches <= 0) {
      if (level >= maxLevel) {
        return `Doğru eşleşme: ${currentNumber} -> ${correctSymbol}. Son anahtarı da çözdün, oyun tamamlanıyor.`;
      }

      return `Doğru eşleşme: ${currentNumber} -> ${correctSymbol}. Şimdi ${level + 1}. seviyeye geçiyorsun.`;
    }

    return `Doğru eşleşme: ${currentNumber} -> ${correctSymbol}. Bu seviyede ${remainingMatches} eşleşme daha kaldı.`;
  }

  return `Yanlış eşleşme! ${currentNumber} rakamının sembolü ${correctSymbol} olmalıydı.`;
};
