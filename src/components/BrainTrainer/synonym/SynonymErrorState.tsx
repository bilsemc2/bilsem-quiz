import { AlertCircle } from "lucide-react";

interface SynonymErrorStateProps {
  actionLabel: string;
  errorMessage: string;
  onAction: () => void;
}

const SynonymErrorState = ({
  actionLabel,
  errorMessage,
  onAction,
}: SynonymErrorStateProps) => (
  <div className="min-h-screen bg-[#FAF9F6] border-2 border-black/10 p-6 text-black dark:bg-slate-900 dark:text-white">
    <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center">
      <div className="max-w-md rounded-2xl border-2 border-black/10 bg-white p-6 text-center shadow-neo-sm dark:bg-slate-800 sm:p-8">
        <AlertCircle
          className="mx-auto mb-6 h-20 w-20 text-cyber-pink"
          strokeWidth={2.5}
        />
        <h2 className="mb-4 text-3xl font-nunito font-black uppercase">
          Hata Oluştu
        </h2>
        <p className="mb-8 text-lg font-nunito font-medium text-slate-600 dark:text-slate-300">
          {errorMessage}
        </p>
        <button
          onClick={onAction}
          className="inline-block rounded-2xl border-2 border-black/10 bg-cyber-pink px-8 py-4 font-nunito font-black uppercase tracking-widest text-black shadow-neo-sm transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-sm active:translate-x-2 active:translate-y-2 active:shadow-none"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  </div>
);

export default SynonymErrorState;
