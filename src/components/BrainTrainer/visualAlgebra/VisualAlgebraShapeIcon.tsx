import { GAME_COLORS } from "../shared/gameColors";
import { ShapeType } from "./types";

interface VisualAlgebraShapeIconProps {
  type: ShapeType;
  size?: number;
  weight?: number;
  className?: string;
}

const SHAPE_COLORS = {
  [ShapeType.SQUARE]: "#14f195",
  [ShapeType.TRIANGLE]: "#ff2745",
  [ShapeType.CIRCLE]: "#3374ff",
  [ShapeType.STAR]: GAME_COLORS.yellow,
  [ShapeType.PENTAGON]: "#fff",
};

const SHAPE_MARKUP = {
  [ShapeType.SQUARE]: (
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="4"
      ry="4"
      stroke="black"
      strokeWidth="2.5"
    />
  ),
  [ShapeType.TRIANGLE]: (
    <path
      d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
      stroke="black"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
  ),
  [ShapeType.CIRCLE]: <circle cx="12" cy="12" r="9" stroke="black" strokeWidth="2.5" />,
  [ShapeType.STAR]: (
    <polygon
      points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
      stroke="black"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
  ),
  [ShapeType.PENTAGON]: (
    <path
      d="M12 2L2 9l4 13h12l4-13L12 2z"
      stroke="black"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
  ),
};

const VisualAlgebraShapeIcon = ({
  type,
  size = 32,
  weight,
  className = "",
}: VisualAlgebraShapeIconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill={SHAPE_COLORS[type]}
    className={`drop-shadow-neo-sm transition-all duration-300 ${className}`}
    width={size}
    height={size}
    style={{ overflow: "visible" }}
  >
    {SHAPE_MARKUP[type]}
    {weight !== undefined && (
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fill="#1e293b"
        fontSize="10"
        fontFamily="Syne, sans-serif"
        fontWeight="900"
        stroke="white"
        strokeWidth="3"
        paintOrder="stroke"
        style={{ pointerEvents: "none" }}
      >
        {weight}
      </text>
    )}
  </svg>
);

export default VisualAlgebraShapeIcon;
