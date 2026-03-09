import React from "react";
import { Clock } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./timeExplorer/constants";
import TimeExplorerBoard from "./timeExplorer/TimeExplorerBoard";
import { useTimeExplorerController } from "./timeExplorer/useTimeExplorerController";

const TimeExplorerGame: React.FC = () => {
  const {
    engine,
    feedback,
    questionTime,
    targetOffset,
    userMinutes,
    displayHour,
    handleCheck,
    handleMinuteChange,
  } = useTimeExplorerController();

  return (
    <BrainTrainerShell
      engine={engine}
      feedback={feedback}
      config={{
        title: GAME_TITLE,
        icon: Clock,
        description: GAME_DESCRIPTION,
        howToPlay: [
          "Hedeften kac dakika ileri veya geri gitmen gerektigini oku.",
          "Saati ayarlamak icin yelkovani surukle.",
          "Dogru zamani buldugunda kontrol et butonuna bas.",
        ],
        tuzoCode: TUZO_TEXT,
        accentColor: "cyber-yellow",
        maxLevel: MAX_LEVEL,
      }}
    >
      {({ feedbackState, phase }) => (
        <div className="w-full flex-1 flex items-center justify-center p-2 sm:p-4">
          {phase === "playing" && questionTime ? (
            <TimeExplorerBoard
              displayHour={displayHour}
              feedbackState={feedbackState}
              questionTime={questionTime}
              targetOffset={targetOffset}
              userMinutes={userMinutes}
              onCheck={handleCheck}
              onMinuteChange={handleMinuteChange}
            />
          ) : null}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default TimeExplorerGame;
