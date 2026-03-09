import ReflectionSumDisplayStage from "./ReflectionSumDisplayStage";
import ReflectionSumSequenceStage from "./ReflectionSumSequenceStage";
import ReflectionSumSumStage from "./ReflectionSumSumStage";
import type { ReflectionStatus } from "./types";

interface ReflectionSumBoardProps {
  currentIndex: number;
  digits: number[];
  isMirrored: boolean;
  onDigitClick: (digit: number) => void;
  onSubmitSum: () => void;
  onUserSumChange: (value: string) => void;
  status: ReflectionStatus;
  userSequence: number[];
  userSum: string;
}

const ReflectionSumBoard = ({
  currentIndex,
  digits,
  isMirrored,
  onDigitClick,
  onSubmitSum,
  onUserSumChange,
  status,
  userSequence,
  userSum,
}: ReflectionSumBoardProps) => {
  if (status === "display") {
    return (
      <ReflectionSumDisplayStage
        currentIndex={currentIndex}
        digits={digits}
        isMirrored={isMirrored}
      />
    );
  }

  if (status === "input_sequence") {
    return (
      <ReflectionSumSequenceStage
        digits={digits}
        onDigitClick={onDigitClick}
        userSequence={userSequence}
      />
    );
  }

  return (
    <ReflectionSumSumStage
      onSubmit={onSubmitSum}
      onUserSumChange={onUserSumChange}
      userSum={userSum}
    />
  );
};

export default ReflectionSumBoard;
