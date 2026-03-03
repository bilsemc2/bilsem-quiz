import sys

file_path = 'src/components/BrainTrainer/NBackGame.tsx'

with open(file_path, 'r') as f:
    lines = f.readlines()

new_jsx = """
  if (phase === 'welcome') {
    return (
      <div className="min-h-[100dvh] bg-[#FAF9F6] dark:bg-slate-900 transition-colors duration-300 flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden relative">
        <div className="relative z-10 w-full max-w-xl">
          <div className="w-full flex items-center justify-start mb-6 -ml-2">
            <Link
              to={backLink}
              className="flex items-center gap-2 text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white transition-colors bg-white dark:bg-slate-800 border-4 border-black px-4 py-2 rounded-xl shadow-[4px_4px_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none font-syne font-bold"
            >
              <ChevronLeft size={20} className="stroke-[3]" />
              <span>{backLabel}</span>
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center bg-white dark:bg-slate-800 p-8 rounded-[3rem] border-4 border-black shadow-[12px_12px_0_#000] rotate-1"
          >
            <motion.div
              className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 bg-cyber-pink border-8 border-black shadow-[8px_8px_0_#000] rounded-[2.5rem] flex items-center justify-center -rotate-3"
              animate={{ y: [0, -8, 0], rotate: [-3, 2, -3] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Brain size={56} className="text-black" strokeWidth={2.5} />
            </motion.div>

            <h1 className="text-4xl sm:text-5xl font-syne font-black mb-4 uppercase text-black dark:text-white tracking-tight drop-shadow-sm">
              N-Geri Şifresi
            </h1>

            <p className="text-slate-600 dark:text-slate-300 font-chivo font-medium mb-8 text-base sm:text-lg">
              Şekilleri hatırla ve karşılaştır! Her şekli N adım öncekiyle karşılaştırarak belleğini test et.
            </p>

            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-5 mb-8 border-4 border-black shadow-[8px_8px_0_#000] text-left -rotate-1">
              <h3 className="text-xl font-syne font-black text-cyber-blue mb-4 flex items-center gap-2 uppercase">
                 <Sparkles size={24} className="stroke-[3]" /> Nasıl Oynanır?
              </h3>
              <ul className="space-y-4 text-sm sm:text-base font-chivo font-bold text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-cyber-yellow text-black border-2 border-black rounded-lg flex items-center justify-center font-syne font-black text-sm shadow-[2px_2px_0_#000] rotate-2">
                    1
                  </span>
                  <span>Ekranda beliren şekilleri <strong>sırasıyla takip et</strong></span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-cyber-green text-black border-2 border-black rounded-lg flex items-center justify-center font-syne font-black text-sm shadow-[2px_2px_0_#000] -rotate-3">
                    2
                  </span>
                  <span>Gördüğün şekil <strong>N adım öncekiyle aynı mı?</strong></span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-cyber-pink text-black border-2 border-black rounded-lg flex items-center justify-center font-syne font-black text-sm shadow-[2px_2px_0_#000] rotate-1">
                    3
                  </span>
                  <span>Hızlı ve doğru karar vererek <strong>seviye atla</strong></span>
                </li>
              </ul>
            </div>

            <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-cyber-blue border-2 border-black text-white rounded-xl shadow-[4px_4px_0_#000] rotate-2">
              <span className="text-xs font-syne font-black uppercase tracking-widest">
                TUZÖ 5.9.1 Çalışma Belleği
              </span>
            </div>

            <motion.button
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStart}
              className="w-full sm:w-auto px-10 py-5 bg-cyber-green text-black font-syne font-black text-xl uppercase tracking-widest border-4 border-black shadow-[8px_8px_0_#000] rounded-2xl hover:-translate-y-1 hover:shadow-[12px_12px_0_#000] active:translate-y-2 active:translate-x-[2px] active:shadow-none transition-all flex items-center justify-center gap-3 mx-auto group"
            >
              <Play size={24} className="fill-black group-hover:scale-110 transition-transform" />
              <span>Başla</span>
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#FAF9F6] dark:bg-slate-900 transition-colors duration-300 flex flex-col font-chivo tracking-tight relative overflow-hidden">
      <div className="relative z-10 p-4 pt-6 sm:pt-20">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            to={backLink}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border-4 border-black rounded-xl shadow-[4px_4px_0_#000] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#000] transition-all font-syne font-bold text-black dark:text-white"
          >
            <ChevronLeft size={20} className="stroke-[3]" />
            <span>{backLabel}</span>
          </Link>
          
          {(phase !== 'game_over' && phase !== 'victory') && (
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-center sm:justify-end">
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-slate-800 border-4 border-black rounded-xl shadow-[4px_4px_0_#000] rotate-1">
                <Brain className="text-cyber-blue" size={18} strokeWidth={3} />
                <span className="font-syne font-black text-black dark:text-white">N={nValue}</span>
              </div>
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-cyber-yellow border-4 border-black rounded-xl shadow-[4px_4px_0_#000] -rotate-1">
                <Star className="text-black fill-black drop-shadow-sm" size={18} />
                <span className="font-syne font-black text-black">{score}</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-cyber-pink border-4 border-black rounded-xl shadow-[4px_4px_0_#000] rotate-1">
                {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                  <Heart
                    key={i}
                    size={18}
                    className={i < lives ? "text-black fill-black" : "text-black/20 fill-black/20"}
                    strokeWidth={2.5}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-cyber-blue border-4 border-black rounded-xl shadow-[4px_4px_0_#000] -rotate-2">
                <TimerIcon className={timeLeft < 30 ? "text-white animate-pulse" : "text-white"} size={18} />
                <span className={`font-syne font-black ${timeLeft < 30 ? "text-white drop-shadow-[0_0_8px_white]" : "text-white"}`}>{formatTime(timeLeft)}</span>
              </div>
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-cyber-green border-4 border-black rounded-xl shadow-[4px_4px_0_#000] rotate-2">
                <Zap className="text-black fill-black/50" size={18} />
                <span className="font-syne font-black text-black text-sm whitespace-nowrap">Seviye {level}/{MAX_LEVEL}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center p-4 min-h-[calc(100vh-160px)] flex-1">
        <AnimatePresence mode="wait">
          {(phase === 'playing' || phase === 'feedback') && (
            <motion.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-12 w-full max-w-xl"
            >
              <div className="relative">
                <motion.div
                  className="w-48 h-48 sm:w-64 sm:h-64 rounded-[3rem] flex items-center justify-center relative bg-white dark:bg-slate-800 border-4 border-black shadow-[16px_16px_0_#000] overflow-hidden rotate-1"
                  style={currentShape ? { background: currentShape.color } : {}}
                >
                  <AnimatePresence mode="wait">
                    {currentShape ? (
                      <motion.div
                        key={currentShape.id}
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 1.5, opacity: 0 }}
                        className="text-black drop-shadow-[6px_6px_0_rgba(0,0,0,0.5)]"
                      >
                        {React.cloneElement(currentShape.icon as React.ReactElement, { size: 100, strokeWidth: 3 })}
                      </motion.div>
                    ) : (
                      <RotateCcw size={48} className="text-black/20 animate-spin" strokeWidth={3} />
                    )}
                  </AnimatePresence>
                </motion.div>
                
                {history.length <= nValue && (
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-cyber-yellow border-4 border-black px-4 py-2 rounded-xl shadow-[4px_4px_0_#000] -rotate-2">
                    <p className="text-xs font-syne font-black text-black">Veri Toplanıyor ({history.length}/{nValue + 1})</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full mt-4">
                <motion.button
                  whileHover={history.length > nValue ? { scale: 1.05, y: -4, rotate: -1 } : {}}
                  whileTap={history.length > nValue ? { scale: 0.95 } : {}}
                  disabled={history.length <= nValue || feedbackState !== null}
                  onClick={() => handleDecision(true)}
                  className={`group relative py-6 px-4 rounded-[2rem] flex flex-col items-center gap-4 border-4 transition-all duration-300 ${history.length <= nValue ? 'opacity-50 cursor-not-allowed bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700' : 'bg-cyber-green border-black shadow-[8px_8px_0_#000] hover:shadow-[12px_12px_0_#000]'}`}
                >
                  <div className="w-16 h-16 rounded-2xl bg-white border-4 border-black shadow-[4px_4px_0_#000] flex items-center justify-center text-black group-hover:scale-110 transition-transform rotate-2">
                    <Target size={32} className="stroke-[3]" />
                  </div>
                  <span className="font-syne font-black text-black uppercase tracking-widest text-lg">AYNI</span>
                </motion.button>

                <motion.button
                  whileHover={history.length > nValue ? { scale: 1.05, y: -4, rotate: 1 } : {}}
                  whileTap={history.length > nValue ? { scale: 0.95 } : {}}
                  disabled={history.length <= nValue || feedbackState !== null}
                  onClick={() => handleDecision(false)}
                  className={`group relative py-6 px-4 rounded-[2rem] flex flex-col items-center gap-4 border-4 transition-all duration-300 ${history.length <= nValue ? 'opacity-50 cursor-not-allowed bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700' : 'bg-cyber-pink border-black shadow-[8px_8px_0_#000] hover:shadow-[12px_12px_0_#000]'}`}
                >
                  <div className="w-16 h-16 rounded-2xl bg-white border-4 border-black shadow-[4px_4px_0_#000] flex items-center justify-center text-black group-hover:scale-110 transition-transform -rotate-2">
                    <XCircle size={32} className="stroke-[3]" />
                  </div>
                  <span className="font-syne font-black text-black uppercase tracking-widest text-lg">FARKLI</span>
                </motion.button>
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
                {feedbackState.correct ? "DOĞRU! ✨" : "YANLIŞ!"}
              </h2>
            </motion.div>
          )}

          {(phase === 'game_over' || phase === 'victory') && (
            <motion.div
              key="finished"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center max-w-xl w-full"
            >
              <motion.div
                className={`w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 border-8 border-black shadow-[12px_12px_0_#000] rounded-[2.5rem] flex items-center justify-center ${phase === 'victory' || level >= 5 ? 'bg-cyber-yellow -rotate-3' : 'bg-cyber-pink rotate-3'}`}
                animate={phase === 'victory' || level >= 5 ? { y: [0, -10, 0], rotate: [-3, 2, -3] } : { y: [0, -8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Trophy size={48} className="text-black" strokeWidth={2.5} />
              </motion.div>
              
              <h2 className="text-4xl sm:text-5xl font-syne font-black text-black dark:text-white mb-4 uppercase tracking-tight drop-shadow-sm">
                {phase === 'victory' || level >= 5 ? 'Hafıza Ustası!' : 'Oyun Bitti!'}
              </h2>
              <p className="text-slate-600 dark:text-slate-300 font-chivo font-medium text-lg mb-8">
                {phase === 'victory' || level >= 5 ? 'N-Geri testinde gösterdiğin odaklanma harika!' : 'Daha fazla pratik yapabilirsin.'}
              </p>

              <div className="bg-white dark:bg-slate-800 border-4 border-black shadow-[8px_8px_0_#000] p-6 sm:p-8 rounded-3xl mb-8 -rotate-1">
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  <div className="text-center bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600">
                    <p className="text-slate-500 dark:text-slate-400 font-syne font-bold uppercase tracking-widest text-xs sm:text-sm mb-2">Skor</p>
                    <p className="text-3xl sm:text-4xl font-black text-cyber-blue drop-shadow-sm">{score}</p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600">
                    <p className="text-slate-500 dark:text-slate-400 font-syne font-bold uppercase tracking-widest text-xs sm:text-sm mb-2">Seviye</p>
                    <p className="text-3xl sm:text-4xl font-black text-cyber-green drop-shadow-sm">{level}/{MAX_LEVEL}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStart}
                  className="w-full sm:w-auto px-10 py-5 bg-cyber-pink text-black font-syne font-black text-xl uppercase tracking-widest border-4 border-black shadow-[8px_8px_0_#000] hover:-translate-y-1 hover:shadow-[12px_12px_0_#000] active:translate-y-2 active:translate-x-1 active:shadow-none transition-all flex items-center justify-center gap-3 group"
                >
                  <RotateCcw size={24} className="stroke-[3] group-hover:-rotate-180 transition-transform duration-500" />
                  Tekrar Oyna
                </motion.button>
                <Link
                  to={backLink}
                  className="w-full sm:w-auto px-10 py-5 bg-white dark:bg-slate-800 text-black dark:text-white font-syne font-black text-xl uppercase tracking-widest border-4 border-black shadow-[8px_8px_0_#000] hover:-translate-y-1 hover:shadow-[12px_12px_0_#000] active:translate-y-2 active:translate-x-1 active:shadow-none transition-all text-center"
                >
                  Geri Dön
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
"""

for i, line in enumerate(lines):
    if 'import GameFeedbackBanner' in line:
        lines[i] = ''
    if 'if (phase === \'welcome\') { return (' in line:
        lines[i] = new_jsx + "\n"
        break

with open(file_path, 'w') as f:
    f.writelines(lines)

print("Updated NBackGame successfully!")
