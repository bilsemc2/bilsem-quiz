type RandomFn = () => number;

export const getSequenceLength = (level: number) => Math.min(2 + level, 9);

export const generateSequence = (
  level: number,
  noteCount: number,
  random: RandomFn = Math.random,
) =>
  Array.from({ length: getSequenceLength(level) }, () =>
    Math.floor(random() * noteCount),
  );

export const isExpectedNote = (
  sequence: number[],
  currentInputLength: number,
  noteIndex: number,
) => sequence[currentInputLength] === noteIndex;

export const isSequenceComplete = (
  sequence: number[],
  nextInputLength: number,
) => nextInputLength === sequence.length;

export const calculateAuditoryMemoryScore = (level: number) => 50 + level * 10;

export const buildAuditoryMemoryFeedbackMessage = ({
  correct,
  level,
  maxLevel,
  sequenceLength,
}: {
  correct: boolean;
  level: number;
  maxLevel: number;
  sequenceLength: number;
}) => {
  if (correct) {
    if (level >= maxLevel) {
      return `Harika kulak! ${sequenceLength} notalık son diziyi de tamamladın, oyun bitiyor.`;
    }

    return `Doğru dizi! ${sequenceLength} notayı doğru tekrar ettin, şimdi ${level + 1}. seviyeye geçiyorsun.`;
  }

  return "Yanlış nota! Diziyi baştan dikkatle dinlemelisin.";
};
