import React from 'react';
import { Star, Heart, Cloud, Moon, LucideIcon } from 'lucide-react';
import { CardData, Shape } from '../types';
import { COLORS } from '../constants';

const SHAPE_COMPONENTS: Record<Shape, LucideIcon> = {
  [Shape.Star]: Star,
  [Shape.Heart]: Heart,
  [Shape.Cloud]: Cloud,
  [Shape.Moon]: Moon,
};

interface CardProps {
  card: CardData;
  onClick?: () => void;
  isSelected?: boolean;
  isReference?: boolean;
  disabled?: boolean;
}

const Card: React.FC<CardProps> = ({ card, onClick, isSelected, isReference, disabled }) => {
  const IconComponent = SHAPE_COMPONENTS[card.shape];

  const renderShapes = () => {
    const icons = [];
    for (let i = 0; i < card.number; i++) {
      icons.push(
        <IconComponent
          key={i}
          className="text-white w-6 h-6 md:w-10 md:h-10 fill-current drop-shadow-md"
        />
      );
    }

    // Grid layout based on count for visual balance
    const gridCols = card.number === 1 ? 'grid-cols-1' : card.number === 2 ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-2';

    return (
      <div className={`grid ${gridCols} items-center justify-items-center`}>
        {icons}
      </div>
    );
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-24 h-36 md:w-32 md:h-48 rounded-2xl shadow-lg flex items-center justify-center transition-all duration-300
        ${COLORS[card.color]}
        ${isSelected ? 'ring-4 ring-yellow-300 scale-105 z-10' : 'hover:scale-105 active:scale-95'}
        ${isReference ? 'cursor-default' : 'cursor-pointer'}
        ${disabled ? 'opacity-80 grayscale-[0.2]' : ''}
        border-4 border-white
      `}
    >
      <div className="bg-white/10 w-full h-full absolute inset-0 rounded-xl pointer-events-none" />
      {renderShapes()}

      {/* Decorative dots for card feel */}
      <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-white/30" />
      <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-white/30" />
    </button>
  );
};

export default Card;
