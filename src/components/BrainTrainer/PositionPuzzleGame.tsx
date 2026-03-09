import React from "react";
import { MapPin } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import PositionPuzzleBoard from "./positionPuzzle/PositionPuzzleBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./positionPuzzle/constants";
import { usePositionPuzzleController } from "./positionPuzzle/usePositionPuzzleController";

const PositionPuzzleGame: React.FC = () => {
  const { engine, feedback, canvasSize, puzzle, selectedId, handleAnswer } =
    usePositionPuzzleController();

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    accentColor: "cyber-purple",
    icon: MapPin,
    wideLayout: true,
    maxLevel: MAX_LEVEL,
    howToPlay: [
      <span key="1">
        <span className="flex-shrink-0 w-8 h-8 inline-flex bg-cyber-pink text-black border-2 border-black/10 rounded-lg items-center justify-center font-nunito font-black text-sm shadow-neo-sm rotate-2 mr-2">
          1
        </span>
        Ustteki sekil grubunda <strong>noktanin yerini</strong> incele
      </span>,
      <span key="2">
        <span className="flex-shrink-0 w-8 h-8 inline-flex bg-cyber-yellow text-black border-2 border-black/10 rounded-lg items-center justify-center font-nunito font-black text-sm shadow-neo-sm -rotate-3 mr-2">
          2
        </span>
        Ayni <strong>mantiksal bolgedeki</strong> secenegi bul
      </span>,
      <span key="3">
        <span className="flex-shrink-0 w-8 h-8 inline-flex bg-cyber-blue text-black border-2 border-black/10 rounded-lg items-center justify-center font-nunito font-black text-sm shadow-neo-sm rotate-1 mr-2">
          3
        </span>
        Secenekler <strong>dondurulmus olabilir</strong>, dikkatli ol
      </span>,
    ],
  };

  return (
    <BrainTrainerShell engine={engine} feedback={feedback} config={gameConfig}>
      {({ phase, feedbackState }) => (
        <div className="relative z-10 flex flex-col items-center justify-center p-2 flex-1">
          {phase === "playing" && puzzle ? (
            <PositionPuzzleBoard
              puzzle={puzzle}
              canvasSize={canvasSize}
              selectedId={selectedId}
              isLocked={!!feedbackState}
              onAnswer={handleAnswer}
            />
          ) : null}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default PositionPuzzleGame;
