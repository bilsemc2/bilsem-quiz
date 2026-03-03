import sys

with open('src/components/BrainTrainer/MindMatchGame.tsx', 'r') as f:
    content = f.read()

# 1. Remove GameFeedbackBanner import
content = content.replace('import GameFeedbackBanner from "./shared/GameFeedbackBanner";\n', '')

# 2. Update getCardStyle to tactile cyber-pop
old_getCardStyle = """  const getCardStyle = (item: PuzzleItem) => {
    const isSelected = selectedIds.has(item.id);
    const isRevealed = phase === "checking" || phase === "feedback";
    if (isRevealed) {
      if (item.isMatch && isSelected) {
        return {
          bg: "linear-gradient(135deg, #34D399 0%, #10B981 100%)",
          shadow:
            "inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.3), 0 0 20px rgba(52, 211, 153, 0.4)",
          border: "border-emerald-400",
          ring: "ring-2 ring-emerald-400/60",
        };
      }
      if (item.isMatch && !isSelected) {
        return {
          bg: "linear-gradient(135deg, rgba(52,211,153,0.3) 0%, rgba(16,185,129,0.2) 100%)",
          shadow:
            "inset 0 -3px 6px rgba(0,0,0,0.2), inset 0 3px 6px rgba(255,255,255,0.1)",
          border: "border-emerald-500/50",
          ring: "ring-1 ring-emerald-400/30",
        };
      }
      if (!item.isMatch && isSelected) {
        return {
          bg: "linear-gradient(135deg, rgba(239,68,68,0.4) 0%, rgba(220,38,38,0.3) 100%)",
          shadow:
            "inset 0 -3px 6px rgba(0,0,0,0.2), inset 0 3px 6px rgba(255,255,255,0.1)",
          border: "border-red-400",
          ring: "ring-2 ring-red-400/60",
        };
      }
      return {
        bg: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
        shadow:
          "inset 0 -3px 6px rgba(0,0,0,0.2), inset 0 3px 6px rgba(255,255,255,0.05)",
        border: "border-white/10",
        ring: "",
      };
    }
    if (isSelected) {
      return {
        bg: "linear-gradient(135deg, #818CF8 0%, #A78BFA 100%)",
        shadow:
          "inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.3), 0 0 30px rgba(129, 140, 248, 0.6)",
        border: "border-indigo-400",
        ring: "ring-2 ring-indigo-400/60",
      };
    }
    return {
      bg: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
      shadow:
        "inset 0 -3px 6px rgba(0,0,0,0.2), inset 0 3px 6px rgba(255,255,255,0.1)",
      border: "border-white/20",
      ring: "",
    };
  };"""

new_getCardStyle = """  const getCardStyle = (item: PuzzleItem) => {
    const isSelected = selectedIds.has(item.id);
    const isRevealed = phase === "checking" || phase === "feedback";
    if (isRevealed) {
      if (item.isMatch && isSelected) {
        return {
          bg: "var(--cyber-green, #10B981)",
          shadow: "shadow-none translate-y-2",
          border: "border-4 border-black",
          text: "text-black",
          ring: "",
        };
      }
      if (item.isMatch && !isSelected) {
        return {
          bg: "var(--cyber-blue, #3B82F6)",
          shadow: "shadow-[6px_6px_0_#000] opacity-50",
          border: "border-4 border-black border-dashed",
          text: "text-black dark:text-white",
          ring: "",
        };
      }
      if (!item.isMatch && isSelected) {
        return {
          bg: "var(--cyber-pink, #EC4899)",
          shadow: "shadow-none translate-y-2 animate-pulse",
          border: "border-4 border-black",
          text: "text-black",
          ring: "",
        };
      }
      return {
        bg: "white",
        shadow: "shadow-[4px_4px_0_#000] opacity-30",
        border: "border-4 border-black",
        text: "text-black",
        ring: "",
      };
    }
    if (isSelected) {
      return {
        bg: "var(--cyber-yellow, #FBBF24)",
        shadow: "shadow-[4px_4px_0_#000] translate-y-1",
        border: "border-4 border-black",
        text: "text-black",
        ring: "",
      };
    }
    return {
      bg: "white",
      shadow: "shadow-[8px_8px_0_#000]",
      border: "border-4 border-black",
      text: "text-slate-800",
      ring: "",
    };
  };"""

content = content.replace(old_getCardStyle, new_getCardStyle)

# 3. Replace the entire JSX block
lines = content.split('\n')
start_idx = -1
for i, line in enumerate(lines):
    if line.strip() == 'return (' and "bg-gradient-to-br" in lines[i+1]:
        start_idx = i
        break

if start_idx == -1:
    print("Could not find JSX start")
    sys.exit(1)

