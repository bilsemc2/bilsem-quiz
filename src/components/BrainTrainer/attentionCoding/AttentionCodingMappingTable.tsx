import AttentionCodingShapeIcon from "./AttentionCodingShapeIcon";
import type { KeyMapping } from "./types";

interface AttentionCodingMappingTableProps {
  keyMappings: KeyMapping[];
}

const AttentionCodingMappingTable = ({
  keyMappings,
}: AttentionCodingMappingTableProps) => {
  return (
    <div className="relative rounded-2xl border-2 border-black/10 bg-white p-5 shadow-neo-sm dark:bg-slate-800">
      <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border-2 border-black/10 bg-cyber-blue px-4 py-1.5 font-nunito text-xs font-black uppercase tracking-widest text-white shadow-neo-sm">
        Eşleştirme Tablosu
      </div>
      <div className="mt-2 flex items-center justify-center gap-2 sm:gap-3">
        {keyMappings.map((mapping) => (
          <div
            key={mapping.number}
            className="flex flex-col items-center gap-1.5 rounded-xl border-2 border-black/10 bg-slate-50 p-3 dark:bg-slate-700/50"
          >
            <span className="font-nunito text-xl font-black text-cyber-blue">
              {mapping.number}
            </span>
            <div className="h-0.5 w-8 rounded-full bg-slate-300 dark:bg-slate-600" />
            <AttentionCodingShapeIcon
              type={mapping.shape}
              className="text-black dark:text-white"
              size={24}
              strokeWidth={2.5}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttentionCodingMappingTable;
