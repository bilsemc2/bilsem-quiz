import type { ShapeType } from "./types";

interface AttentionCodingShapeIconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
  type: ShapeType;
}

const AttentionCodingShapeIcon = ({
  type,
  className = "text-slate-300",
  size = 24,
  strokeWidth = 2,
}: AttentionCodingShapeIconProps) => {
  const props = {
    width: size,
    height: size,
    stroke: "currentColor",
    strokeWidth,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };

  switch (type) {
    case "circle":
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
    case "square":
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
      );
    case "triangle":
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <path d="M12 3L22 20H2L12 3Z" />
        </svg>
      );
    case "plus":
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <path d="M12 5V19M5 12H19" strokeWidth={strokeWidth + 1} />
        </svg>
      );
    case "star":
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      );
    case "diamond":
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <path d="M12 2L22 12L12 22L2 12L12 2Z" />
        </svg>
      );
    case "hexagon":
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <path d="M12 2L21.5 7.5V16.5L12 22L2.5 16.5V7.5L12 2Z" />
        </svg>
      );
    default:
      return null;
  }
};

export default AttentionCodingShapeIcon;
