import React from "react";

import CreatureMonster from "./CreatureMonster";
import { getCreatureTraitLines } from "./logic";
import type { Creature } from "./types";

interface CreatureCardProps {
  creature: Creature;
  isSelected: boolean;
  isTarget: boolean;
  showResults: boolean;
  onClick: () => void;
  disabled: boolean;
}

const getCardClasses = (
  isSelected: boolean,
  isTarget: boolean,
  showResults: boolean,
) => {
  if (showResults) {
    if (isTarget && isSelected) {
      return {
        backgroundClass: "bg-cyber-green/20",
        borderClass: "border-cyber-green",
      };
    }

    if (isTarget && !isSelected) {
      return {
        backgroundClass: "bg-cyber-yellow/20",
        borderClass: "border-cyber-yellow border-dashed",
      };
    }

    if (!isTarget && isSelected) {
      return {
        backgroundClass: "bg-cyber-pink/20",
        borderClass: "border-cyber-pink",
      };
    }
  }

  if (isSelected) {
    return {
      backgroundClass: "bg-slate-100 dark:bg-slate-700",
      borderClass: "border-cyber-blue border-[6px]",
    };
  }

  return {
    backgroundClass: "bg-white dark:bg-slate-800",
    borderClass: "border-black",
  };
};

const CreatureCard: React.FC<CreatureCardProps> = ({
  creature,
  isSelected,
  isTarget,
  showResults,
  onClick,
  disabled,
}) => {
  const traitLines = getCreatureTraitLines(creature);
  const { backgroundClass, borderClass } = getCardClasses(
    isSelected,
    isTarget,
    showResults,
  );

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`min-h-[160px] sm:min-h-[180px] p-2 sm:p-3 outline-none flex flex-col items-center justify-center gap-1.5 rounded-xl sm:rounded-2xl border-4 ${borderClass} ${backgroundClass} transition-all duration-200 shadow-neo-sm active:scale-95`}
    >
      <CreatureMonster creature={creature} size={72} />
      <div className="w-full mt-0.5 px-1 py-1 bg-black/5 dark:bg-white/5 border border-black/20 dark:border-white/20 rounded-lg">
        {traitLines.map((line) => (
          <p
            key={`${creature.id}-${line}`}
            className="text-[9px] sm:text-[10px] leading-tight text-black dark:text-white font-nunito font-semibold text-center break-words"
          >
            {line}
          </p>
        ))}
      </div>
    </button>
  );
};

export default CreatureCard;
