import re

with open('src/components/BrainTrainer/KnowledgeCardGame.tsx', 'r') as f:
    content = f.read()

# Replace from `if (phase === "welcome") {` to end of file
lines = content.split('\n')
start_idx = -1
for i, line in enumerate(lines):
    if line.strip() == 'if (phase === "welcome") {':
        start_idx = i
        break

new_ui = """  if (phase === "welcome") {
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
            <BookOpen size={52} className="text-black drop-shadow-sm" strokeWidth={2.5} />
          </motion.div>

          <h1 className="text-4xl sm:text-5xl font-syne font-black mb-4 uppercase drop-shadow-sm text-black dark:text-white">
            Bilgi Kartları
          </h1>

          <p className="text-slate-600 dark:text-slate-300 font-chivo font-medium mb-8 text-base sm:text-lg max-w-md mx-auto">
            Genel kültürünü ve kelime dağarcığını test et! Cümlelerdeki eksik kelimeleri bul ve bilgi ustası ol.
          </p>

          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-3xl p-6 sm:p-8 mb-8 text-left border-4 border-black shadow-[8px_8px_0_#000] rotate-1">
            <h3 className="text-xl font-syne font-black text-cyber-blue mb-4 flex items-center gap-2 uppercase tracking-tight">
              <Eye size={24} className="text-cyber-blue" strokeWidth={2.5} /> Nasıl Oynanır?
            </h3>
            <ul className="space-y-4 text-slate-700 dark:text-slate-200 font-chivo font-medium">
              <li className="flex gap-4 items-start">
                <span className="w-8 h-8 shrink-0 bg-cyber-pink border-2 border-black shadow-[2px_2px_0_#000] rounded-xl flex items-center justify-center font-syne font-black text-black text-sm -rotate-3">
                  1
                </span>
                <span className="pt-1">Cümledeki eksik bölümü dikkatle oku</span>
              </li>
              <li className="flex gap-4 items-start">
                <span className="w-8 h-8 shrink-0 bg-cyber-yellow border-2 border-black shadow-[2px_2px_0_#000] rounded-xl flex items-center justify-center font-syne font-black text-black text-sm rotate-3">
                  2
                </span>
                <span className="pt-1">Anlamı tamamlayan doğru kelimeyi seç</span>
              </li>
              <li className="flex gap-4 items-start">
                <span className="w-8 h-8 shrink-0 bg-cyber-green border-2 border-black shadow-[2px_2px_0_#000] rounded-xl flex items-center justify-center font-syne font-black text-black text-sm -rotate-6">
                  3
                </span>
                <span className="pt-1">3 canın bitmeden 20 soruyu başarıyla tamamla!</span>
              </li>
            </ul>
          </div>

          <div className="bg-cyber-blue text-white text-xs px-4 py-2 rounded-xl mb-8 inline-block border-2 border-black shadow-[4px_4px_0_#000] font-syne font-bold uppercase tracking-widest -rotate-2">
            TUZÖ 6.3.1 Genel Bilgi
          </div>

          <motion.button
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            className="w-full sm:w-auto px-10 py-5 bg-cyber-pink text-black font-syne font-black text-xl uppercase tracking-widest border-4 border-black shadow-[8px_8px_0_#000] rounded-2xl hover:-translate-y-1 hover:shadow-[12px_12px_0_#000] active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-3 mx-auto group"
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

  if (phase === "loading")
    return (
      <div className="min-h-screen bg-[#FAF9F6] dark:bg-slate-900 transition-colors duration-300 flex items-center justify-center">
        <Loader2 size={48} className="text-cyber-blue animate-spin" />
      </div>
    );

  if (phase === "error")
    return (
      <div className="min-h-screen bg-[#FAF9F6] dark:bg-slate-900 transition-colors duration-300 flex items-center justify-center text-center p-6">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0_#000]">
          <AlertCircle size={48} className="text-cyber-pink mx-auto mb-4" />
          <h2 className="text-xl font-syne font-black text-black dark:text-white mb-2">Hata Oluştu</h2>
          <p className="text-slate-600 dark:text-slate-300 font-chivo mb-6">{errorMessage}</p>
          <Link
            to={backLink}
            className="px-6 py-3 bg-cyber-pink text-black rounded-xl font-syne font-bold border-2 border-black shadow-[4px_4px_0_#000] inline-block"
          >
            Geri Dön
          </Link>
        </div>
      </div>
    );

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

          {phase === "playing" && (
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
                <BookOpen className="text-black fill-black/50" size={18} />
                <span className="font-syne font-black text-black whitespace-nowrap">
                  {currentIndex + 1}/{MAX_LEVEL}
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-start sm:justify-center flex-1 p-4 mb-10 w-full max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {phase === "playing" && questions[currentIndex] && !feedbackState && (
            <motion.div
              key="game"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full max-w-2xl text-center flex flex-col items-center"
            >
              <div className="w-full mb-6 h-4 sm:h-6 bg-white dark:bg-slate-800 rounded-full border-4 border-black overflow-hidden shadow-[4px_4px_0_#000]">
                <motion.div
                  className="h-full bg-cyber-green border-r-4 border-black"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((currentIndex + 1) / MAX_LEVEL) * 100}%`,
                  }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                />
              </div>

              <div className="w-full p-8 sm:p-10 bg-white dark:bg-slate-800 rounded-[3rem] border-4 border-black shadow-[16px_16px_0_#000] mb-8 rotate-1">
                <p className="text-slate-500 font-syne font-black mb-6 text-base tracking-widest uppercase">
                  Cümleyi Tamamla
                </p>
                <motion.h2
                  key={currentIndex}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-2xl lg:text-3xl font-chivo font-medium leading-relaxed sm:leading-loose text-slate-800 dark:text-slate-100"
                >
                  {questions[currentIndex].displayText
                    .split("_____")
                    .map((p, i, a) => (
                      <React.Fragment key={i}>
                        {p}
                        {i < a.length - 1 && (
                          <span
                            className="inline-block px-3 py-1 rounded-xl mx-2 border-2 border-dashed bg-slate-100 dark:bg-slate-700 border-slate-400 text-slate-400 font-syne font-bold -translate-y-1"
                          >
                            .....
                          </span>
                        )}
                      </React.Fragment>
                    ))}
                </motion.h2>
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                {questions[currentIndex].options.map((opt, i) => {
                  return (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.05, y: -4 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAnswer(opt)}
                      style={i % 2 === 0 ? { transform: 'rotate(-1deg)' } : { transform: 'rotate(1deg)' }}
                      className="p-5 sm:p-6 rounded-3xl flex items-center justify-between transition-all duration-300 border-4 border-black shadow-[8px_8px_0_#000] hover:shadow-[12px_12px_0_#000] hover:-translate-y-1 active:translate-y-2 active:shadow-none bg-slate-50 dark:bg-slate-700 text-black dark:text-white hover:bg-cyber-yellow dark:hover:bg-cyber-yellow group"
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-sm sm:text-base font-syne font-black border-2 border-black group-hover:bg-black group-hover:text-cyber-yellow transition-colors">
                        {String.fromCharCode(65 + i)}
                      </div>
                      <div className="text-right flex-1 pl-4 font-syne font-black tracking-wide text-lg sm:text-xl">
                        {opt}
                      </div>
                    </motion.button>
                  );
                })}
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
                {feedbackState.correct ? "DOĞRU BİLGİ! 📚" : "YANLIŞ CEVAP!"}
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
                {phase === "victory" ? "Bilgi Ustası!" : "İyi Deneme!"}
              </h2>

              <p className="text-slate-600 dark:text-slate-300 font-chivo font-medium text-lg mb-8">
                {phase === "victory"
                  ? "Genel kültür ve dikkat konusunda gerçekten harikasın!"
                  : "Daha fazla kartla kendini geliştirebilirsin."}
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
                    <p className="text-slate-500 dark:text-slate-400 font-syne font-bold uppercase tracking-widest text-sm mb-2">Soru</p>
                    <p className="text-4xl font-black text-cyber-green drop-shadow-sm">
                      {currentIndex + 1}/{MAX_LEVEL}
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
export default KnowledgeCardGame;
"""

new_content = '\n'.join(lines[:start_idx]) + '\n' + new_ui
with open('src/components/BrainTrainer/KnowledgeCardGame.tsx', 'w') as f:
    f.write(new_content)
