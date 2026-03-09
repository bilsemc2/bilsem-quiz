import { Loader2 } from "lucide-react";

const KnowledgeCardLoadingState = () => {
  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-10">
      <Loader2
        size={48}
        className="text-cyber-blue animate-spin drop-shadow-sm mb-4"
      />
      <p className="font-nunito font-bold text-slate-500 uppercase tracking-widest">
        KARTLAR HAZIRLANIYOR...
      </p>
    </div>
  );
};

export default KnowledgeCardLoadingState;
