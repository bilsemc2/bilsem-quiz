import type { ClockTime } from "./types.ts";

type RandomFn = () => number;

export const normalizeClockHour = (hour: number) =>
  ((((hour - 1) % 12) + 12) % 12) + 1;

export const getMinuteGranularity = (level: number) => (level <= 10 ? 5 : 1);

export const getRandomTime = (
  level: number,
  random: RandomFn = Math.random,
): ClockTime => {
  const hours = Math.floor(random() * 12) + 1;
  const granularity = getMinuteGranularity(level);
  const minuteSlots = 60 / granularity;
  const minutes = Math.floor(random() * minuteSlots) * granularity;

  return {
    hours,
    minutes,
  };
};

export const addMinutesToClockTime = (
  time: ClockTime,
  minutesToAdd: number,
): ClockTime => {
  const totalMinutes =
    (time.hours % 12) * 60 + time.minutes + minutesToAdd;
  const normalizedMinutes = ((totalMinutes % 720) + 720) % 720;
  const hours = Math.floor(normalizedMinutes / 60);

  return {
    hours: hours === 0 ? 12 : hours,
    minutes: normalizedMinutes % 60,
  };
};

export const getTargetOffset = (
  level: number,
  random: RandomFn = Math.random,
) => {
  if (level <= 3) {
    return 5;
  }

  if (level <= 6) {
    return 10;
  }

  if (level <= 9) {
    return 30;
  }

  if (level <= 12) {
    return 40;
  }

  if (level <= 15) {
    return 50;
  }

  if (level <= 17) {
    return 60;
  }

  if (level <= 19) {
    return -(random() > 0.5 ? 10 : 15);
  }

  return -(random() > 0.5 ? 15 : 20);
};

export const minutesToDegrees = (minutes: number) => (minutes / 60) * 360;

export const degreesToMinutes = (degrees: number) => {
  let normalizedDegrees = degrees % 360;

  if (normalizedDegrees < 0) {
    normalizedDegrees += 360;
  }

  const minutes = Math.round((normalizedDegrees / 360) * 60);
  return minutes === 60 ? 0 : minutes;
};

export const getAngle = (
  centerX: number,
  centerY: number,
  mouseX: number,
  mouseY: number,
) => {
  const x = mouseX - centerX;
  const y = mouseY - centerY;
  const radians = Math.atan2(y, x);
  let degrees = radians * (180 / Math.PI);
  degrees += 90;

  if (degrees < 0) {
    degrees += 360;
  }

  return degrees;
};

export const getNextDisplayHour = (
  currentHour: number,
  previousMinutes: number,
  nextMinutes: number,
) => {
  if (previousMinutes > 45 && nextMinutes < 15) {
    return normalizeClockHour(currentHour + 1);
  }

  if (previousMinutes < 15 && nextMinutes > 45) {
    return normalizeClockHour(currentHour - 1);
  }

  return normalizeClockHour(currentHour);
};

export const isCorrectClockAnswer = (
  targetTime: ClockTime,
  selectedHour: number,
  selectedMinutes: number,
) =>
  normalizeClockHour(selectedHour) === normalizeClockHour(targetTime.hours) &&
  selectedMinutes === targetTime.minutes;

export const formatClockTime = ({ hours, minutes }: ClockTime) =>
  `${normalizeClockHour(hours)}:${minutes.toString().padStart(2, "0")}`;

export const getTimeExplorerScore = (level: number) => level * 10;
