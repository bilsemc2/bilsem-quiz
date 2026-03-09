import React from "react";
import { FlaskConical } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import LogicPuzzleBoard from "./logicPuzzle/LogicPuzzleBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./logicPuzzle/constants";
import { useLogicPuzzleController } from "./logicPuzzle/useLogicPuzzleController";

const LogicPuzzleGame: React.FC = () => {
  const { engine, feedback, puzzle, selectedIndex, handleGuess } =
    useLogicPuzzleController();

  return (
    <BrainTrainerShell
      engine={engine}
      feedback={feedback}
      config={{
        title: GAME_TITLE,
        description: GAME_DESCRIPTION,
        tuzoCode: TUZO_TEXT,
        icon: FlaskConical,
        accentColor: "cyber-pink",
        maxLevel: MAX_LEVEL,
        howToPlay: [
          "Üstteki örneklerin ortak özelliğini bul.",
          "Aynı özelliğe sahip olan seçeneği işaretle.",
          "Renk, şekil veya sayı kurallarına dikkat et!",
        ],
      }}
    >
      {({ phase, feedbackState }) => (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-2 w-full max-w-3xl mx-auto">
          {phase === "playing" && puzzle ? (
            <LogicPuzzleBoard
              puzzle={puzzle}
              selectedIndex={selectedIndex}
              feedbackState={feedbackState}
              onGuess={handleGuess}
            />
          ) : null}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default LogicPuzzleGame;
