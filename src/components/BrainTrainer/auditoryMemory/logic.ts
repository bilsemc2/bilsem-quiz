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
