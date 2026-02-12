import React from 'react';
import { ShapeType, ColorType } from '../types';

interface ShapeIconProps {
  shape: ShapeType;
  color: ColorType;
  size?: number;
  className?: string;
}

const getColorHex = (color: ColorType) => {
  switch (color) {
    case 'red': return '#ef4444'; // red-500
    case 'green': return '#22c55e'; // green-500
    case 'blue': return '#3b82f6'; // blue-500
    case 'yellow': return '#eab308'; // yellow-500
    case 'purple': return '#a855f7'; // purple-500
    case 'orange': return '#f97316'; // orange-500
    case 'teal': return '#14b8a6'; // teal-500
    default: return '#9ca3af';
  }
};

export const ShapeIcon: React.FC<ShapeIconProps> = ({ shape, color, size = 40, className = '' }) => {
  const fill = getColorHex(color);
  
  // Common SVG props
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: fill,
    stroke: "white",
    strokeWidth: 2,
    strokeLinejoin: "round" as const,
    className: `drop-shadow-sm ${className}`
  };

  switch (shape) {
    case 'square':
      return (
        <svg {...props}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      );
    case 'circle':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
    case 'triangle':
      return (
        <svg {...props}>
          <path d="M12 3l9 16H3z" />
        </svg>
      );
    case 'diamond':
      return (
        <svg {...props}>
          <path d="M12 2L2 12l10 10 10-10z" />
        </svg>
      );
    case 'pentagon':
      return (
        <svg {...props}>
          <path d="M12 2l9.5 6.9-3.6 11.1h-11.8l-3.6-11.1z" />
        </svg>
      );
    case 'hexagon':
      return (
        <svg {...props}>
          <path d="M12 2l8.7 5v10l-8.7 5-8.7-5v-10z" />
        </svg>
      );
    case 'star':
      return (
        <svg {...props}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    default:
      return null;
  }
};