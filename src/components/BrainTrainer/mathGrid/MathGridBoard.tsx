import { motion } from "framer-motion";

import MathGridKeypad from "./MathGridKeypad";
import MathGridMatrix from "./MathGridMatrix";
import type { ActiveCell, GridMatrix } from "./types";

interface MathGridBoardProps {
  activeCell: ActiveCell | null;
  grid: GridMatrix;
  onCellClick: (row: number, col: number) => void;
  onDelete: () => void;
  onNumberInput: (digit: string) => void;
  onSubmit: () => void;
  ruleDescription: string;
  showErrors: boolean;
}

const MathGridBoard = ({
  activeCell,
  grid,
  onCellClick,
  onDelete,
  onNumberInput,
  onSubmit,
  ruleDescription,
  showErrors,
}: MathGridBoardProps) => (
  <motion.div
    key="game"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="w-full flex flex-col items-center"
  >
    <div className="mb-3 bg-white dark:bg-slate-800 px-4 py-2 border-2 border-black/10 shadow-neo-sm rounded-xl">
      <p className="text-xs sm:text-sm text-cyber-blue font-nunito font-black tracking-wider uppercase text-center">
        {showErrors ? `Iliski: ${ruleDescription}` : "Tablodaki Bosluklari Doldur"}
      </p>
    </div>

    <MathGridMatrix
      activeCell={activeCell}
      grid={grid}
      onCellClick={onCellClick}
      showErrors={showErrors}
    />

    <MathGridKeypad onDelete={onDelete} onNumberInput={onNumberInput} onSubmit={onSubmit} />
  </motion.div>
);

export default MathGridBoard;
