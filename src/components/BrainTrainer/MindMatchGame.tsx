import React from "react";
import { Puzzle } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import MindMatchBoard from "./mindMatch/MindMatchBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./mindMatch/constants";
import { useMindMatchController } from "./mindMatch/useMindMatchController";

const MindMatchGame: React.FC = () => {
  const {
    engine,
    feedback,
    puzzle,
    selectedIds,
    isChecking,
    toggleCard,
    checkAnswer,
  } = useMindMatchController();

  return (
    <BrainTrainerShell
      config={{
        title: GAME_TITLE,
        description: GAME_DESCRIPTION,
        tuzoCode: TUZO_TEXT,
        icon: Puzzle,
        accentColor: "cyber-pink",
        maxLevel: MAX_LEVEL,
        wideLayout: true,
        howToPlay: [
          "Kategori ismine göre doğru öğeleri bul.",
          "Hepsini seçince Kontrol Et'e tıkla.",
          "Yanlış seçimler can götürür, dikkatli ol.",
        ],
      }}
      engine={engine}
      feedback={feedback}
    >
      {({ phase, feedbackState }) =>
        phase === "playing" && puzzle ? (
          <MindMatchBoard
            puzzle={puzzle}
            selectedIds={selectedIds}
            isChecking={isChecking}
            feedbackState={feedbackState}
            onToggle={toggleCard}
            onCheck={checkAnswer}
          />
        ) : null
      }
    </BrainTrainerShell>
  );
};

export default MindMatchGame;
