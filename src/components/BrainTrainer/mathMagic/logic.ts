import {
  CARD_DISPLAY_TIME,
  CARD_SEQUENCE_DELAY,
  COLORS,
  INITIAL_FOCUS_DELAY,
  MAX_NUMBER_INPUT_LENGTH,
  QUESTION_REVEAL_DELAY,
} from "./constants.ts";
import {
  QUESTION_TYPES,
  type GameCardData,
  type QuestionData,
  type RoundSequencePlan,
} from "./types.ts";

const QUESTION_TYPE_LIST = Object.values(QUESTION_TYPES);

const getRandomInt = (
  random: () => number,
  min: number,
  max: number,
) => Math.floor(random() * (max - min + 1)) + min;

const getRandomItem = <T,>(items: T[], random: () => number): T =>
  items[getRandomInt(random, 0, items.length - 1)];

const createCardId = (random: () => number) =>
  Math.floor(random() * 1_000_000_000)
    .toString(36)
    .padStart(6, "0");

const normalizeAnswer = (answer: string | number) =>
  String(answer).trim().toLocaleLowerCase("tr-TR");

export const getCardCountForLevel = (level: number) =>
  Math.min(2 + Math.floor(level / 4), 6);

export const getRevealDelay = (level: number) =>
  Math.max(600, CARD_SEQUENCE_DELAY - level * 20);

export const getDisplayTime = (level: number) =>
  Math.max(1200, CARD_DISPLAY_TIME - level * 50);

export const getRoundSequencePlan = (
  cardCount: number,
  level: number,
): RoundSequencePlan => {
  const revealDelay = getRevealDelay(level);
  const displayTime = getDisplayTime(level);
  const allCardsOpenAt = INITIAL_FOCUS_DELAY + cardCount * revealDelay;
  const closeAllAt = allCardsOpenAt + displayTime;

  return {
    initialFocusDelay: INITIAL_FOCUS_DELAY,
    revealDelay,
    allCardsOpenAt,
    displayTime,
    closeAllAt,
    questionAt: closeAllAt + QUESTION_REVEAL_DELAY,
  };
};

export const createRoundCards = (
  level: number,
  random: () => number = Math.random,
): GameCardData[] => {
  const cardCount = getCardCountForLevel(level);

  return Array.from({ length: cardCount }, () => ({
    id: createCardId(random),
    number: getRandomInt(random, 0, level + 4),
    color: getRandomItem(COLORS, random),
  }));
};

export const generateQuestion = (
  cards: GameCardData[],
  random: () => number = Math.random,
): QuestionData => {
  const type = getRandomItem(QUESTION_TYPE_LIST, random);
  const cardIndex = getRandomInt(random, 0, cards.length - 1);
  const targetCard = cards[cardIndex];
  const nextIndex = (cardIndex + 1) % cards.length;
  const adjacentCard = cards[nextIndex];

  switch (type) {
    case QUESTION_TYPES.COLOR:
      return {
        type,
        text: "İşaretli kartın rengi neydi?",
        answer: targetCard.color.name,
        targetIndices: [cardIndex],
      };
    case QUESTION_TYPES.NUMBER:
      return {
        type,
        text: "İşaretli kartın sayısı kaçtı?",
        answer: targetCard.number,
        targetIndices: [cardIndex],
      };
    case QUESTION_TYPES.ADDITION:
      return {
        type,
        text: "İşaretli kartların toplamı nedir?",
        answer: targetCard.number + adjacentCard.number,
        targetIndices: [cardIndex, nextIndex],
      };
    case QUESTION_TYPES.SUBTRACTION:
      return {
        type,
        text: "İşaretli kartların farkı nedir?",
        answer: Math.abs(targetCard.number - adjacentCard.number),
        targetIndices: [cardIndex, nextIndex],
      };
    default:
      return {
        type: QUESTION_TYPES.NUMBER,
        text: "İşaretli kartın sayısı kaçtı?",
        answer: targetCard.number,
        targetIndices: [cardIndex],
      };
  }
};

export const isAnswerCorrect = (
  question: QuestionData,
  userAnswer: string | number,
) => normalizeAnswer(userAnswer) === normalizeAnswer(question.answer);

export const appendDigit = (
  currentValue: string,
  digit: string,
  maxLength = MAX_NUMBER_INPUT_LENGTH,
) => {
  if (currentValue.length >= maxLength) {
    return currentValue;
  }

  return `${currentValue}${digit}`;
};

export const getLevelScore = (level: number) => 10 * level;
