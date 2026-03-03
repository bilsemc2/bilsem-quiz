import sys

with open('src/components/BrainTrainer/MatrixPuzzleGame.tsx', 'r') as f:
    content = f.read()

content = content.replace('import GameFeedbackBanner from "./shared/GameFeedbackBanner";\n', '')

lines = content.split('\n')

start_idx = -1
for i, line in enumerate(lines):
    if line.strip() == 'return (':
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
            Matris Bulmaca
          </h1>

          <p className="text-slate-600 dark:text-slate-300 font-chivo font-medium mb-8 text-base sm:text-lg max-w-md mx-auto">
            3x3 ızgaradaki deseni analiz et ve gizli hücreyi bul! Her satırda belirli bir kural var.
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
                <span className="pt-1">Satır ve sütunlardaki <strong>değişim kuralını belirle</strong></span>
              </li>
              <li className="flex gap-4 items-start">
                <span className="w-8 h-8 shrink-0 bg-cyber-green border-2 border-black shadow-[2px_2px_0_#000] rounded-xl flex items-center justify-center font-syne font-black text-black text-sm rotate-3">
                  2
                </span>
                <span className="pt-1">Soru işareti yerine gelecek <strong>doğru şekli seç</strong></span>
              </li>
              <li className="flex gap-4 items-start">
                <span className="w-8 h-8 shrink-0 bg-cyber-pink border-2 border-black shadow-[2px_2px_0_#000] rounded-xl flex items-center justify-center font-syne font-black text-black text-sm -rotate-6">
                  3
                </span>
                <span className="pt-1">Yanlış seçimler can götürür, <strong>dikkatli ol!</strong></span>
              </li>
            </ul>
          </div>

          <div className="bg-cyber-blue text-white text-xs px-4 py-2 rounded-xl mb-8 inline-block border-2 border-black shadow-[4px_4px_0_#000] font-syne font-bold uppercase tracking-widest -rotate-2">
            TUZÖ 5.5.2 Kural Çıkarsama
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
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-slate-900 transition-colors duration-300 flex flex-col text-black dark:text-white relative overflow-hidden font-chivo tracking-tight">
      <div className="relative z-10 p-4 pt-6 sm:pt-20">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            to={backLink}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border-4 border-black rounded-xl shadow-[4px_4px_0_#000] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#000] transition-all font-syne font-bold text-black dark:text-white"
          >
            <ChevronLeft size={20} className="stroke-[3]" />
            <span>{backLabel}</span>
          </Link>
          
          {phase !== "game_over" && phase !== "victory" && phase !== "review" && (
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

      <div className="relative z-10 flex flex-col items-center justify-start sm:justify-center flex-1 p-4 mb-10 w-full max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {(phase === "playing" || phase === "feedback") && !feedbackState && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center"
            >
              <div className="flex justify-center mb-10 w-full max-w-lg">
                <div
                  className="grid grid-cols-3 gap-3 sm:gap-4 p-4 sm:p-6 bg-slate-50 dark:bg-slate-700 rounded-[3rem] border-4 border-black shadow-[16px_16px_0_#000] w-full aspect-square rotate-1"
                >
                  {grid.map((row, rIdx) =>
                    row.map((cell, cIdx) => (
                      <motion.div
                        key={`${rIdx}-${cIdx}`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: (rIdx * 3 + cIdx) * 0.05 }}
                        className={`aspect-square flex items-center justify-center border-4 border-black shadow-[4px_4px_0_#000] rounded-2xl ${cell.isHidden ? "bg-white dark:bg-slate-800" : "bg-white dark:bg-slate-800"}`}
                      >
                        {cell.isHidden ? (
                          <span className="text-3xl sm:text-5xl font-syne font-black text-cyber-pink drop-shadow-[2px_2px_0_#000]">?</span>
                        ) : (
                          <ShapeRenderer
                            shape={cell.shape}
                            size={90}
                            isHidden={cell.isHidden}
                          />
                        )}
                      </motion.div>
                    )),
                  )}
                </div>
              </div>

              <div className="mb-8 bg-white dark:bg-slate-800 px-6 py-3 border-4 border-black shadow-[8px_8px_0_#000] rounded-2xl -rotate-1">
                <p className="text-base text-cyber-blue font-syne font-black tracking-wider uppercase text-center">
                  Gizli hücredeki şekil hangisi?
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 w-full max-w-2xl mx-auto">
                {options.map((option, idx) => {
                  const isSelected = selectedOption === option.id;
                  const showResult = selectedOption !== null;
                  return (
                    <motion.button
                      key={option.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={!showResult ? { scale: 1.05, y: -4 } : {}}
                      whileTap={!showResult ? { scale: 0.95 } : {}}
                      onClick={() => handleOptionSelect(option)}
                      disabled={showResult}
                      style={idx % 2 === 0 ? { transform: 'rotate(-2deg)' } : { transform: 'rotate(2deg)' }}
                      className={`aspect-square w-[72px] sm:w-[88px] flex items-center justify-center p-2 rounded-[1.5rem] sm:rounded-[2rem] border-4 border-black transition-all duration-300 flex-shrink-0 ${isSelected ? (option.isCorrect ? "bg-cyber-green text-black translate-y-2 shadow-none" : "bg-cyber-pink text-black animate-pulse translate-y-2 shadow-none") : showResult && option.isCorrect ? "bg-cyber-green text-black translate-y-2 shadow-none" : "bg-white dark:bg-slate-700 shadow-[6px_6px_0_#000] hover:shadow-[12px_12px_0_#000] hover:bg-cyber-yellow dark:hover:bg-cyber-yellow active:translate-y-2 active:shadow-none"}`}
                    >
                      <ShapeRenderer shape={option.shape} size={60} />
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
                {feedbackState.correct ? "MÜKEMMEL TESPİT! ✨" : "YANLIŞ SEÇİM!"}
              </h2>
            </motion.div>
          )}

          {phase === "game_over" && (
            <motion.div
              key="game_over"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center max-w-xl w-full"
            >
              <motion.div
                className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 bg-cyber-pink border-8 border-black shadow-[12px_12px_0_#000] rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center rotate-3"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <XCircle size={48} className="text-black" strokeWidth={2.5} />
              </motion.div>

              <h2 className="text-4xl sm:text-5xl font-syne font-black text-black dark:text-white mb-4 uppercase tracking-tight drop-shadow-sm">
                Oyun Bitti!
              </h2>

              <div className="bg-white dark:bg-slate-800 border-4 border-black shadow-[8px_8px_0_#000] p-6 sm:p-8 rounded-2xl sm:rounded-3xl mb-8 -rotate-1">
                <div className="grid grid-cols-3 gap-4 sm:gap-6">
                  <div className="text-center bg-slate-50 dark:bg-slate-700/50 p-3 sm:p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600">
                    <p className="text-slate-500 dark:text-slate-400 font-syne font-bold uppercase tracking-widest text-xs sm:text-sm mb-2">Skor</p>
                    <p className="text-3xl sm:text-4xl font-black text-cyber-blue drop-shadow-sm">{score}</p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-700/50 p-3 sm:p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600">
                    <p className="text-slate-500 dark:text-slate-400 font-syne font-bold uppercase tracking-widest text-xs sm:text-sm mb-2">Doğru</p>
                    <p className="text-3xl sm:text-4xl font-black text-cyber-green drop-shadow-sm">
                      {questionHistory.filter((q) => q.isCorrect).length}
                    </p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-700/50 p-3 sm:p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600">
                    <p className="text-slate-500 dark:text-slate-400 font-syne font-bold uppercase tracking-widest text-xs sm:text-sm mb-2">Yanlış</p>
                    <p className="text-3xl sm:text-4xl font-black text-cyber-pink drop-shadow-sm">
                      {questionHistory.filter((q) => !q.isCorrect).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                {questionHistory.some((q) => !q.isCorrect) && (
                  <motion.button
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPhase("review")}
                    className="flex-1 sm:flex-none px-6 py-4 bg-cyber-blue text-white font-syne font-black text-lg sm:text-xl uppercase tracking-widest border-4 border-black shadow-[8px_8px_0_#000] rounded-2xl hover:-translate-y-1 hover:shadow-[12px_12px_0_#000] active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={24} className="stroke-[3]" />
                      <span className="whitespace-nowrap">Hata Analizi</span>
                    </div>
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStart}
                  className="flex-1 sm:flex-none px-6 py-4 bg-cyber-yellow text-black font-syne font-black text-lg sm:text-xl uppercase tracking-widest border-4 border-black shadow-[8px_8px_0_#000] rounded-2xl hover:-translate-y-1 hover:shadow-[12px_12px_0_#000] active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-3 group"
                >
                  <div className="flex items-center gap-3">
                    <RotateCcw size={24} className="stroke-[3] group-hover:-rotate-180 transition-transform duration-500" />
                    <span className="whitespace-nowrap">Tekrar Dene</span>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          )}

          {phase === "victory" && (
             <motion.div
              key="victory"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center max-w-xl w-full"
            >
              <motion.div
                className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 bg-cyber-yellow border-8 border-black shadow-[12px_12px_0_#000] rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center rotate-3"
                animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Trophy size={48} className="text-black" strokeWidth={2.5} />
              </motion.div>

              <h2 className="text-4xl sm:text-5xl font-syne font-black text-black dark:text-white mb-4 uppercase tracking-tight drop-shadow-sm">
                Matris Şampiyonu!
              </h2>

               <div className="bg-white dark:bg-slate-800 border-4 border-black shadow-[8px_8px_0_#000] p-6 sm:p-8 rounded-2xl sm:rounded-3xl mb-8 -rotate-1">
                 <div className="text-center bg-slate-50 dark:bg-slate-700/50 p-6 rounded-xl border-2 border-slate-200 dark:border-slate-600">
                    <p className="text-slate-500 dark:text-slate-400 font-syne font-bold uppercase tracking-widest text-sm mb-2">Toplam Skor</p>
                    <p className="text-5xl font-black text-cyber-blue drop-shadow-sm">
                      {score}
                    </p>
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

          {phase === "review" && (
            <motion.div
              key="review"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-4xl text-center"
            >
              <h2 className="text-3xl font-syne font-black text-black dark:text-white mb-6 uppercase tracking-widest inline-block px-8 py-4 bg-white dark:bg-slate-800 border-4 border-black shadow-[8px_8px_0_#000] rounded-[2rem] rotate-1">
                SORU ANALİZİ 🔍
              </h2>
              <div className="space-y-8 max-h-[60vh] overflow-y-auto px-4 py-6 custom-scrollbar pr-4">
                {questionHistory
                  .filter((q) => !q.isCorrect)
                  .map((q, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 sm:p-8 border-4 border-black shadow-[12px_12px_0_#000] relative"
                    >
                      <div className="absolute top-0 right-6 -translate-y-1/2">
                        <span className="px-4 py-2 bg-cyber-blue text-white rounded-xl text-sm font-syne font-black border-4 border-black shadow-[4px_4px_0_#000]">
                          Seviye {q.level}
                        </span>
                      </div>
                      
                      <div className="text-left mb-6 pt-4">
                        <span className="text-sm font-syne font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                          {q.ruleName}
                        </span>
                      </div>
                      
                      <div className="flex flex-col md:flex-row items-center gap-8 mb-6">
                        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-3xl border-4 border-black">
                          {q.grid.map((row, rIdx) =>
                            row.map((cell, cIdx) => (
                              <div
                                key={`${rIdx}-${cIdx}`}
                                className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center border-2 border-black/20 dark:border-white/10 rounded-2xl bg-white dark:bg-slate-800 shadow-sm"
                              >
                                {cell.isHidden ? (
                                   <span className="text-2xl font-syne font-black text-cyber-pink drop-shadow-[2px_2px_0_#000]">?</span>
                                ) : (
                                  <ShapeRenderer
                                    shape={cell.shape}
                                    size={48}
                                    isHidden={cell.isHidden}
                                  />
                                )}
                              </div>
                            )),
                          )}
                        </div>
                        
                        <div className="flex-1 w-full bg-slate-50 dark:bg-slate-800 border-4 border-black border-l-8 border-l-cyber-blue p-6 rounded-2xl text-left shadow-[8px_8px_0_#000]">
                          <p className="text-xs font-syne font-black text-cyber-blue uppercase tracking-widest mb-2">
                            Düşünme Yolu:
                          </p>
                          <p className="text-base font-chivo font-medium text-slate-700 dark:text-slate-200">
                            {q.ruleDescription}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6 sm:gap-8">
                        <div className="text-center bg-cyber-pink/20 dark:bg-cyber-pink/10 rounded-3xl p-6 border-4 border-cyber-pink border-dashed">
                          <p className="text-sm font-syne font-black text-cyber-pink uppercase tracking-widest mb-4">
                            Senin Seçimin
                          </p>
                          <div className="inline-block p-4 bg-white dark:bg-slate-800 rounded-[2rem] border-4 border-black shadow-[6px_6px_0_#000]">
                            <ShapeRenderer shape={q.selectedAnswer} size={60} />
                          </div>
                        </div>
                        <div className="text-center bg-cyber-green/20 dark:bg-cyber-green/10 rounded-3xl p-6 border-4 border-cyber-green border-dashed">
                          <p className="text-sm font-syne font-black text-cyber-green uppercase tracking-widest mb-4">
                            Doğru Şekil
                          </p>
                          <div className="inline-block p-4 bg-white dark:bg-slate-800 rounded-[2rem] border-4 border-black shadow-[6px_6px_0_#000]">
                            <ShapeRenderer shape={q.correctAnswer} size={60} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
              <div className="flex justify-center gap-4 mt-10">
                <motion.button
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPhase("game_over")}
                  className="px-8 py-5 bg-white dark:bg-slate-800 text-black dark:text-white rounded-2xl font-syne font-black flex items-center gap-2 border-4 border-black shadow-[8px_8px_0_#000] hover:shadow-[12px_12px_0_#000] active:translate-y-2 active:shadow-none transition-all uppercase tracking-widest"
                >
                  <ChevronLeft size={24} className="stroke-[3]" /> Geri
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStart}
                  className="px-8 py-5 bg-cyber-yellow text-black border-4 border-black rounded-2xl font-syne font-black shadow-[8px_8px_0_#000] hover:shadow-[12px_12px_0_#000] active:translate-y-2 active:shadow-none transition-all uppercase tracking-widest flex items-center gap-3"
                >
                  <RotateCcw size={24} className="stroke-[3]"/>
                  Tekrar Dene
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MatrixPuzzleGame;
"""

new_content = '\n'.join(lines[:start_idx]) + '\n' + new_code

with open('src/components/BrainTrainer/MatrixPuzzleGame.tsx', 'w') as f:
    f.write(new_content)
print("Updated successfully!")
