import React from "react";
import { Search } from "lucide-react";

interface PuzzleMasterTargetPanelProps {
  isLoading: boolean;
  targetThumbnail: string | null;
}

const PuzzleMasterTargetPanel: React.FC<PuzzleMasterTargetPanelProps> = ({
  isLoading,
  targetThumbnail,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border-2 border-black/10 shadow-neo-sm text-center">
      <p className="text-[10px] font-nunito font-black text-black bg-cyber-yellow px-3 py-1 rounded-lg border-2 border-black/10 inline-block mb-3 tracking-widest uppercase shadow-neo-sm">
        Bu Parçayı Bul
      </p>

      <div className="aspect-square w-full sm:w-40 mx-auto xl:w-full rounded-xl overflow-hidden border-2 border-black/10 bg-slate-900 relative shadow-inner">
        {targetThumbnail ? (
          <img
            src={targetThumbnail}
            alt="Target block to find"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full animate-pulse bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
            <Search size={28} className="text-black/20" />
          </div>
        )}

        {isLoading ? (
          <div className="absolute inset-0 bg-white/20 dark:bg-slate-900/20" />
        ) : null}
      </div>
    </div>
  );
};

export default PuzzleMasterTargetPanel;
