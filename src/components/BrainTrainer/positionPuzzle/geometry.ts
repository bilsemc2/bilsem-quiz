import type { Point, Shape } from "./types.ts";

export const degreesToRadians = (deg: number) => deg * (Math.PI / 180);

export const rotatePoint = (
  point: Point,
  center: Point,
  angleDeg: number,
): Point => {
  const radians = degreesToRadians(angleDeg);
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  const dx = point.x - center.x;
  const dy = point.y - center.y;

  return {
    x: center.x + dx * cosine - dy * sine,
    y: center.y + dx * sine + dy * cosine,
  };
};

export const isPointInShape = (point: Point, shape: Shape): boolean => {
  if (shape.type === "circle") {
    return (
      Math.pow(point.x - shape.cx, 2) + Math.pow(point.y - shape.cy, 2) <=
      shape.r * shape.r
    );
  }

  if (shape.type === "rect") {
    const center = { x: shape.x + shape.w / 2, y: shape.y + shape.h / 2 };
    const unrotatedPoint = rotatePoint(point, center, -shape.rotation);
    return (
      unrotatedPoint.x >= shape.x &&
      unrotatedPoint.x <= shape.x + shape.w &&
      unrotatedPoint.y >= shape.y &&
      unrotatedPoint.y <= shape.y + shape.h
    );
  }

  const { p1, p2, p3 } = shape;
  const determinant =
    (p2.y - p3.y) * (p1.x - p3.x) + (p3.x - p2.x) * (p1.y - p3.y);

  if (determinant === 0) {
    return false;
  }

  const a =
    ((p2.y - p3.y) * (point.x - p3.x) +
      (p3.x - p2.x) * (point.y - p3.y)) /
    determinant;
  const b =
    ((p3.y - p1.y) * (point.x - p3.x) +
      (p1.x - p3.x) * (point.y - p3.y)) /
    determinant;
  const c = 1 - a - b;

  return (
    a >= 0 &&
    a <= 1 &&
    b >= 0 &&
    b <= 1 &&
    c >= 0 &&
    c <= 1
  );
};
