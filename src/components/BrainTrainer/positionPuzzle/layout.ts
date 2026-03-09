import {
  CANVAS_HORIZONTAL_PADDING,
  CANVAS_MAX_SIZE,
} from "./constants.ts";

export const getResponsiveCanvasSize = (viewportWidth: number) =>
  Math.min(viewportWidth - CANVAS_HORIZONTAL_PADDING, CANVAS_MAX_SIZE);
