import sys

with open('src/components/BrainTrainer/MathGridGame.tsx', 'r') as f:
    content = f.read()

content = content.replace('import GameFeedbackBanner from "./shared/GameFeedbackBanner";\n', '')

if "Check" not in content[:content.find('} from "lucide-react";')]:
    content = content.replace('} from "lucide-react";', ', Check } from "lucide-react";')

lines = content.split('\n')

start_idx = -1
for i, line in enumerate(lines):
    if line.strip() == 'return (':
        # Let's verify it is the main return and not something else.
        if "min-h-screen" in lines[i+1]:
            start_idx = i
            break

if start_idx == -1:
    print("Could not find the main return (")
    sys.exit(1)

new_code = """  if (phase === "welcome") {
    return (
      <div className="min-h-screen bg-[#FAF9F6] dark:bg-slate-900 transition-colors duration-300 flex flex-col items-center justify-center p-6 text-black dark:text-white relative overflow-hidden font-chivo tracking-tight">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-xl relative z-10 w-full"
        >
          <motion.div
            className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 bg-cyber-pink border-8 border-black rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center rotate-3 shadow-[12px_12px_0_#000]"
            animate={{ y: [0, -8, 0], rotate: [3, -2, 3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Grid3X3 size={52} className="text-black drop-shadow-sm" strokeWidth={2.5} />
          </motion.div>

          <h1 className="text-4xl sm:text-5xl font-syne font-black mb-4 uppercase drop-shadow-sm text-black dark:text-white">
            Matematik Grid
          </h1>

          <p className="text-slate-600 dark:text-slate-300 font-chivo font-medium mb-8 text-base sm:text-lg max-w-md mx-auto">
            3x3 tablodaki gizli sayıları bul! Satırlar arasındaki matematiksel bağı keşfet ve boşlukları doldur.
          </p>

          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-3xl p-6 sm:p-8 mb-8 text-left border-4 border-black shadow-[8px_8px_0_#000] rotate-1">
            <h3 className="text-xl font-syne font-black text-cyber-blue mb-4 flex items-center gap-2 uppercase tracking-tight">
              <Eye size={24} className="text-cyber-blue" strokeWidth={2.5} /> Nasıl Oynanır?
            </h3>
            <ul className="space-y-4 text-slate-700 dark:text-slate-200 font-chivo font-medium">
              <li className="flex gap-4 items-start">
                <span className="w-8 h-8 shrink-0 bg-cyber-yellow border-2 border-black shadow-[2px_2px_0_#000] rounded-xl flex items-center justify-center font-syne font-black text-black text-sm -rotate-3">
                  1
                </span>
                <span className="pt-1">Satırlardaki sayıların birbirine nasıl dönüştüğünü bul</span>
              </li>
              <li className="flex gap-4 items-start">
                <span className="w-8 h-8 shrink-0 bg-cyber-green border-2 border-black shadow-[2px_2px_0_#000] rounded-xl flex items-center justify-center font-syne font-black text-black text-sm rotate-3">
                  2
                </span>
                <span className="pt-1">Soru işareti olan hücrelere tıkla ve doğru sayıyı gir</span>
              </li>
              <li className="flex gap-4 items-start">
                <span className="w-8 h-8 shrink-0 bg-cyber-pink border-2 border-black shadow-[2px_2px_0_#000] rounded-xl flex items-center justify-center font-syne font-black text-black text-sm -rotate-6">
                  3
                </span>
                <span className="pt-1">Tüm hücreleri doldurduktan sonra Kontrol Et butonuna bas!</span>
              </li>
            </ul>
          </div>

          <div className="bg-cyber-blue text-white text-xs px-4 py-2 rounded-xl mb-8 inline-block border-2 border-black shadow-[4px_4px_0_#000] font-syne font-bold uppercase tracking-widest -rotate-2">
            TUZÖ 5.2.1 Sayısal Akıl Yürütme
          </div>

          <motion.button
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            className="w-full sm:w-auto px-10 py-5 bg-cyber-yellow text-black font-syne font-black text-xl uppercase tracking-widest border-4 border-black shadow-[8px_8px_0_#000] rounded-2xl hover:-translate-y-1 hover:shadow-[12px_12px_0_#000] active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-3 mx-auto group"
          >
            <div className="flex items-center gap-3">
              <Play size={24} className="fill-black group-hover:scale-110 transition-transform" />
              <span>Başla</span>
            </div>
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-slate-900 transition-colors duration-300 flex flex-col text-black dark:text-white relative overflow-hidden font-chivo">
      <div className="relative z-10 p-4 pt-6 sm:pt-20">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            to={backLink}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border-4 border-black rounded-xl shadow-[4px_4px_0_#000] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#000] transition-all font-syne font-bold text-black dark:text-white"
          >
            <ChevronLeft size={20} className="stroke-[3]" />
            <span>{backLabel}</span>
          </Link>
          
          {(phase === "playing" || phase === "feedback") && (
            <motion.div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-center sm:justify-end">
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-cyber-yellow border-4 border-black rounded-xl shadow-[4px_4px_0_#000] -rotate-2">
                <Star className="text-black fill-black drop-shadow-sm" size={18} />
                <span className="font-syne font-black text-black">{score}</span>
              </div>
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-cyber-pink border-4 border-black rounded-xl shadow-[4px_4px_0_#000] rotate-1">
                {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                  <Heart
                    key={i}
                    size={18}
                    className={
                      i < lives ? "text-black fill-black" : "text-black/20 fill-black/20"
                    }
                    strokeWidth={2.5}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-cyber-blue border-4 border-black rounded-xl shadow-[4px_4px_0_#000] -rotate-1">
                <TimerIcon
                  className={
                    timeLeft < 30 ? "text-white animate-pulse" : "text-white"
                  }
                  size={18}
                />
                <span
                  className={`font-syne font-black ${timeLeft < 30 ? "text-white drop-shadow-[0_0_8px_white]" : "text-white"}`}
                >
                  {formatTime(timeLeft)}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-cyber-green border-4 border-black rounded-xl shadow-[4px_4px_0_#000] rotate-2">
                <Zap className="text-black fill-black/50" size={18} />
                <span className="font-syne font-black text-black whitespace-nowrap">
                  Seviye {level}
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-start sm:justify-center flex-1 p-4 mb-10 w-full max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          {(phase === "playing" || phase === "feedback") && !feedbackState && (
            <motion.div
              key="game"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full flex flex-col items-center"
            >
              <div className="mb-8 bg-white dark:bg-slate-800 px-6 py-3 border-4 border-black shadow-[8px_8px_0_#000] rounded-2xl rotate-1">
                <p className="text-base text-cyber-blue font-syne font-black tracking-wider uppercase text-center">
                  {showErrors
                    ? `İlişki: ${ruleDesc}`
                    : "Tablodaki Boşlukları Doldur"}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 sm:gap-5 p-6 sm:p-8 rounded-[3rem] bg-slate-50 dark:bg-slate-700 border-4 border-black shadow-[16px_16px_0_#000] w-full aspect-square -rotate-1 transition-all">
                {grid.map((row, r) =>
                  row.map((cell, c) => {
                    const isSelected =
                      activeCell?.r === r && activeCell?.c === c;
                    const isWrong =
                      showErrors &&
                      cell.isMissing &&
                      cell.userValue &&
                      parseInt(cell.userValue) !== cell.value;
                    return (
                      <motion.div
                        key={`${r}-${c}`}
                        whileHover={cell.isMissing ? { scale: 1.05 } : {}}
                        whileTap={cell.isMissing ? { scale: 0.95 } : {}}
                        onClick={() => handleCellClick(r, c)}
                        className={`aspect-square rounded-2xl sm:rounded-3xl flex items-center justify-center text-4xl sm:text-5xl font-syne font-black relative transition-all duration-300 border-4 border-black shadow-[4px_4px_0_#000] ${cell.isMissing ? "cursor-pointer" : ""} ${isSelected ? "border-cyber-pink shadow-none translate-y-2 bg-cyber-pink text-white" : isWrong ? "bg-cyber-pink text-black animate-pulse" : cell.isMissing ? "bg-white dark:bg-slate-800 text-cyber-yellow" : "bg-cyber-yellow text-black hover:shadow-none hover:translate-y-1"}`}
                      >
                        {cell.isMissing ? (
                          <span>{cell.userValue || "?"}</span>
                        ) : (
                          <span className="drop-shadow-[2px_2px_0_rgba(0,0,0,0.3)] filter-none">
                            {cell.value}
                          </span>
                        )}
                      </motion.div>
                    );
                  }),
                )}
              </div>

              <div className="w-full mt-10">
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, "DEL", 0, "✓"].map((btn, i) => {
                    if (btn === "DEL")
                      return (
                        <motion.button
                          key={i}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleDelete}
                          className="h-16 sm:h-20 rounded-2xl bg-white dark:bg-slate-800 border-4 border-black text-black dark:text-white flex items-center justify-center shadow-[4px_4px_0_#000] hover:shadow-[6px_6px_0_#000] active:translate-y-2 active:shadow-none transition-all hover:bg-cyber-yellow dark:hover:bg-cyber-yellow"
                        >
                          <Delete size={28} className="stroke-[3]" />
                        </motion.button>
                      );
                    if (btn === "✓")
                      return (
                        <motion.button
                          key={i}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleSubmit}
                          className="h-16 sm:h-20 rounded-2xl bg-cyber-green border-4 border-black text-black flex items-center justify-center shadow-[4px_4px_0_#000] hover:shadow-[6px_6px_0_#000] active:translate-y-2 active:shadow-none transition-all"
                        >
                          <Check size={32} className="stroke-[4]" />
                        </motion.button>
                      );
                    return (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleNumberInput(btn.toString())}
                        className="h-16 sm:h-20 rounded-2xl bg-white dark:bg-slate-800 border-4 border-black text-black dark:text-white text-3xl font-syne font-black shadow-[4px_4px_0_#000] hover:shadow-[6px_6px_0_#000] active:translate-y-2 active:shadow-none transition-all hover:bg-cyber-blue hover:text-white dark:hover:bg-cyber-blue"
                      >
                        {btn}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {feedbackState && (
            <motion.div
              key="feed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#FAF9F6]/80 dark:bg-slate-900/80 backdrop-blur-sm"
            >
              <h2
                className={`text-6xl md:text-8xl font-black font-syne uppercase tracking-tight px-8 py-6 rounded-[2rem] border-4 border-black shadow-[16px_16px_0_#000] ${feedbackState.correct ? "bg-cyber-green text-black rotate-2" : "bg-cyber-pink text-black -rotate-2"}`}
              >
                {feedbackState.correct ? "HARİKA ÇÖZÜM! 🚀" : "YANLIŞ ÇÖZÜM!"}
              </h2>
            </motion.div>
          )}

          {(phase === "game_over" || phase === "victory") && (
            <motion.div
              key="finished"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center max-w-xl w-full"
            >
              <motion.div
                className={`w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 ${phase === "victory" ? "bg-cyber-yellow" : "bg-cyber-pink"} border-8 border-black shadow-[12px_12px_0_#000] rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center rotate-3`}
                animate={phase === "victory" ? { y: [0, -10, 0], rotate: [0, 5, -5, 0] } : { y: [0, -8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Trophy size={48} className="text-black" strokeWidth={2.5} />
              </motion.div>

              <h2 className="text-4xl sm:text-5xl font-syne font-black text-black dark:text-white mb-4 uppercase tracking-tight drop-shadow-sm">
                {phase === "victory" ? "Matematik Dahisi!" : "İyi Deneme!"}
              </h2>

              <p className="text-slate-600 dark:text-slate-300 font-chivo font-medium text-lg mb-8">
                {phase === "victory"
                  ? "Tüm gridleri kusursuz çözdün!"
                  : "Harika bir performans sergiledin!"}
              </p>

              <div className="bg-white dark:bg-slate-800 border-4 border-black shadow-[8px_8px_0_#000] p-6 sm:p-8 rounded-2xl sm:rounded-3xl mb-8 -rotate-1">
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  <div className="text-center bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600">
                    <p className="text-slate-500 dark:text-slate-400 font-syne font-bold uppercase tracking-widest text-sm mb-2">Skor</p>
                    <p className="text-4xl font-black text-cyber-blue drop-shadow-sm">
                      {score}
                    </p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600">
                    <p className="text-slate-500 dark:text-slate-400 font-syne font-bold uppercase tracking-widest text-sm mb-2">Seviye</p>
                    <p className="text-4xl font-black text-cyber-green drop-shadow-sm">
                      {level}/{MAX_LEVEL}
                    </p>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStart}
                className="w-full sm:w-auto px-10 py-5 bg-cyber-pink text-black font-syne font-black text-xl uppercase tracking-widest border-4 border-black shadow-[8px_8px_0_#000] rounded-2xl hover:-translate-y-1 hover:shadow-[12px_12px_0_#000] active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-3 mx-auto mb-6 group"
              >
                <div className="flex items-center gap-3">
                  <RotateCcw size={24} className="stroke-[3] group-hover:-rotate-180 transition-transform duration-500" />
                  <span>Tekrar Oyna</span>
                </div>
              </motion.button>

              <Link
                to={backLink}
                className="inline-block text-slate-500 hover:text-black dark:hover:text-white font-syne font-bold uppercase tracking-widest transition-colors py-2"
              >
                {location.state?.arcadeMode ? "Bilsem Zeka" : "Geri Dön"}
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
export default MathGridGame;
"""

new_content = '\n'.join(lines[:start_idx]) + '\n' + new_code

with open('src/components/BrainTrainer/MathGridGame.tsx', 'w') as f:
    f.write(new_content)
print("Updated successfully!")
