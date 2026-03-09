import React from "react";
import { BookOpen } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import KnowledgeCardBoard from "./knowledgeCard/KnowledgeCardBoard";
import KnowledgeCardErrorState from "./knowledgeCard/KnowledgeCardErrorState";
import KnowledgeCardLoadingState from "./knowledgeCard/KnowledgeCardLoadingState";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./knowledgeCard/constants";
import { useKnowledgeCardController } from "./knowledgeCard/useKnowledgeCardController";

const KnowledgeCardGame: React.FC = () => {
  const { backLink, currentQuestion, engine, errorMessage, feedback, handleAnswer, localPhase } =
    useKnowledgeCardController();

  const gameConfig = {
    title: GAME_TITLE,
    description: GAME_DESCRIPTION,
    tuzoCode: TUZO_TEXT,
    icon: BookOpen,
    accentColor: "cyber-pink",
    maxLevel: MAX_LEVEL,
    wideLayout: true,
    backLink,
    howToPlay: [
      "Cümledeki eksik bölümü dikkatle oku.",
      "Anlamı tamamlayan doğru kelimeyi seç.",
      "3 canın bitmeden 20 soruyu başarıyla tamamla!"
    ]
  };

  return (
    <BrainTrainerShell config={gameConfig} engine={engine} feedback={feedback}>
      {({ feedbackState, phase }) => (
        <div className="relative z-10 flex flex-col items-center justify-start sm:justify-center flex-1 p-4 mb-4 mt-8 w-full max-w-4xl mx-auto">
          {localPhase === "loading" && phase === "playing" ? (
            <KnowledgeCardLoadingState />
          ) : null}

          {localPhase === "error" && phase === "playing" ? (
            <KnowledgeCardErrorState
              backLink={backLink}
              errorMessage={errorMessage}
            />
          ) : null}

          {localPhase === "ready" && phase === "playing" && currentQuestion ? (
            <KnowledgeCardBoard
              feedbackState={feedbackState}
              level={engine.level}
              onAnswer={handleAnswer}
              question={currentQuestion}
            />
          ) : null}
        </div>
      )}
    </BrainTrainerShell>
  );
};

export default KnowledgeCardGame;
