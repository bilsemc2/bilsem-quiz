// Sınav Devam Sayfası - Modül Arası Geçiş
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Clock,
  Target,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Pause,
  AlertTriangle,
  X,
} from "lucide-react";
import { useExam } from "../../contexts/ExamContext";

const ExamContinuePage: React.FC = () => {
  const navigate = useNavigate();
  const [showExitModal, setShowExitModal] = useState(false);
  const {
    session,
    refreshSession,
    getCurrentModule,
    getProgress,
    getNextLevel,
    getDifficultyConfig,
    abandonExam,
  } = useExam();

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const currentModule = getCurrentModule();
  const progress = getProgress();
  const nextLevel = getNextLevel();
  const difficultyConfig = getDifficultyConfig(nextLevel);
  const lastResult = session?.results[session.results.length - 1];

  useEffect(() => {
    if (!session) {
      navigate("/atolyeler/sinav-simulasyonu");
    } else if (session.status === "completed") {
      navigate("/atolyeler/sinav-simulasyonu/sonuc");
    } else if (!currentModule) {
      navigate("/atolyeler/sinav-simulasyonu");
    }
  }, [session, currentModule, navigate]);

  if (!session || !currentModule) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyber-emerald border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleContinue = () => {
    navigate(currentModule.link, {
      state: {
        examMode: true,
        examLevel: nextLevel,
        examTimeLimit: Math.round(
          currentModule.timeLimit * difficultyConfig.timeMultiplier,
        ),
      },
    });
  };

  const handleAbandon = () => {
    setShowExitModal(true);
  };

  const confirmAbandon = () => {
    abandonExam();
    navigate("/atolyeler/sinav-simulasyonu");
  };

  const passedCount = session.results.filter((r) => r.passed).length;
  const failedCount = session.results.filter((r) => !r.passed).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4 sm:p-6 font-nunito relative overflow-hidden transition-colors duration-300">
      {/* Dot pattern */}
      <div className="fixed inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-8 sm:p-10 border-2 border-black/10 max-w-lg w-full relative z-10 shadow-neo-lg"
      >
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-slate-500 text-xs font-nunito font-extrabold uppercase tracking-widest">
              İlerleme
            </span>
            <span className="text-black dark:text-white font-extrabold font-nunito text-lg">
              {progress.current}{" "}
              <span className="text-slate-400">/ {progress.total}</span>
            </span>
          </div>
          <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden border-2 border-black/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.percentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full bg-cyber-pink rounded-full"
            />
          </div>
        </div>

        {/* Last Result */}
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-8 p-4 rounded-2xl border-3 flex items-center gap-4 ${lastResult.passed
                ? "bg-green-50 dark:bg-green-900/20 border-cyber-emerald/40"
                : "bg-red-50 dark:bg-red-900/20 border-red-400/40"
              }`}
          >
            {lastResult.passed ? (
              <CheckCircle2 className="text-cyber-emerald shrink-0" size={28} strokeWidth={2.5} />
            ) : (
              <XCircle className="text-red-500 shrink-0" size={28} strokeWidth={2.5} />
            )}
            <div className="flex-1">
              <div className={`font-nunito font-extrabold text-lg uppercase tracking-tight ${lastResult.passed ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                {lastResult.moduleTitle}
              </div>
              <div className="text-sm font-bold text-slate-500 mt-0.5">
                {lastResult.passed ? "Başarılı" : "Gayret Göstermeli"} • Seviye {lastResult.level}
              </div>
            </div>
            <div className="text-right">
              <div className="text-black dark:text-white font-nunito font-extrabold text-2xl">{lastResult.score}</div>
              <div className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">puan</div>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3 text-center border-2 border-black/5">
            <div className="text-2xl font-nunito font-extrabold text-cyber-emerald">{passedCount}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold mt-1">Başarılı</div>
          </div>
          <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3 text-center border-2 border-black/5">
            <div className="text-2xl font-nunito font-extrabold text-red-500">{failedCount}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold mt-1">Geliştirilmeli</div>
          </div>
          <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3 text-center border-2 border-black/5">
            <div className="text-2xl font-nunito font-extrabold text-cyber-blue">{nextLevel}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold mt-1">Seviye</div>
          </div>
        </div>

        {/* Next Module */}
        <div className="text-center mb-8">
          <div className="text-slate-400 text-xs font-nunito font-extrabold uppercase tracking-widest mb-3">Sıradaki Modül</div>
          <h2 className="text-2xl sm:text-3xl font-nunito font-extrabold text-black dark:text-white mb-4 leading-tight uppercase tracking-tight">
            {currentModule.title}
          </h2>

          <div className="flex items-center justify-center gap-4 text-sm font-bold text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 px-3 py-1.5 rounded-lg border border-black/5">
              <Clock size={16} className="text-cyber-gold" strokeWidth={2.5} />
              {Math.round(currentModule.timeLimit * difficultyConfig.timeMultiplier)} sn
            </span>
            <span className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 px-3 py-1.5 rounded-lg border border-black/5">
              <Target size={16} className="text-cyber-pink" strokeWidth={2.5} />
              Seviye {nextLevel}
            </span>
          </div>

          <div className={`inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-xl text-sm font-extrabold uppercase tracking-wider border-2 border-black/10 ${nextLevel > session.currentLevel - 1
              ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : nextLevel === 1
                ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                : "bg-gray-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
            }`}>
            {nextLevel > 1 && lastResult?.passed && <TrendingUp size={18} strokeWidth={2.5} />}
            {nextLevel === 1 && lastResult && !lastResult.passed && <TrendingDown size={18} strokeWidth={2.5} />}
            {difficultyConfig.name}
          </div>
        </div>

        {/* TUZÖ */}
        <div className="bg-cyber-blue/10 rounded-2xl p-4 mb-8 text-center border-2 border-cyber-blue/20">
          <div className="text-[10px] font-nunito font-extrabold text-cyber-blue uppercase tracking-widest mb-1">TUZÖ Kodu</div>
          <div className="text-black dark:text-white font-extrabold font-nunito text-lg">{currentModule.tuzo}</div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button onClick={handleAbandon}
            className="flex-[1] py-4 bg-gray-100 dark:bg-slate-700 text-black dark:text-white font-nunito font-extrabold uppercase tracking-widest border-3 border-black/10 rounded-xl shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all flex items-center justify-center gap-2 active:translate-y-0.5 active:shadow-none">
            <Pause size={20} strokeWidth={2.5} /> Çık
          </button>
          <button onClick={handleContinue}
            className="flex-[2] py-4 bg-cyber-gold text-black font-nunito font-extrabold text-lg uppercase tracking-widest border-3 border-black/10 rounded-xl shadow-neo-md hover:-translate-y-1 hover:shadow-neo-lg transition-all flex items-center justify-center gap-3 active:translate-y-0.5 active:shadow-none">
            DEVAM ET <ChevronRight size={24} strokeWidth={3} />
          </button>
        </div>
      </motion.div>

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowExitModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-8 border-2 border-black/10 max-w-md w-full shadow-neo-lg relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setShowExitModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 text-black dark:text-white transition-colors">
                <X size={24} strokeWidth={2.5} />
              </button>

              <div className="flex justify-center mb-6">
                <motion.div
                  className="w-16 h-16 rounded-2xl bg-cyber-gold/20 border-3 border-cyber-gold/30 flex items-center justify-center"
                  animate={{ rotate: [-3, 3, -3] }}
                  transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <AlertTriangle size={32} className="text-cyber-gold" strokeWidth={2.5} />
                </motion.div>
              </div>

              <h3 className="text-2xl font-nunito font-extrabold text-center text-black dark:text-white mb-3 uppercase tracking-tight">
                Sınavdan Çık?
              </h3>

              <p className="text-slate-500 font-nunito font-bold text-center mb-6">
                Sınavı iptal etmek istediğinize emin misiniz? <br />
                <span className="text-red-500 font-extrabold block mt-1">Tüm ilerlemeniz silinecek!</span>
              </p>

              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-2xl p-5 mb-8 border-2 border-black/5">
                <div className="flex justify-around text-center">
                  <div>
                    <div className="text-2xl font-nunito font-extrabold text-cyber-emerald">{passedCount}</div>
                    <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-1">Başarılı</div>
                  </div>
                  <div className="w-px bg-black/10 dark:bg-white/10" />
                  <div>
                    <div className="text-2xl font-nunito font-extrabold text-red-500">{failedCount}</div>
                    <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-1">Geliştirilmeli</div>
                  </div>
                  <div className="w-px bg-black/10 dark:bg-white/10" />
                  <div>
                    <div className="text-2xl font-nunito font-extrabold text-cyber-blue">{progress.current}/{progress.total}</div>
                    <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-1">İlerleme</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowExitModal(false)}
                  className="flex-1 py-4 bg-gray-100 dark:bg-slate-700 text-black dark:text-white font-nunito font-extrabold uppercase tracking-widest border-3 border-black/10 rounded-xl shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all active:translate-y-0.5 active:shadow-none">
                  Vazgeç
                </button>
                <button onClick={confirmAbandon}
                  className="flex-1 py-4 bg-red-500 text-white font-nunito font-extrabold uppercase tracking-widest border-3 border-black/10 rounded-xl shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all active:translate-y-0.5 active:shadow-none">
                  Evet, Çık
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExamContinuePage;
