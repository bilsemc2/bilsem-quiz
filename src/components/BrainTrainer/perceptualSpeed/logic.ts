import {
  BASE_DIGIT_LENGTH,
  CONFUSION_PAIRS,
  MAX_DIGIT_LENGTH,
} from "./constants.ts";
import type { Challenge } from "./types.ts";

type RandomFn = () => number;

export const getDigitLengthForLevel = (level: number) =>
  Math.min(BASE_DIGIT_LENGTH + Math.floor((level - 1) / 4), MAX_DIGIT_LENGTH);

export const generateRandomNumberString = (
  length: number,
  random: RandomFn = Math.random,
) => {
  let value = "";

  for (let index = 0; index < length; index += 1) {
    value += Math.floor(random() * 10).toString();
  }

  return value;
};

export const createChallenge = (
  digitLength: number,
  random: RandomFn = Math.random,
): Challenge => {
  const left = generateRandomNumberString(digitLength, random);

  if (random() > 0.5) {
    return { left, right: left, isSame: true, type: "same" };
  }

  const rightDigits = left.split("");
  const roll = random();
  let type: Challenge["type"] = "random";

  if (roll < 0.45) {
    const index = Math.floor(random() * Math.max(left.length - 1, 1));
    [rightDigits[index], rightDigits[index + 1]] = [
      rightDigits[index + 1],
      rightDigits[index],
    ];
    type = "transposition";
  } else if (roll < 0.9) {
    const replaceableDigits = left
      .split("")
      .map((digit, index) => ({ digit, index }))
      .filter(({ digit }) => CONFUSION_PAIRS[digit]);

    if (replaceableDigits.length > 0) {
      const target =
        replaceableDigits[Math.floor(random() * replaceableDigits.length)];
      const replacements = CONFUSION_PAIRS[target.digit];
      rightDigits[target.index] =
        replacements[Math.floor(random() * replacements.length)];
      type = "similarity";
    } else {
      const index = Math.floor(random() * left.length);
      rightDigits[index] = ((Number.parseInt(rightDigits[index], 10) + 1) % 10).toString();
    }
  } else {
    const index = Math.floor(random() * left.length);
    let replacement = Math.floor(random() * 10).toString();

    while (replacement === rightDigits[index]) {
      replacement = Math.floor(random() * 10).toString();
    }

    rightDigits[index] = replacement;
  }

  if (left === rightDigits.join("")) {
    rightDigits[0] = rightDigits[0] === "1" ? "2" : "1";
  }

  return {
    left,
    right: rightDigits.join(""),
    isSame: false,
    type,
  };
};

export const isAnswerCorrect = (
  answerIsSame: boolean,
  challenge: Challenge | null,
) => answerIsSame === challenge?.isSame;

export const calculatePerceptualSpeedScore = (level: number) => 10 * level;
