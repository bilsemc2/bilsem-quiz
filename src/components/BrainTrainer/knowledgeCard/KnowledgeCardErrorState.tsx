import { AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface KnowledgeCardErrorStateProps {
  backLink: string;
  errorMessage: string;
}

const KnowledgeCardErrorState = ({
  backLink,
  errorMessage,
}: KnowledgeCardErrorStateProps) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border-2 border-black/10 shadow-neo-sm text-center max-w-md mx-auto">
      <AlertCircle size={48} className="text-cyber-pink mx-auto mb-4" />
      <h2 className="text-xl font-nunito font-black text-black dark:text-white mb-2">
        Hata Oluştu
      </h2>
      <p className="text-slate-600 dark:text-slate-300 font-nunito mb-6">
        {errorMessage}
      </p>
      <Link
        to={backLink}
        className="px-6 py-3 bg-cyber-pink text-black rounded-xl font-nunito font-bold border-2 border-black/10 shadow-neo-sm inline-block"
      >
        Geri Dön
      </Link>
    </div>
  );
};

export default KnowledgeCardErrorState;
