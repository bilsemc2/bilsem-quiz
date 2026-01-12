import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Lock, Zap, ArrowLeft, Sparkles, Target } from 'lucide-react';

interface XPWarningProps {
  requiredXP: number;
  currentXP: number;
  title: string;
  onBack?: () => void;
}

const XPWarning = ({ requiredXP, currentXP, title, onBack }: XPWarningProps) => {
  const progress = Math.min((currentXP / requiredXP) * 100, 100);
  const hasEnoughXP = currentXP >= requiredXP;
  const remainingXP = requiredXP - currentXP;

  if (hasEnoughXP) {
    return null;
  }

  // Motivasyon mesajları
  const getMotivationMessage = () => {
    if (progress >= 75) return "Neredeyse başardın! 🔥";
    if (progress >= 50) return "Yarısını geçtin, devam et! 💪";
    if (progress >= 25) return "İyi gidiyorsun! ⚡";
    return "Macera seni bekliyor! 🚀";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      {/* Arka plan efektleri */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 max-w-md w-full"
      >
        {/* Ana kart */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
          {/* Üst dekoratif çizgi */}
          <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500" />

          <div className="p-8 text-center">
            {/* Kilit ikonu */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="relative mx-auto mb-6"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-full flex items-center justify-center mx-auto">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Lock className="w-8 h-8 text-white" />
                </div>
              </div>
              {/* Pulse efekti */}
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 w-24 h-24 bg-purple-500/20 rounded-full mx-auto"
              />
            </motion.div>

            {/* Başlık */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-white mb-2"
            >
              {title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-white/60 text-sm mb-6"
            >
              Bu özelliği açmak için XP kazanmalısın
            </motion.p>

            {/* Dairesel progress */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="relative w-36 h-36 mx-auto mb-6"
            >
              {/* Arka plan dairesi */}
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="64"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                />
                {/* Progress dairesi */}
                <motion.circle
                  cx="72"
                  cy="72"
                  r="64"
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${progress * 4.02} 402`}
                  initial={{ strokeDasharray: "0 402" }}
                  animate={{ strokeDasharray: `${progress * 4.02} 402` }}
                  transition={{ duration: 1.5, delay: 0.6, ease: "easeOut" }}
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="50%" stopColor="#EC4899" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Merkez metin */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">{Math.round(progress)}%</span>
                <span className="text-xs text-white/60">tamamlandı</span>
              </div>
            </motion.div>

            {/* XP bilgisi */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white/5 rounded-2xl p-4 mb-6"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-xl font-bold text-white">{currentXP} / {requiredXP} XP</span>
              </div>
              <div className="flex items-center justify-center gap-1 text-sm">
                <Target className="w-4 h-4 text-purple-400" />
                <span className="text-purple-300">{remainingXP} XP daha gerekiyor</span>
              </div>
            </motion.div>

            {/* Motivasyon mesajı */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center justify-center gap-2 mb-6"
            >
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-white/80 font-medium">{getMotivationMessage()}</span>
            </motion.div>

            {/* Butonlar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="space-y-3"
            >
              <Link
                to="/profile"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all shadow-lg shadow-purple-500/25"
              >
                <Zap className="w-5 h-5" />
                XP Kazanmaya Başla
              </Link>
              <button
                onClick={onBack || (() => window.history.back())}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white/80 font-medium rounded-xl hover:bg-white/20 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                {onBack ? 'Kapat' : 'Geri Dön'}
              </button>
            </motion.div>
          </div>
        </div>

        {/* Alt ipucu */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-white/40 text-xs mt-4"
        >
          Quiz çöz, oyun oyna ve aktivitelere katıl → XP kazan!
        </motion.p>
      </motion.div>
    </div>
  );
};

export default XPWarning;
