import React from "react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import MazeRunnerBoard from "./mazeRunner/MazeRunnerBoard";
import { useMazeRunnerController } from "./mazeRunner/useMazeRunnerController";

const MazeRunnerGame: React.FC = () => {
  const {
    engine,
    feedback,
    feedbackState,
    gameConfig,
    mazeLevel,
    warning,
    shake,
    boardResetKey,
    handleCrash,
    handleWrongPath,
    handleLevelComplete,
  } = useMazeRunnerController();

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {() => (
        <MazeRunnerBoard
          mazeLevel={mazeLevel}
          lives={engine.lives}
          warning={warning}
          shake={shake}
          boardResetKey={boardResetKey}
          feedbackActive={Boolean(feedbackState)}
          onCrash={handleCrash}
          onWrongPath={handleWrongPath}
          onComplete={handleLevelComplete}
        />
      )}
    </BrainTrainerShell>
  );
};

export default MazeRunnerGame;
