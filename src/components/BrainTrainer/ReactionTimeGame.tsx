import React from "react";
import { Zap } from "lucide-react";
import BrainTrainerShell from "./shared/BrainTrainerShell";
import { REACTION_TUZO_CODE } from "./reactionTime/constants";
import { ReactionTimePlayfield } from "./reactionTime/ReactionTimePlayfield";
import { ReactionTimeSummary } from "./reactionTime/ReactionTimeSummary";
import { ReactionTimeWelcomeScreen } from "./reactionTime/ReactionTimeWelcomeScreen";
import { useReactionTimeController } from "./reactionTime/useReactionTimeController";

const ReactionTimeGame: React.FC = () => {
  const {
    engine,
    feedback,
    gameMode,
    roundState,
    currentColor,
    currentReactionTime,
    reactionMetrics,
    gamePerformance,
    navigation,
    startCustomGame,
    handleClick,
    resetToWelcome,
  } = useReactionTimeController();

  const gameConfig = {
    title: "Tepki Süresi",
    description: "",
    howToPlay: [],
    icon: Zap,
    tuzoCode: REACTION_TUZO_CODE,
    customWelcome: (
      <ReactionTimeWelcomeScreen
        backLink={navigation.backLink}
        backLabel={navigation.backLabel}
        onSelectMode={startCustomGame}
      />
    ),
    onRestart: resetToWelcome,
    extraHudItems:
      gamePerformance.streakCorrect > 1 ? (
        <div className="animate-pulse rounded-xl border-2 border-black/10 bg-cyber-purple px-3 py-2 shadow-neo-sm sm:px-4">
          <div className="flex items-center gap-2">
            <Zap className="fill-white/50 text-white" size={18} />
            <span className="font-nunito font-black text-white">
              x{gamePerformance.streakCorrect}
            </span>
          </div>
        </div>
      ) : null,
    extraGameOverActions: (
      <ReactionTimeSummary
        averageReaction={reactionMetrics.averageReaction}
        bestReaction={reactionMetrics.bestReaction}
        correctAnswers={gamePerformance.correctAnswers}
        wrongAnswers={gamePerformance.wrongAnswers}
      />
    ),
  };

  return (
    <BrainTrainerShell engine={engine} feedback={feedback} config={gameConfig}>
      {({ phase }) =>
        phase === "playing" ? (
          <ReactionTimePlayfield
            gameMode={gameMode}
            roundState={roundState}
            currentColor={currentColor}
            currentReactionTime={currentReactionTime}
            onClick={handleClick}
          />
        ) : null
      }
    </BrainTrainerShell>
  );
};

export default ReactionTimeGame;
