interface CreateCanvasElementOptions {
  width?: number;
  height?: number;
}

export const createCanvasElement = ({
  width,
  height,
}: CreateCanvasElementOptions = {}): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");

  if (typeof width === "number") {
    canvas.width = width;
  }

  if (typeof height === "number") {
    canvas.height = height;
  }

  return canvas;
};
