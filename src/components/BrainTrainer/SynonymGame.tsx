import { BookOpen } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import SynonymBoard from "./synonym/SynonymBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./synonym/constants";
import SynonymErrorState from "./synonym/SynonymErrorState";
import { useSynonymController } from "./synonym/useSynonymController";

const SynonymGame: React.FC = () => {
  const {
    currentQuestion,
    engine,
    errorActionLabel,
    errorMessage,
    feedback,
    handleAnswer,
    handleErrorAction,
    localPhase,
  } = useSynonymController();

  if (errorMessage) {
    return (
      <SynonymErrorState
        actionLabel={errorActionLabel}
        errorMessage={errorMessage}
        onAction={handleErrorAction}
      />
    );
  }

  return (
    <BrainTrainerShell
      engine={engine}
      feedback={feedback}
      config={{
        title: GAME_TITLE,
        icon: BookOpen,
        description: GAME_DESCRIPTION,
        howToPlay: [
          "Verilen kelimenin eş anlamlısını bul.",
          "Seçeneklerden doğru olanı işaretle.",
          "Hata yapmadan ilerleyerek seri bonusu kazan!",
        ],
        tuzoCode: TUZO_TEXT,
        accentColor: "cyber-pink",
        wideLayout: true,
        maxLevel: MAX_LEVEL,
      }}
    >
      {() => (
        <SynonymBoard
          currentQuestion={currentQuestion}
          feedbackState={feedback.feedbackState}
          localPhase={localPhase}
          onAnswer={handleAnswer}
        />
      )}
    </BrainTrainerShell>
  );
};

export default SynonymGame;
