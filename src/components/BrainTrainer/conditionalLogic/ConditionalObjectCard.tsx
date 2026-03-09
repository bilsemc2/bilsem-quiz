import React from "react";

import ShapeIcon from "./ShapeIcon";
import type { GameObject } from "./types";

interface ConditionalObjectCardProps {
  object: GameObject;
  isSelected: boolean;
  isRevealedTarget: boolean;
  isMissedTarget: boolean;
  disabled: boolean;
  onClick: () => void;
}

const ConditionalObjectCard: React.FC<ConditionalObjectCardProps> = ({
  object,
  isSelected,
  isRevealedTarget,
  isMissedTarget,
  disabled,
  onClick,
}) => {
  let borderClass = "border-black";
  let backgroundClass = "bg-white dark:bg-slate-700";
  let opacityClass =
    disabled && !isSelected && !isRevealedTarget ? "opacity-40" : "opacity-100";
  let animationClass = "";

  if (isSelected) {
    if (isRevealedTarget) {
      borderClass = "border-cyber-green";
      backgroundClass = "bg-green-100 dark:bg-green-900";
      animationClass = "animate-bounce";
    } else {
      borderClass = "border-cyber-pink";
      backgroundClass = "bg-red-100 dark:bg-red-900";
    }
  } else if (isMissedTarget) {
    borderClass = "border-cyber-green border-dashed";
    opacityClass = "opacity-70";
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`aspect-square rounded-xl sm:rounded-2xl border-4 flex items-center justify-center p-3 transition-all duration-300 ${borderClass} ${backgroundClass} ${opacityClass} ${animationClass} relative shadow-neo-sm active:scale-95`}
    >
      <ShapeIcon shape={object.shape} color={object.color} size={64} />
    </button>
  );
};

export default ConditionalObjectCard;
