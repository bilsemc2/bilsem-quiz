import { motion } from "framer-motion";
import { Box } from "lucide-react";

import { OPTION_CUBE_SIZE } from "./constants";
import MagicCube3D from "./MagicCube3D";
import MagicCubeNetPreview from "./MagicCubeNetPreview";
import type { CubeNet, FaceContent, FaceName, GameOption } from "./types";

interface MagicCubeBoardProps {
  facesData: Record<FaceName, FaceContent> | null;
  isFolding: boolean;
  net: CubeNet | null;
  options: GameOption[];
  onSelect: (option: GameOption) => void;
  onToggleFolding: () => void;
}

const MagicCubeBoard = ({
  facesData,
  isFolding,
  net,
  options,
  onSelect,
  onToggleFolding,
}: MagicCubeBoardProps) => {
  if (!facesData || !net) {
    return null;
  }

  return (
    <motion.div
      key="game"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full"
    >
      <div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-2">
        <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-black/10 bg-white p-4 shadow-neo-sm dark:bg-slate-800 sm:p-6">
          <MagicCubeNetPreview
            facesData={facesData}
            isFolding={isFolding}
            net={net}
          />
          <p className="text-center font-chivo text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">
            {net.name}
          </p>
          <button
            onClick={onToggleFolding}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-black/10 bg-cyber-pink px-6 py-3 font-nunito text-sm font-black uppercase tracking-widest text-black shadow-neo-sm transition-all active:translate-y-1 active:shadow-none"
          >
            {isFolding ? "AÇINIMI GÖSTER" : "KATLI HALİNİ GÖR"}
          </button>
        </div>

        <div className="rounded-2xl border-2 border-black/10 bg-white p-4 text-center shadow-neo-sm dark:bg-slate-800 sm:p-6">
          <h2 className="mb-4 flex items-center justify-center gap-2 font-nunito text-xl font-black uppercase tracking-widest text-cyber-blue">
            <Box size={22} className="stroke-[3]" />
            DOĞRU KÜPÜ SEÇ
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {options.map((option) => (
              <motion.button
                key={option.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelect(option)}
                className="flex items-center justify-center rounded-xl border-2 border-black/10 bg-slate-50 p-4 shadow-neo-sm transition-all duration-300 active:translate-y-1 active:shadow-none dark:bg-slate-700"
              >
                <MagicCube3D
                  data={facesData}
                  rotation={option.rotation}
                  size={OPTION_CUBE_SIZE}
                />
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MagicCubeBoard;
