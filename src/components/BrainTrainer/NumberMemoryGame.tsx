import React from "react";
import { Headphones } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import NumberMemoryBoard from "./numberMemory/NumberMemoryBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./numberMemory/constants";
import { useNumberMemoryController } from "./numberMemory/useNumberMemoryController";

const NumberMemoryGame: React.FC = () => {
  const {
    currentPlayIndex,
    engine,
    feedback,
    handleAnswer,
    localPhase,
    numberSequence,
    question,
    selectedAnswer,
  } = useNumberMemoryController();

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: Headphones,
    accentColor: "cyber-blue",
    maxLevel: MAX_LEVEL,
    howToPlay: [
      "Rakamların sesli okunuşunu pür dikkat dinle",
      "Dinleme bittikten sonra sorulan mantıksal soruyu yanıtla",
      "Dizideki rakamları, sıralarını ve büyüklüklerini aklında tutmaya çalış"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <div className="relative z-10 flex flex-col items-center justify-center p-2 flex-1 w-full">
          {engine.phase === "playing" ? (
            <NumberMemoryBoard
              currentPlayIndex={currentPlayIndex}
              localPhase={localPhase}
              numberSequence={numberSequence}
              onAnswer={handleAnswer}
              question={question}
              selectedAnswer={selectedAnswer}
            />
          ) : null}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default NumberMemoryGame;
