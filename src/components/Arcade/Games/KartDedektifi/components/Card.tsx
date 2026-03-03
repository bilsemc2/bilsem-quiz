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
          className="text-white w-6 h-6 md:w-10 md:h-10 fill-current drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]"
        />
      );
    }

    // Grid layout based on count for visual balance
    const gridCols = card.number === 1 ? 'grid-cols-1' : card.number === 2 ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-2';

    return (
      <div className={`grid ${gridCols} items-center justify-items-center relative z-10`}>
        {icons}
      </div>
    );
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-24 h-36 md:w-32 md:h-48 rounded-3xl flex items-center justify-center transition-all duration-200
        border-[4px] border-black/10 sm:shadow-neo-sm shadow-neo-sm overflow-hidden
        ${COLORS[card.color]}
        ${isSelected ? 'ring-8 ring-yellow-400 scale-105 z-10 shadow-none -translate-y-1' : 'hover:-translate-y-2 hover:shadow-neo-sm sm:hover:shadow-neo-sm active:translate-y-2 active:shadow-none'}
        ${isReference ? 'cursor-default hover:-translate-y-0 hover:shadow-neo-sm sm:hover:shadow-neo-sm' : 'cursor-pointer'}
        ${disabled ? 'opacity-90 grayscale-[0.5] hover:-translate-y-0 active:translate-y-0 hover:shadow-neo-sm sm:hover:shadow-neo-sm' : ''}
      `}
    >
      {/* Gloss reflection overlay, cartoonish */}
      <div className="bg-white/30 w-12 h-[150%] absolute -top-4 -left-2 skew-x-12 pointer-events-none rounded-full blur-[2px]" />
      {renderShapes()}
    </button>
  );
};

export default Card;
