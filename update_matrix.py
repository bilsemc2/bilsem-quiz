import sys

with open('src/components/BrainTrainer/MatrixEchoGame.tsx', 'r') as f:
    content = f.read()

content = content.replace('import GameFeedbackBanner from "./shared/GameFeedbackBanner";\n', '')

lines = content.split('\n')

start_idx = -1
for i, line in enumerate(lines):
    if line.strip() == 'if (phase === "welcome") {':
        start_idx = i
        break

if start_idx == -1:
    print("Could not find phase === 'welcome'")
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
            Matris Yankısı
          </h1>

          <p className="text-slate-600 dark:text-slate-300 font-chivo font-medium mb-8 text-base sm:text-lg max-w-md mx-auto">
            3x3 matristeki sayıları ezberle, kutular kapandıktan sonra sorulan soruları doğru cevapla!
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
                <span className="pt-1">Matristeki <strong>sayıların yerlerini ezberle</strong></span>
              </li>
              <li className="flex gap-4 items-start">
                <span className="w-8 h-8 shrink-0 bg-cyber-green border-2 border-black shadow-[2px_2px_0_#000] rounded-xl flex items-center justify-center font-syne font-black text-black text-sm rotate-3">
                  2
                </span>
                <span className="pt-1">Sayılar gizlendikten sonra gelen <strong>soruyu oku</strong></span>
              </li>
              <li className="flex gap-4 items-start">
                <span className="w-8 h-8 shrink-0 bg-cyber-pink border-2 border-black shadow-[2px_2px_0_#000] rounded-xl flex items-center justify-center font-syne font-black text-black text-sm -rotate-6">
                  3
                </span>
                <span className="pt-1">Doğru seçeneği işaretleyerek <strong>puanları topla</strong></span>
              </li>
            </ul>
          </div>

          <div className="bg-cyber-blue text-white text-xs px-4 py-2 rounded-xl mb-8 inline-block border-2 border-black shadow-[4px_4px_0_#000] font-syne font-bold uppercase tracking-widest -rotate-2">
            TUZÖ 5.9.2 Görsel Çalışma Belleği
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
          
          {phase !== "game_over" && phase !== "victory" && (
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

      <div className="relative z-10 flex flex-col items-center justify-start sm:justify-center flex-1 p-4 mb-10 w-full max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {(phase === "memorize" || phase === "hidden" || phase === "question" || phase === "feedback") && !feedbackState && (
            <motion.div
              key="game"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex flex-col items-center gap-8 w-full"
            >
              <div className={`bg-white dark:bg-slate-800 rounded-[3rem] p-6 sm:p-10 border-4 border-black shadow-[16px_16px_0_#000] flex flex-col items-center gap-8 transition-transform duration-500 ${phase === 'memorize' ? 'rotate-1' : phase === 'question' ? '-rotate-1' : ''}`}>
                
                <div className="text-center w-full">
                  <h2 className={`text-xl sm:text-2xl font-black font-syne uppercase tracking-widest px-6 py-3 rounded-2xl border-4 border-black inline-block shadow-[4px_4px_0_#000] ${phase === 'memorize' ? 'bg-cyber-blue text-white rotate-2' : phase === 'hidden' ? 'bg-cyber-yellow text-black -rotate-2' : 'bg-cyber-pink text-black rotate-1'}`}>
                    {phase === "memorize" ? "SAYILARI EZBERLE" : phase === "hidden" ? "HAZIR OL..." : "CEVAPLA!"}
                  </h2>
                </div>

                <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full aspect-square max-w-[320px] mx-auto p-4 sm:p-6 bg-slate-50 dark:bg-slate-700 border-4 border-black rounded-[2rem]">
                  {Array.from({ length: 9 }).map((_, idx) => {
                    const cell = cells.find((c) => c.gridIndex === idx);
                    const showN = phase === "memorize" || (phase === "feedback" && feedbackState);
                    return (
                      <div
                        key={idx}
                        className={`aspect-square rounded-[1.5rem] flex items-center justify-center relative border-4 border-black transition-all duration-300 ${cell ? (showN ? "bg-cyber-green text-black shadow-[4px_4px_0_#000]" : "bg-cyber-blue cursor-pointer hover:-translate-y-1 hover:shadow-[6px_6px_0_#000] active:translate-y-0 active:shadow-[2px_2px_0_#000] shadow-[4px_4px_0_#000]") : "bg-slate-200 dark:bg-slate-600 border-2 border-black/50 border-dashed"}`}
                      >
                        {cell && (
                          <span className={`text-3xl sm:text-4xl font-syne font-black ${showN ? "text-black drop-shadow-sm" : "opacity-0"}`}>
                            {showN ? cell.value : ""}
                          </span>
                        )}
                        {!showN && cell && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white font-syne font-bold text-3xl opacity-50">?</span>
                          </div>
                        )}
                        <div className="absolute top-2 right-2 text-xs font-syne font-black text-black/40">
                          {idx + 1}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {(phase === "question" || phase === "feedback") && question && !feedbackState && (
                <div className="w-full flex flex-col gap-6">
                  <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 text-center border-4 border-black shadow-[8px_8px_0_#000] -rotate-1">
                    <h3 className="text-xl sm:text-2xl font-syne font-black tracking-tight">{question.text}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    {question.options.map((opt, i) => {
                      return (
                        <motion.button
                          key={i}
                          whileHover={{ scale: 1.02, y: -4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleAnswer(opt)}
                          style={i % 2 === 0 ? { transform: 'rotate(-1deg)' } : { transform: 'rotate(1deg)' }}
                          className="py-6 text-3xl font-syne font-black rounded-2xl border-4 border-black transition-all duration-300 bg-cyber-yellow text-black shadow-[8px_8px_0_#000] hover:shadow-[12px_12px_0_#000] active:translate-y-2 active:shadow-none"
                        >
                          {opt}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}
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
                {feedbackState.correct ? "MUHTEŞEM! ✨" : "YANLIŞ YANIT!"}
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
                {phase === "victory" || level >= 5 ? "Matris Dehası!" : "İyi Deneme!"}
              </h2>

              <p className="text-slate-600 dark:text-slate-300 font-chivo font-medium text-lg mb-8">
                {phase === "victory" || level >= 5
                  ? "Hafıza ve odaklanma yeteneğin gerçekten mükemmel!"
                  : "Daha fazla pratikle görsel belleğini güçlendirebilirsin."}
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
export default MatrixEchoGame;
"""

new_content = '\n'.join(lines[:start_idx]) + '\n' + new_code

with open('src/components/BrainTrainer/MatrixEchoGame.tsx', 'w') as f:
    f.write(new_content)
print("Updated successfully!")
