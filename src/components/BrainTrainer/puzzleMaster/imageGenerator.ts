import { createCanvasElement } from "@/utils/createCanvasElement";
import {
  PUZZLE_SIZE,
  SELECTION_SIZE,
} from "./constants";
import { getRandomTargetBox } from "./logic";
import type { PuzzleLevelData } from "./types";

const createPuzzleImage = (seed: string) => {
  const canvas = createCanvasElement({
    width: PUZZLE_SIZE,
    height: PUZZLE_SIZE,
  });
  const context = canvas.getContext("2d");

  if (!context) {
    return "";
  }

  const seedValue = seed
    .split("")
    .reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const randomValue = (index: number) => {
    const value = Math.sin(seedValue + index) * 10000;
    return value - Math.floor(value);
  };

  const gradient = context.createLinearGradient(0, 0, PUZZLE_SIZE, PUZZLE_SIZE);
  const baseHue = Math.floor(randomValue(1) * 360);
  gradient.addColorStop(0, `hsl(${baseHue}, 80%, 75%)`);
  gradient.addColorStop(1, `hsl(${(baseHue + 120) % 360}, 80%, 75%)`);
  context.fillStyle = gradient;
  context.fillRect(0, 0, PUZZLE_SIZE, PUZZLE_SIZE);

  context.strokeStyle = "rgba(0,0,0,0.15)";
  context.lineWidth = 2;

  for (let index = 0; index < PUZZLE_SIZE; index += 32) {
    context.beginPath();
    context.moveTo(index, 0);
    context.lineTo(index, PUZZLE_SIZE);
    context.stroke();

    context.beginPath();
    context.moveTo(0, index);
    context.lineTo(PUZZLE_SIZE, index);
    context.stroke();
  }

  for (let index = 0; index < 200; index += 1) {
    const x = randomValue(index * 2.5) * PUZZLE_SIZE;
    const y = randomValue(index * 3.7) * PUZZLE_SIZE;
    const size = 20 + randomValue(index * 4.2) * 80;
    const hues = [330, 200, 150, 50, 280];
    const hue = hues[Math.floor(randomValue(index * 5.1) * hues.length)];
    const type = Math.floor(randomValue(index * 7.8) * 6);

    context.save();
    context.translate(x, y);
    context.rotate(randomValue(index * 8.9) * Math.PI * 2);
    context.fillStyle = `hsl(${hue}, 90%, 65%)`;
    context.strokeStyle = "#000000";
    context.lineWidth = 3;
    context.beginPath();

    if (type === 0) {
      context.rect(-size / 2, -size / 2, size, size);
    } else if (type === 1) {
      context.arc(0, 0, size / 2, 0, Math.PI * 2);
    } else if (type === 2) {
      context.moveTo(0, -size / 2);
      context.lineTo(size / 2, size / 2);
      context.lineTo(-size / 2, size / 2);
    } else if (type === 3) {
      for (let pointIndex = 0; pointIndex < 5; pointIndex += 1) {
        context.lineTo(
          (Math.cos((pointIndex * 72 * Math.PI) / 180) * size) / 2,
          (Math.sin((pointIndex * 72 * Math.PI) / 180) * size) / 2,
        );
        context.lineTo(
          (Math.cos(((pointIndex * 72 + 36) * Math.PI) / 180) * size) / 4,
          (Math.sin(((pointIndex * 72 + 36) * Math.PI) / 180) * size) / 4,
        );
      }
      context.closePath();
    } else if (type === 4) {
      context.moveTo(-size / 2, 0);
      context.lineTo(size / 2, 0);
      context.moveTo(0, -size / 2);
      context.lineTo(0, size / 2);
    } else {
      context.arc(0, 0, size / 2, 0, Math.PI, true);
      context.lineTo(0, 0);
    }

    context.fill();
    context.stroke();
    context.fillStyle = "rgba(0,0,0,0.1)";
    context.fill();
    context.restore();
  }

  return canvas.toDataURL("image/png");
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Puzzle image could not be loaded"));
    image.src = src;
  });

export const generatePuzzleLevel = async (
  level: number,
): Promise<PuzzleLevelData> => {
  const imageUrl = createPuzzleImage(`puzzle-${level}-${Date.now()}`);
  const image = await loadImage(imageUrl);
  const canvas = createCanvasElement({
    width: PUZZLE_SIZE,
    height: PUZZLE_SIZE,
  });
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Puzzle board canvas context could not be created");
  }

  context.drawImage(image, 0, 0, PUZZLE_SIZE, PUZZLE_SIZE);

  const targetBox = getRandomTargetBox();
  const thumbnailCanvas = createCanvasElement({
    width: SELECTION_SIZE,
    height: SELECTION_SIZE,
  });
  const thumbnailContext = thumbnailCanvas.getContext("2d");

  if (!thumbnailContext) {
    throw new Error("Puzzle thumbnail canvas context could not be created");
  }

  thumbnailContext.drawImage(
    canvas,
    targetBox.x,
    targetBox.y,
    SELECTION_SIZE,
    SELECTION_SIZE,
    0,
    0,
    SELECTION_SIZE,
    SELECTION_SIZE,
  );

  return {
    imageUrl,
    targetBox,
    targetThumbnail: thumbnailCanvas.toDataURL("image/png"),
  };
};
