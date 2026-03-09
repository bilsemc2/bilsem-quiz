import { useEffect, useState } from "react";

import {
  CANVAS_HORIZONTAL_PADDING,
  MAX_CANVAS_SIZE,
} from "./constants";

export const useResponsiveCanvasSize = () => {
  const [canvasSize, setCanvasSize] = useState(MAX_CANVAS_SIZE);

  useEffect(() => {
    const updateCanvasSize = () => {
      setCanvasSize(
        Math.min(window.innerWidth - CANVAS_HORIZONTAL_PADDING, MAX_CANVAS_SIZE),
      );
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  return canvasSize;
};
