export const buildEmojiStroopFeedbackMessage = (
  correct: boolean,
  correctAnswer: string,
  level: number,
  maxLevel: number,
) => {
  if (correct) {
    if (level >= maxLevel) {
      return `Doğru duygu: ${correctAnswer}. Son turu da geçtin, oyun tamamlanıyor.`;
    }

    return `Doğru duygu: ${correctAnswer}. Şimdi ${level + 1}. seviyeye geçiyorsun.`;
  }

  return `Yanlış seçim! Emoji ${correctAnswer} duygusunu gösteriyor.`;
};
