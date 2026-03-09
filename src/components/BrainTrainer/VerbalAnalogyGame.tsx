import { GitBranch } from "lucide-react";

import BrainTrainerShell from "./shared/BrainTrainerShell";
import VerbalAnalogyBoard from "./verbalAnalogy/VerbalAnalogyBoard";
import {
  GAME_DESCRIPTION,
  GAME_TITLE,
  MAX_LEVEL,
  TUZO_TEXT,
} from "./verbalAnalogy/constants";
import VerbalAnalogyErrorState from "./verbalAnalogy/VerbalAnalogyErrorState";
import { useVerbalAnalogyController } from "./verbalAnalogy/useVerbalAnalogyController";

const VerbalAnalogyGame: React.FC = () => {
  const {
    currentQuestion,
    engine,
    errorActionLabel,
    errorMessage,
    feedback,
    handleAnswer,
    handleErrorAction,
    localPhase,
  } = useVerbalAnalogyController();

  if (errorMessage) {
    return (
      <VerbalAnalogyErrorState
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
        icon: GitBranch,
        description: GAME_DESCRIPTION,
        howToPlay: [
          "İlk iki kelime arasındaki mantıksal ilişkiyi analiz et.",
          "Aynı ilişkiyi ikinci çifte de uygula.",
          "Doğru kelimeyi seçeneklerden bul.",
        ],
        tuzoCode: TUZO_TEXT,
        accentColor: "cyber-blue",
        wideLayout: true,
        maxLevel: MAX_LEVEL,
      }}
    >
      {() => (
        <VerbalAnalogyBoard
          currentQuestion={currentQuestion}
          feedbackState={feedback.feedbackState}
          localPhase={localPhase}
          onAnswer={handleAnswer}
        />
      )}
    </BrainTrainerShell>
  );
};

export default VerbalAnalogyGame;
