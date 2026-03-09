import { motion } from "framer-motion";

import AttentionCodingAnswerPad from "./AttentionCodingAnswerPad";
import AttentionCodingMappingTable from "./AttentionCodingMappingTable";
import AttentionCodingPromptQueue from "./AttentionCodingPromptQueue";
import type { KeyMapping, ShapeType, TestItem } from "./types";

interface AttentionCodingBoardProps {
  availableShapes: ShapeType[];
  currentIndex: number;
  items: TestItem[];
  keyMappings: KeyMapping[];
  onAnswer: (shape: ShapeType) => void;
}

const AttentionCodingBoard = ({
  availableShapes,
  currentIndex,
  items,
  keyMappings,
  onAnswer,
}: AttentionCodingBoardProps) => {
  return (
    <motion.div
      key="game"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex w-full max-w-3xl flex-col gap-5"
    >
      <AttentionCodingMappingTable keyMappings={keyMappings} />
      <AttentionCodingPromptQueue currentIndex={currentIndex} items={items} />
      <AttentionCodingAnswerPad
        availableShapes={availableShapes}
        onAnswer={onAnswer}
      />
    </motion.div>
  );
};

export default AttentionCodingBoard;
