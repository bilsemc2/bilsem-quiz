import React from "react";

import ConditionalObjectCard from "./ConditionalObjectCard";
import type { RoundData } from "./types";

interface ConditionalLogicBoardProps {
  round: RoundData;
  selectedId: string | null;
  onSelectObject: (id: string) => void;
}

const getGridClassName = (count: number) => {
  if (count <= 4) {
    return "grid-cols-2 sm:grid-cols-4";
  }

  if (count <= 6) {
    return "grid-cols-3 sm:grid-cols-3";
  }

  return "grid-cols-3 sm:grid-cols-4";
};

const ConditionalLogicBoard: React.FC<ConditionalLogicBoardProps> = ({
  round,
  selectedId,
  onSelectObject,
}) => {
  return (
    <div className="w-full max-w-3xl flex flex-col items-center gap-4">
      <div className="bg-white dark:bg-slate-800 border-2 border-black/10 p-4 sm:p-5 rounded-2xl shadow-neo-sm text-center max-w-xl w-full relative">
        <div className="absolute -top-3 -left-3 w-10 h-10 bg-cyber-pink border-2 border-black/10 rounded-full flex items-center justify-center shadow-neo-sm">
          <span className="font-nunito font-black text-black">!</span>
        </div>
        <h3 className="text-lg sm:text-xl font-nunito font-black text-slate-800 dark:text-slate-100 leading-relaxed italic">
          "{round.instruction}"
        </h3>
      </div>

      <div className="bg-slate-100 dark:bg-slate-800/80 border-2 border-black/10 p-4 sm:p-5 rounded-2xl w-full shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1)]">
        <div className={`grid gap-3 sm:gap-4 justify-center ${getGridClassName(round.objects.length)}`}>
          {round.objects.map((object) => {
            const isSelected = selectedId === object.id;
            const isRevealedTarget = selectedId !== null && object.id === round.targetId;
            const isMissedTarget =
              selectedId !== null &&
              selectedId !== object.id &&
              object.id === round.targetId;

            return (
              <ConditionalObjectCard
                key={object.id}
                object={object}
                isSelected={isSelected}
                isRevealedTarget={isRevealedTarget}
                isMissedTarget={isMissedTarget}
                disabled={selectedId !== null}
                onClick={() => onSelectObject(object.id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ConditionalLogicBoard;