new_jsx = """  if (phase === "welcome") {
    return (
      <div className="min-h-screen bg-[#FAF9F6] dark:bg-slate-900 transition-colors duration-300 flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden relative">
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
              className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 bg-cyber-pink border-8 border-black shadow-[8px_8px_0_#000] rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center -rotate-3"
              animate={{ y: [0, -8, 0], rotate: [-3, 2, -3] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Puzzle size={56} className="text-black" strokeWidth={2.5} />
            </motion.div>

            <h1 className="text-4xl sm:text-5xl font-syne font-black mb-4 uppercase text-black dark:text-white tracking-tight drop-shadow-sm">
              Zihin Eşleştirme
            </h1>

            <p className="text-slate-600 dark:text-slate-300 font-chivo font-medium mb-8 text-base sm:text-lg">
              Kategoriye ait tüm öğeleri bul ve seç! Kalıbı çöz, eşleşmeyenleri ayır.
            </p>

            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-5 mb-8 border-4 border-black text-left -rotate-1 shadow-[8px_8px_0_#000]">
              <h3 className="text-xl font-syne font-black text-cyber-blue mb-4 flex items-center gap-2 uppercase">
                <Eye size={24} className="stroke-[3]" /> Nasıl Oynanır?
              </h3>
              <ul className="space-y-4 text-sm sm:text-base font-chivo font-bold text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-cyber-yellow text-black border-2 border-black rounded-lg flex items-center justify-center font-syne font-black text-sm shadow-[2px_2px_0_#000] rotate-2">
                    1
                  </span>
                  <span>Kategori ismine göre doğru öğeleri <strong>bul</strong></span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-cyber-green text-black border-2 border-black rounded-lg flex items-center justify-center font-syne font-black text-sm shadow-[2px_2px_0_#000] -rotate-3">
                    2
                  </span>
                  <span>Hepsini seçince <strong>Kontrol Et</strong>'e tıkla</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-cyber-pink text-black border-2 border-black rounded-lg flex items-center justify-center font-syne font-black text-sm shadow-[2px_2px_0_#000] rotate-1">
                    3
                  </span>
                  <span>Yanlış seçimler can götürür, <strong>dikkatli ol!</strong></span>
                </li>
              </ul>
            </div>

            <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-cyber-blue border-2 border-black text-white rounded-xl shadow-[4px_4px_0_#000] rotate-2">
              <span className="text-xs font-syne font-black uppercase tracking-widest">
                TUZÖ 5.5.4 Kategori Analizi
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
    <div className="min-h-[100dvh] bg-[#FAF9F6] dark:bg-slate-900 transition-colors duration-300 flex flex-col font-chivo tracking-tight">
      <div className="relative z-10 p-4 pt-6 sm:pt-20">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            to={backLink}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border-4 border-black rounded-xl shadow-[4px_4px_0_#000] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#000] transition-all font-syne font-bold text-black dark:text-white"
          >
            <ChevronLeft size={20} className="stroke-[3]" />
            <span>{backLabel}</span>
          </Link>
          
          {phase !== "game_over" && phase !== "victory" && (
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-center sm:justify-end">
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-cyber-yellow border-4 border-black rounded-xl shadow-[4px_4px_0_#000] rotate-1">
                <Star className="text-black fill-black drop-shadow-sm" size={18} />
                <span className="font-syne font-black text-black">{score}</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-cyber-pink border-4 border-black rounded-xl shadow-[4px_4px_0_#000] -rotate-1">
                {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                  <Heart
                    key={i}
                    size={18}
                    className={i < lives ? "text-black fill-black" : "text-black/20 fill-black/20"}
                    strokeWidth={2.5}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-cyber-blue border-4 border-black rounded-xl shadow-[4px_4px_0_#000] rotate-2">
                <Timer
                  className={timeLeft < 30 ? "text-white animate-pulse" : "text-white"}
                  size={18}
                />
                <span className={`font-syne font-black ${timeLeft < 30 ? "text-white drop-shadow-[0_0_8px_white]" : "text-white"}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-cyber-green border-4 border-black rounded-xl shadow-[4px_4px_0_#000] -rotate-2">
                <Zap className="text-black fill-black/50" size={18} />
                <span className="font-syne font-black text-black text-sm whitespace-nowrap">
                  Seviye {level}/{MAX_LEVEL}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-start sm:justify-center min-h-[calc(100vh-160px)] p-4 flex-1">
        <AnimatePresence mode="wait">
          {(phase === "playing" || phase === "checking") && puzzle && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-2xl flex flex-col items-center"
            >
              <div className="bg-slate-50 dark:bg-slate-800 rounded-[2rem] p-6 mb-8 border-4 border-black text-center shadow-[12px_12px_0_#000] -rotate-1 inline-block">
                <h2 className="text-sm font-syne font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
                  Kategori
                </h2>
                <div className="inline-block bg-cyber-blue text-white px-8 py-4 rounded-xl text-3xl font-syne font-black border-4 border-black shadow-[4px_4px_0_#000] rotate-2 tracking-tight">
                  {puzzle.category}
                </div>
                <p className="mt-6 text-slate-600 dark:text-slate-300 font-chivo font-medium text-base">
                  Bu kategoriye ait <strong className="text-black dark:text-white font-black">{puzzle.items.filter((i) => i.isMatch).length}</strong> öğeyi bul
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8 w-full">
                {puzzle.items.map((item, idx) => {
                  const style = getCardStyle(item);
                  const isSelected = selectedIds.has(item.id);
                  return (
                    <motion.button
                      key={item.id}
                      whileHover={phase === "playing" ? { scale: 1.05, y: -4 } : {}}
                      whileTap={phase === "playing" ? { scale: 0.95 } : {}}
                      onClick={() => toggleCard(item.id)}
                      disabled={phase !== "playing"}
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: idx % 2 === 0 ? 1 : -1 }}
                      transition={{ delay: idx * 0.05, type: 'spring', stiffness: 200 }}
                      className={`relative aspect-square rounded-[2rem] flex flex-col items-center justify-center p-2 sm:p-4 transition-all duration-200 ${style.border} ${style.bg} ${style.shadow}`}
                      style={{
                        backgroundColor: style.bg.startsWith('var') ? style.bg : undefined,
                      }}
                    >
                      <span className="text-4xl sm:text-6xl select-none mb-2 drop-shadow-md">
                        {item.emoji}
                      </span>
                      <span className={`text-xs sm:text-sm font-syne font-bold font-black text-center leading-tight ${style.text}`}>
                        {item.name}
                      </span>
                      {isSelected && phase === "playing" && (
                        <div className="absolute -top-3 -right-3 w-8 h-8 bg-cyber-green border-2 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0_#000] rotate-6 z-10">
                          <Check size={16} className="text-black stroke-[3]" />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {phase === "playing" && (
                <motion.button
                  whileHover={selectedIds.size > 0 ? { scale: 1.05, y: -4 } : {}}
                  whileTap={selectedIds.size > 0 ? { scale: 0.95 } : {}}
                  onClick={checkAnswer}
                  disabled={selectedIds.size === 0}
                  className={`w-full max-w-sm py-5 rounded-2xl font-syne font-black text-xl uppercase tracking-widest transition-all border-4 flex items-center justify-center gap-3 ${
                    selectedIds.size > 0
                      ? "bg-cyber-yellow text-black border-black shadow-[8px_8px_0_#000] hover:shadow-[12px_12px_0_#000] z-20"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-300 dark:border-slate-700 shadow-none cursor-not-allowed"
                  }`}
                >
                  <CheckCircle2 size={24} className={selectedIds.size > 0 ? "stroke-[3]" : ""} />
                  <span>Kontrol Et ({selectedIds.size})</span>
                </motion.button>
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
                {feedbackState.correct ? "HARİKA! ✨" : "HATA YAPILDI!"}
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
                className={`w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 border-8 border-black shadow-[12px_12px_0_#000] rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center ${phase === 'victory' ? 'bg-cyber-yellow -rotate-3' : 'bg-cyber-pink rotate-3'}`}
                animate={phase === 'victory' ? { y: [0, -10, 0], rotate: [0, 5, -5, 0] } : { y: [0, -8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Trophy size={48} className="text-black" strokeWidth={2.5} />
              </motion.div>
              
              <h2 className="text-4xl sm:text-5xl font-syne font-black text-black dark:text-white mb-4 uppercase tracking-tight drop-shadow-sm">
                {phase === "victory" ? "Zihin Ustası!" : "Oyun Bitti!"}
              </h2>
              <p className="text-slate-600 dark:text-slate-300 font-chivo font-medium text-lg mb-8">
                {phase === "victory"
                  ? `Tüm ${MAX_LEVEL} seviyeyi başarıyla tamamladın!`
                  : level >= 5
                    ? "Harika kategori analizi, ama daha iyi olabilir!"
                    : "Kategorilere daha dikkatli bakmalısın!"}
              </p>

              <div className="bg-white dark:bg-slate-800 border-4 border-black shadow-[8px_8px_0_#000] p-6 sm:p-8 rounded-2xl sm:rounded-3xl mb-8 -rotate-1">
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  <div className="text-center bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600">
                    <p className="text-slate-500 dark:text-slate-400 font-syne font-bold uppercase tracking-widest text-xs sm:text-sm mb-2">Skor</p>
                    <p className="text-3xl sm:text-4xl font-black text-cyber-blue drop-shadow-sm">{score}</p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600">
                    <p className="text-slate-500 dark:text-slate-400 font-syne font-bold uppercase tracking-widest text-xs sm:text-sm mb-2">Seviye</p>
                    <p className="text-3xl sm:text-4xl font-black text-cyber-green drop-shadow-sm">
                      {level}/{MAX_LEVEL}
                    </p>
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

export default MindMatchGame;
"""

new_content = '\n'.join(lines[:start_idx]) + '\n' + new_jsx

with open('src/components/BrainTrainer/MindMatchGame.tsx', 'w') as f:
    f.write(new_content)
    
print("Successfully processed MindMatchGame.tsx")
